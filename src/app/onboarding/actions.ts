"use server";

import { auth, clerkClient, currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const DEMO_DURATION_DAYS = 14;

const DEMO_LIMITS = {
  maxClients: 5,
  maxProperties: 3,
  maxUsers: 1,
};

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

/**
 * createWorkspace — called from onboarding page after sign-up.
 *
 * Every new user gets a DEMO workspace (14 days, limited features).
 * After the trial, the super admin converts them to a paid plan.
 *
 * Also creates a DemoLead record for super admin tracking.
 */
export async function createWorkspace(formData: FormData) {
  const { userId: clerkId } = await auth();
  if (!clerkId) {
    return { success: false as const, error: "Non authentifie" };
  }

  const parsed = createWorkspaceSchema.safeParse({
    name: formData.get("name"),
    type: formData.get("type"),
  });

  if (!parsed.success) {
    const firstError = parsed.error.issues[0]?.message || "Donnees invalides";
    return { success: false as const, error: firstError };
  }

  const { name, type } = parsed.data;

  const clerkUser = await currentUser();
  if (!clerkUser) {
    return { success: false as const, error: "Utilisateur Clerk introuvable" };
  }

  // Already has a workspace
  const existingMetadata = clerkUser.publicMetadata as { tenantId?: string };
  if (existingMetadata.tenantId) {
    return { success: false as const, error: "Vous avez deja un espace de travail" };
  }

  const email = clerkUser.emailAddresses?.[0]?.emailAddress || "";
  const phone = clerkUser.phoneNumbers?.[0]?.phoneNumber || null;

  try {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + DEMO_DURATION_DAYS);

    const result = await prisma.$transaction(async (tx) => {
      // 1. Create DEMO tenant
      const tenant = await tx.tenant.create({
        data: {
          name,
          type,
          plan: "STARTER",
          status: "DEMO",
          demoExpiresAt: expiresAt,
          demoLimits: DEMO_LIMITS,
          settings: {},
        },
      });

      // 2. Create CEO user
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

      // 3. Create DemoLead for super admin tracking
      await tx.demoLead.create({
        data: {
          companyName: name,
          companyType: type,
          firstName: clerkUser.firstName || "",
          lastName: clerkUser.lastName || "",
          email,
          phone: phone || "",
          tenantId: tenant.id,
          status: "NEW",
        },
      });

      return { tenant };
    });

    // Update Clerk metadata — unlocks dashboard access
    const client = await clerkClient();
    await client.users.updateUserMetadata(clerkId, {
      publicMetadata: {
        tenantId: result.tenant.id,
        role: "CEO",
        workspaceType: type,
        plan: "STARTER",
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
