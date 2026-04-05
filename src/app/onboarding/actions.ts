"use server";

import { auth, clerkClient, currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import * as Sentry from "@sentry/nextjs";

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
  wilaya: z.string().max(100).optional(),
  phone: z.string().max(30).optional(),
});

/**
 * createWorkspace — called from onboarding page after sign-up.
 *
 * Every new user gets a DEMO workspace (14 days, limited features).
 * After the trial, the super admin converts them to a paid plan.
 *
 * Demo info (expiresAt, limits) is stored in the `settings` JSON field
 * to avoid dependency on DB columns that may not have been migrated yet.
 */
export async function createWorkspace(formData: FormData) {
  const { userId: clerkId } = await auth();
  if (!clerkId) {
    return { success: false as const, error: "Non authentifie" };
  }

  const parsed = createWorkspaceSchema.safeParse({
    name: formData.get("name"),
    type: formData.get("type"),
    wilaya: formData.get("wilaya") || undefined,
    phone: formData.get("phone") || undefined,
  });

  if (!parsed.success) {
    const firstError = parsed.error.issues[0]?.message || "Donnees invalides";
    return { success: false as const, error: firstError };
  }

  const { name, type, wilaya, phone: workspacePhone } = parsed.data;

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

    // 1. Create tenant + user in a transaction
    const result = await prisma.$transaction(async (tx) => {
      const tenant = await tx.tenant.create({
        data: {
          name,
          type,
          plan: "STARTER",
          status: "DEMO",
          settings: {
            demoExpiresAt: expiresAt.toISOString(),
            demoLimits: DEMO_LIMITS,
            ...(wilaya ? { wilaya } : {}),
            ...(workspacePhone ? { phone: workspacePhone } : {}),
          },
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

    // 2. Create DemoLead for super admin tracking (non-critical)
    try {
      await prisma.demoLead.create({
        data: {
          companyName: name,
          companyType: type,
          firstName: clerkUser.firstName || "",
          lastName: clerkUser.lastName || "",
          email,
          phone: phone || "",
          tenantId: result.tenant.id,
          status: "NEW",
        },
      });
    } catch {
      Sentry.captureMessage("[createWorkspace] DemoLead creation skipped (table may not exist)", "warning");
    }

    // 2b. Seed default automation configs (non-critical)
    try {
      const { seedAutomationConfigsForTenant } = await import("@/services/automation-seed.service");
      await seedAutomationConfigsForTenant(result.tenant.id);
    } catch (err) {
      Sentry.captureException(err, { tags: { context: "seedAutomationConfigs" } });
    }

    // 3. Update Clerk metadata — unlocks dashboard access
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
    Sentry.captureException(err, { tags: { context: "createWorkspace" }, extra: { message } });
    return { success: false as const, error: message };
  }
}
