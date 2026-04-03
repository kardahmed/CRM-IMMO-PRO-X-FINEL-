import { createTenantPrisma } from "@/lib/prisma-tenant";
import type { ICurrentUser } from "@/lib/auth";
import type { Client, UserRole } from "@prisma/client";

/** Rôles ayant accès à tous les clients du tenant */
const FULL_ACCESS_ROLES: UserRole[] = ["CEO", "ADMIN", "SUPERVISOR"];

/**
 * Retourne la liste des clients visibles par l'utilisateur.
 * - CEO / ADMIN / SUPERVISOR : tous les clients du tenant
 * - AGENT : uniquement ses clients (assignedAgentId = userId)
 * - ASSISTANT : tous les clients du tenant (lecture seule)
 */
export async function getVisibleClients(
  user: ICurrentUser,
  filters?: {
    pipelineStage?: string;
    source?: string;
    search?: string;
  },
): Promise<Client[]> {
  const db = createTenantPrisma(user.tenantId);

  const where: Record<string, unknown> = {};

  // Agent ne voit que ses clients
  if (user.role === "AGENT") {
    where.assignedAgentId = user.userId;
  }

  if (filters?.pipelineStage) {
    where.pipelineStage = filters.pipelineStage;
  }

  if (filters?.source) {
    where.source = filters.source;
  }

  if (filters?.search) {
    where.OR = [
      { firstName: { contains: filters.search, mode: "insensitive" } },
      { lastName: { contains: filters.search, mode: "insensitive" } },
      { phone: { contains: filters.search } },
      { email: { contains: filters.search, mode: "insensitive" } },
    ];
  }

  return db.client.findMany({
    where,
    orderBy: { updatedAt: "desc" },
  });
}

/**
 * Vérifie si l'utilisateur peut accéder à un client spécifique.
 * Retourne le client si accès autorisé, null sinon.
 */
export async function getClientIfAllowed(
  user: ICurrentUser,
  clientId: string,
): Promise<Client | null> {
  const db = createTenantPrisma(user.tenantId);

  const client = await db.client.findFirst({
    where: { id: clientId },
  });

  if (!client) {
    return null;
  }

  // Accès complet pour CEO/ADMIN/SUPERVISOR/ASSISTANT
  if (
    FULL_ACCESS_ROLES.includes(user.role) ||
    user.role === "ASSISTANT"
  ) {
    return client;
  }

  // Agent ne voit que ses clients
  if (user.role === "AGENT" && client.assignedAgentId !== user.userId) {
    return null;
  }

  return client;
}

/**
 * Réassigne un client à un autre agent.
 * Seuls CEO, ADMIN et SUPERVISOR peuvent réassigner.
 * Un AGENT ne peut PAS réassigner ses propres clients.
 */
export async function reassignClient(
  user: ICurrentUser,
  clientId: string,
  newAgentId: string,
): Promise<Client> {
  // Vérifier le droit de réassigner
  if (!FULL_ACCESS_ROLES.includes(user.role)) {
    throw new Error(
      "Accès refusé : seuls CEO, ADMIN et SUPERVISOR peuvent réassigner un client",
    );
  }

  const db = createTenantPrisma(user.tenantId);

  // Vérifier que le client existe dans ce tenant
  const client = await db.client.findFirst({
    where: { id: clientId },
  });

  if (!client) {
    throw new Error("Client introuvable dans ce tenant");
  }

  // Vérifier que le nouvel agent existe dans ce tenant et est actif
  const newAgent = await db.user.findFirst({
    where: {
      id: newAgentId,
      isActive: true,
    },
  });

  if (!newAgent) {
    throw new Error("Agent cible introuvable ou inactif dans ce tenant");
  }

  // Réassigner
  return db.client.update({
    where: { id: clientId },
    data: { assignedAgentId: newAgentId },
  });
}

/**
 * Vérifie si l'utilisateur peut modifier un client.
 * ASSISTANT = lecture seule, ne peut pas modifier.
 */
export function canModifyClient(user: ICurrentUser): boolean {
  return user.role !== "ASSISTANT";
}
