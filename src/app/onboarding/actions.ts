"use server";

import { createSupabaseServerClient, createSupabaseAdminClient } from "@/lib/supabase-server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import * as Sentry from "@sentry/nextjs";

// Démo supprimée - passage en mode actif par défaut

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
 * Every new user gets an ACTIVE workspace by default.
 */
export async function createWorkspace(formData: FormData) {
  const supabase = await createSupabaseServerClient();
  const { data: { user: authUser } } = await supabase.auth.getUser();
  if (!authUser) {
    return { success: false as const, error: "Non authentifie" };
  }
  const supabaseId = authUser.id;

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

  // Already has a workspace
  if (authUser.user_metadata?.tenantId) {
    return { success: false as const, error: "Vous avez deja un espace de travail" };
  }

  const email = authUser.email || "";
  const phone = authUser.phone || null;
  const firstName = authUser.user_metadata?.firstName || "";
  const lastName = authUser.user_metadata?.lastName || "";

  try {
    // 1. Create tenant + user in a transaction
    const result = await prisma.$transaction(async (tx) => {
      const tenant = await tx.tenant.create({
        data: {
          name,
          type,
          plan: "STARTER",
          status: "ACTIVE",
          settings: {
            ...(wilaya ? { wilaya } : {}),
            ...(workspacePhone ? { phone: workspacePhone } : {}),
          },
        },
      });

      const user = await tx.user.create({
        data: {
          clerkId: supabaseId,
          tenantId: tenant.id,
          firstName,
          lastName,
          email,
          phone,
          role: "CEO",
          isActive: true,
        },
      });

      return { tenant, userId: user.id };
    });

    // DemoLead creation removed (Hardway cleanup)

    // 2b. Seed default automation configs (non-critical)
    try {
      const { seedAutomationConfigsForTenant } = await import("@/services/automation-seed.service");
      await seedAutomationConfigsForTenant(result.tenant.id);
    } catch (err) {
      Sentry.captureException(err, { tags: { context: "seedAutomationConfigs" } });
    }

    // 3. Update Supabase user metadata — unlocks dashboard access
    const supabaseAdmin = createSupabaseAdminClient();
    await supabaseAdmin.auth.admin.updateUserById(supabaseId, {
      user_metadata: {
        tenantId: result.tenant.id,
        role: "CEO",
        workspaceType: type,
        plan: "STARTER",
        dbUserId: result.userId,
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
