import { auth, currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import type { UserRole } from "@prisma/client";

export interface ICurrentUser {
  userId: string;
  tenantId: string;
  role: UserRole;
  clerkId: string;
  firstName: string;
  lastName: string;
  email: string;
}

/**
 * Récupère l'utilisateur courant depuis Clerk + DB.
 * Le tenantId et le role sont stockés dans publicMetadata côté Clerk.
 * On fait aussi un lookup DB pour avoir les données complètes.
 */
export async function getCurrentUser(): Promise<ICurrentUser> {
  const { userId: clerkId } = await auth();

  if (!clerkId) {
    throw new Error("Non authentifié");
  }

  const clerkUser = await currentUser();
  if (!clerkUser) {
    throw new Error("Utilisateur Clerk introuvable");
  }

  const metadata = clerkUser.publicMetadata as {
    tenantId?: string;
    role?: UserRole;
  };

  if (!metadata.tenantId) {
    throw new Error("Aucun tenant associé à cet utilisateur");
  }

  const dbUser = await prisma.user.findFirst({
    where: {
      clerkId,
      tenantId: metadata.tenantId,
      isActive: true,
    },
  });

  if (!dbUser) {
    throw new Error("Utilisateur introuvable en base de données");
  }

  return {
    userId: dbUser.id,
    tenantId: dbUser.tenantId,
    role: dbUser.role,
    clerkId: dbUser.clerkId,
    firstName: dbUser.firstName,
    lastName: dbUser.lastName,
    email: dbUser.email,
  };
}
