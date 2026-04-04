"use server";

import { auth, clerkClient, currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import type { WorkspaceType } from "@prisma/client";

const createWorkspaceSchema = z.object({
  name: z
    .string()
    .min(2, "Le nom doit contenir au moins 2 caracteres")
    .max(100, "Le nom ne peut pas depasser 100 caracteres")
    .trim(),
  type: z.enum(["AGENCY", "PROMOTION"], {
    error: "Type d'activite invalide",
  }),
});

export async function createWorkspace(formData: FormData) {
  const { userId: clerkId } = await auth();
  if (!clerkId) {
    return { success: false as const, error: "Non authentifie" };
  }

  // Validation Zod
  const parsed = createWorkspaceSchema.safeParse({
    name: formData.get("name"),
    type: formData.get("type"),
  });

  if (!parsed.success) {
    const firstError = parsed.error.issues[0]?.message || "Donnees invalides";
    return { success: false as const, error: firstError };
  }

  const { name, type } = parsed.data;

  // Recuperer les infos Clerk pour creer le User en DB
  const clerkUser = await currentUser();
  if (!clerkUser) {
    return { success: false as const, error: "Utilisateur Clerk introuvable" };
  }

  // Verifier que l'utilisateur n'a pas deja un tenant
  const existingMetadata = clerkUser.publicMetadata as { tenantId?: string };
  if (existingMetadata.tenantId) {
    return { success: false as const, error: "Vous avez deja un espace de travail" };
  }

  const email = clerkUser.emailAddresses?.[0]?.emailAddress || "";
  const phone = clerkUser.phoneNumbers?.[0]?.phoneNumber || null;

  try {
    // Check if a DemoLead exists with this email → reuse that tenant
    const demoLead = email
      ? await prisma.demoLead.findFirst({
          where: { email, tenantId: { not: null } },
        })
      : null;

    const demoTenant = demoLead?.tenantId
      ? await prisma.tenant.findUnique({ where: { id: demoLead.tenantId } })
      : null;

    let tenantId: string;
    let workspaceType: WorkspaceType;
    let plan: string;

    if (demoTenant) {
      // Reuse the existing demo tenant
      tenantId = demoTenant.id;
      workspaceType = demoTenant.type;
      plan = demoTenant.plan;

      // Update tenant name if user provided a different one
      await prisma.$transaction(async (tx) => {
        // Update tenant with user's chosen name
        await tx.tenant.update({
          where: { id: tenantId },
          data: { name },
        });

        // Create the User record in this tenant
        await tx.user.create({
          data: {
            clerkId,
            tenantId,
            firstName: clerkUser.firstName || "",
            lastName: clerkUser.lastName || "",
            email,
            phone,
            role: "CEO",
            isActive: true,
          },
        });

        // Update DemoLead status
        if (demoLead) {
          await tx.demoLead.update({
            where: { id: demoLead.id },
            data: { status: "CONVERTED" },
          });
        }
      });
    } else {
      // Create a brand new workspace
      workspaceType = type;
      plan = "STARTER";

      const result = await prisma.$transaction(async (tx) => {
        const tenant = await tx.tenant.create({
          data: {
            name,
            type,
            plan: "STARTER",
            status: "ACTIVE",
          },
        });

        await tx.user.create({
          data: {
            clerkId,
            tenantId: tenant.id,
            firstName: clerkUser.firstName || "",
            lastName: clerkUser.lastName || "",
            email,
            phone,
            role: "CEO",
            isActive: true,
          },
        });

        return { tenant };
      });

      tenantId = result.tenant.id;
    }

    // Update Clerk metadata — this is what unlocks dashboard access
    const client = await clerkClient();
    await client.users.updateUserMetadata(clerkId, {
      publicMetadata: {
        tenantId,
        role: "CEO",
        workspaceType,
        plan,
      },
    });

    return { success: true as const };
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Erreur lors de la creation";
    console.error("[createWorkspace]", message);
    return { success: false as const, error: message };
  }
}
