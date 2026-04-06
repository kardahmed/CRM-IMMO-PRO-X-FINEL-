import { createSupabaseServerClient } from "@/lib/supabase-server";
import { prisma } from "@/lib/prisma";
import { getSimulatedContext } from "@/lib/simulation-server";
import type { UserRole } from "@prisma/client";

/** Email du super administrateur de la plateforme */
export const SUPER_ADMIN_EMAIL = "contact@sensium-x.com";

export interface ICurrentUser {
  userId: string;
  /** null pour le super admin plateforme (pas de tenant) */
  tenantId: string | null;
  role: UserRole;
  supabaseId: string;
  firstName: string;
  lastName: string;
  email: string;
  /** true si l'utilisateur est le propriétaire de la plateforme */
  isSuperAdmin: boolean;
}

/**
 * Récupère l'utilisateur courant depuis Supabase Auth + DB.
 *
 * Le Super Admin est le propriétaire de la plateforme :
 * - Identifié par email (SUPER_ADMIN_EMAIL)
 * - N'appartient à aucun tenant (tenantId = null)
 * - Rôle = SUPER_ADMIN
 * - Pas besoin d'un enregistrement dans la table users
 *
 * Les utilisateurs normaux doivent avoir un enregistrement DB avec un tenantId.
 */
export async function getCurrentUser(): Promise<ICurrentUser> {
  const supabase = await createSupabaseServerClient();
  const { data: { user: authUser }, error } = await supabase.auth.getUser();

  if (error || !authUser) {
    throw new Error("Non authentifié");
  }

  const isSuperAdmin = authUser.email === SUPER_ADMIN_EMAIL;

  // Super Admin plateforme — pas besoin de record DB
  if (isSuperAdmin) {
    // Vérifier si le super admin simule un tenant (via cookies)
    const sim = await getSimulatedContext();
    const simulatedTenantId = sim.isSimulating ? sim.tenantId : null;

    return {
      userId: authUser.id,
      tenantId: simulatedTenantId,
      role: "SUPER_ADMIN" as UserRole,
      supabaseId: authUser.id,
      firstName: authUser.user_metadata?.first_name || "Super",
      lastName: authUser.user_metadata?.last_name || "Admin",
      email: authUser.email || SUPER_ADMIN_EMAIL,
      isSuperAdmin: true,
    };
  }

  // Utilisateur normal — lookup DB obligatoire
  const dbUser = await prisma.user.findFirst({
    where: {
      supabaseId: authUser.id,
      isActive: true,
    },
  });

  if (!dbUser) {
    throw new Error("Utilisateur introuvable en base de données");
  }

  if (!dbUser.tenantId) {
    throw new Error("Aucun tenant associé à cet utilisateur");
  }

  return {
    userId: dbUser.id,
    tenantId: dbUser.tenantId,
    role: dbUser.role,
    supabaseId: authUser.id,
    firstName: dbUser.firstName,
    lastName: dbUser.lastName,
    email: dbUser.email,
    isSuperAdmin: false,
  };
}

/**
 * Vérifie si l'utilisateur courant est un Super Admin.
 * Utilisé dans les routes admin qui ne passent pas par apiHandler.
 */
export async function getAdminUser(): Promise<{ supabaseId: string; role: UserRole; isSuperAdmin: boolean } | null> {
  const supabase = await createSupabaseServerClient();
  const { data: { user: authUser } } = await supabase.auth.getUser();

  if (!authUser) return null;

  // Super Admin plateforme — identifié par email, pas besoin de record DB
  if (authUser.email === SUPER_ADMIN_EMAIL) {
    return { supabaseId: authUser.id, role: "SUPER_ADMIN" as UserRole, isSuperAdmin: true };
  }

  const dbUser = await prisma.user.findFirst({
    where: { supabaseId: authUser.id, isActive: true },
    select: { role: true },
  });

  if (!dbUser) return null;

  return { supabaseId: authUser.id, role: dbUser.role, isSuperAdmin: false };
}
