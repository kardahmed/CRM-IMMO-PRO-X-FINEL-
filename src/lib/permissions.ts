import { getCurrentUser, type ICurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { UserRole } from "@prisma/client";

/**
 * Vérifie que l'utilisateur courant a l'un des rôles autorisés.
 * Lance une erreur si le rôle n'est pas dans la liste.
 */
export async function requireRole(
  allowedRoles: UserRole[],
): Promise<ICurrentUser> {
  const user = await getCurrentUser();

  if (!allowedRoles.includes(user.role)) {
    throw new Error(
      `Accès refusé. Rôle requis : ${allowedRoles.join(", ")}`,
    );
  }

  return user;
}

/**
 * Vérifie que l'utilisateur courant est bien associé à un tenant.
 * Retourne le user avec son tenantId garanti.
 */
export async function requireTenant(): Promise<ICurrentUser> {
  const user = await getCurrentUser();

  if (!user.tenantId) {
    throw new Error("Aucun tenant associé");
  }

  return user;
}

/**
 * Vérifie que l'utilisateur courant peut accéder à un client donné.
 * - CEO / ADMIN : accès à tous les clients du tenant
 * - SUPERVISOR : accès aux clients de son équipe (ses agents)
 * - AGENT : accès uniquement à ses clients assignés
 * - ASSISTANT : lecture seule sur les clients du tenant
 */
export async function canAccessClient(clientId: string): Promise<boolean> {
  const user = await getCurrentUser();

  const client = await prisma.client.findFirst({
    where: {
      id: clientId,
      tenantId: user.tenantId!,
    },
    select: {
      assignedAgentId: true,
    },
  });

  if (!client) {
    return false;
  }

  // CEO et ADMIN voient tout le tenant
  if (user.role === "CEO" || user.role === "ADMIN") {
    return true;
  }

  // ASSISTANT a accès en lecture à tout le tenant
  if (user.role === "ASSISTANT") {
    return true;
  }

  // AGENT ne voit que ses propres clients
  if (user.role === "AGENT") {
    return client.assignedAgentId === user.userId;
  }

  // SUPERVISOR voit ses propres clients + ceux de ses agents
  if (user.role === "SUPERVISOR") {
    if (client.assignedAgentId === user.userId) {
      return true;
    }
    // Vérifier si l'agent assigné fait partie de l'équipe du superviseur
    // (pour l'instant, un superviseur voit tous les clients du tenant)
    return true;
  }

  return false;
}
