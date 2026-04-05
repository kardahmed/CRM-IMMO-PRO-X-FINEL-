import { createSupabaseServerClient } from "@/lib/supabase-server";
import { prisma } from "@/lib/prisma";
import type { UserRole } from "@prisma/client";

export interface ICurrentUser {
  userId: string;
  tenantId: string;
  role: UserRole;
  supabaseId: string;
  firstName: string;
  lastName: string;
  email: string;
}

/**
 * Récupère l'utilisateur courant depuis Supabase Auth + DB.
 * La session Supabase fournit le supabaseId (auth.uid).
 * On fait un lookup DB pour avoir tenantId, role et les données complètes.
 */
export async function getCurrentUser(): Promise<ICurrentUser> {
  const supabase = await createSupabaseServerClient();
  const { data: { user: authUser }, error } = await supabase.auth.getUser();

  if (error || !authUser) {
    throw new Error("Non authentifié");
  }

  // Bypass spécial pour le compte Super Administrateur
  const isSuperAdminEmail = authUser.email === "contact@sensium-x.com";

  const dbUser = await prisma.user.findFirst({
    where: {
      supabaseId: authUser.id,
      isActive: true,
    },
  });

  if (isSuperAdminEmail) {
    return {
      userId: dbUser?.id || "super-admin-id",
      tenantId: dbUser?.tenantId || "master-tenant",
      role: "ADMIN" as UserRole,
      supabaseId: authUser.id,
      firstName: dbUser?.firstName || authUser.user_metadata?.first_name || "Super",
      lastName: dbUser?.lastName || authUser.user_metadata?.last_name || "Admin",
      email: authUser.email || "contact@sensium-x.com",
    };
  }

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
  };
}

/**
 * Vérifie si l'utilisateur courant est un Super Admin.
 * Utilisé dans les routes admin qui ne passent pas par apiHandler.
 */
export async function getAdminUser(): Promise<{ supabaseId: string; role: UserRole } | null> {
  const supabase = await createSupabaseServerClient();
  const { data: { user: authUser } } = await supabase.auth.getUser();

  if (!authUser) return null;

  const dbUser = await prisma.user.findFirst({
    where: { supabaseId: authUser.id, isActive: true },
    select: { role: true },
  });

  if (!dbUser) return null;

  return { supabaseId: authUser.id, role: dbUser.role };
}
