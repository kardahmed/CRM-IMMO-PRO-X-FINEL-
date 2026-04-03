import { createTenantPrisma } from "@/lib/prisma-tenant";
import { prisma } from "@/lib/prisma";
import type { ICurrentUser } from "@/lib/auth";
import type { Client, PipelineStage } from "@prisma/client";
import {
  checkDuplicates,
  normalizePhone,
  type IDeduplicationResult,
} from "@/services/client-dedup";

// ============================================================================
// Types
// ============================================================================

export interface ICreateClientInput {
  firstName: string;
  lastName: string;
  phone: string;
  email?: string | null;
  source?: string;
  budgetMin?: number | null;
  budgetMax?: number | null;
  desiredType?: string | null;
  desiredWilaya?: string | null;
  desiredRooms?: number | null;
  desiredSurface?: number | null;
}

export interface ICreateClientResult {
  client: Client | null;
  dedup: IDeduplicationResult;
}

export interface IReassignResult {
  client: Client;
  previousAgentId: string | null;
  newAgentId: string;
}

// ============================================================================
// CREATE
// ============================================================================

/**
 * Crée un client avec dedup complet.
 * - Normalise le téléphone
 * - Vérifie les doublons (tél = bloquant, email/nom = alerte)
 * - Si Facebook, assigne au Superviseur
 * - Log dans ActivityLog
 */
export async function createClient(
  user: ICurrentUser,
  input: ICreateClientInput,
): Promise<ICreateClientResult> {
  const normalizedPhone = normalizePhone(input.phone);

  // 1. Dedup
  const dedup = await checkDuplicates(user.tenantId, {
    phone: normalizedPhone,
    email: input.email,
    firstName: input.firstName,
    lastName: input.lastName,
  });

  if (!dedup.canCreate) {
    return { client: null, dedup };
  }

  // 2. Déterminer l'agent assigné
  let assignedAgentId: string | null = user.userId;

  // Facebook leads → assignés au Superviseur (pas à l'agent)
  if (input.source === "FACEBOOK") {
    assignedAgentId = null; // Sera assigné par le Superviseur
  }

  // 3. Créer le client
  const db = createTenantPrisma(user.tenantId);
  // tenantId est auto-injecté par createTenantPrisma via $extends
  const client = await (db.client.create as unknown as (...args: unknown[]) => Promise<unknown>)({
    data: {
      firstName: input.firstName,
      lastName: input.lastName,
      phone: normalizedPhone,
      email: input.email?.toLowerCase() ?? null,
      source: (input.source as Client["source"]) ?? "OTHER",
      budgetMin: input.budgetMin ?? null,
      budgetMax: input.budgetMax ?? null,
      desiredType: (input.desiredType as Client["desiredType"]) ?? null,
      desiredWilaya: input.desiredWilaya ?? null,
      desiredRooms: input.desiredRooms ?? null,
      desiredSurface: input.desiredSurface ?? null,
      assignedAgentId,
      pipelineStage: "NEW",
    },
  }) as Client;

  // 4. Log
  await prisma.activityLog.create({
    data: {
      tenantId: user.tenantId,
      userId: user.userId,
      action: "CLIENT_CREATED",
      entity: "Client",
      entityId: client.id,
      metadata: {
        clientName: `${input.firstName} ${input.lastName}`,
        phone: normalizedPhone,
        source: input.source ?? "OTHER",
        alerts: dedup.duplicates
          .filter((d) => d.type !== "PHONE_EXACT")
          .map((d) => d.type),
      },
    },
  });

  return { client, dedup };
}

// ============================================================================
// REASSIGN
// ============================================================================

/**
 * Réassigne un client.
 * - Seuls CEO, ADMIN, SUPERVISOR peuvent réassigner
 * - Conserve l'historique (ancien agent dans ActivityLog)
 * - Notifie l'ancien et le nouvel agent
 */
export async function reassignClient(
  user: ICurrentUser,
  clientId: string,
  newAgentId: string,
): Promise<IReassignResult> {
  const allowedRoles = ["CEO", "ADMIN", "SUPERVISOR"] as const;
  if (!(allowedRoles as readonly string[]).includes(user.role)) {
    throw new Error(
      "Accès refusé : seuls CEO, ADMIN et SUPERVISOR peuvent réassigner un client",
    );
  }

  const db = createTenantPrisma(user.tenantId);

  // Vérifier que le client existe
  const client = await db.client.findFirst({
    where: { id: clientId },
  });
  if (!client) {
    throw new Error("Client introuvable");
  }

  // Vérifier que le nouvel agent existe et est actif
  const newAgent = await db.user.findFirst({
    where: { id: newAgentId, isActive: true },
  });
  if (!newAgent) {
    throw new Error("Agent cible introuvable ou inactif");
  }

  const previousAgentId = client.assignedAgentId;

  // Réassigner
  const updated = await db.client.update({
    where: { id: clientId },
    data: { assignedAgentId: newAgentId },
  });

  // Log historique
  await prisma.activityLog.create({
    data: {
      tenantId: user.tenantId,
      userId: user.userId,
      action: "CLIENT_REASSIGNED",
      entity: "Client",
      entityId: clientId,
      metadata: {
        clientName: `${client.firstName} ${client.lastName}`,
        previousAgentId,
        newAgentId,
        reassignedBy: user.userId,
      },
    },
  });

  // Notifications
  const notificationData = [];

  if (previousAgentId) {
    notificationData.push({
      tenantId: user.tenantId,
      userId: previousAgentId,
      title: "Client réassigné",
      message: `${client.firstName} ${client.lastName} a été réassigné à un autre agent`,
      type: "REASSIGNMENT",
      isRead: false,
    });
  }

  notificationData.push({
    tenantId: user.tenantId,
    userId: newAgentId,
    title: "Nouveau client assigné",
    message: `${client.firstName} ${client.lastName} vous a été assigné`,
    type: "REASSIGNMENT",
    isRead: false,
  });

  await prisma.notification.createMany({ data: notificationData });

  return { client: updated, previousAgentId, newAgentId };
}

// ============================================================================
// CHANGE STAGE
// ============================================================================

/**
 * Change l'étape du pipeline d'un client.
 * Log le changement. Préparé pour déclencher les automatisations futures.
 */
export async function changeClientStage(
  user: ICurrentUser,
  clientId: string,
  newStage: PipelineStage,
): Promise<Client> {
  const db = createTenantPrisma(user.tenantId);

  const client = await db.client.findFirst({
    where: { id: clientId },
  });
  if (!client) {
    throw new Error("Client introuvable");
  }

  const previousStage = client.pipelineStage;

  const updated = await db.client.update({
    where: { id: clientId },
    data: { pipelineStage: newStage },
  });

  // Log
  await prisma.activityLog.create({
    data: {
      tenantId: user.tenantId,
      userId: user.userId,
      action: "CLIENT_STAGE_CHANGED",
      entity: "Client",
      entityId: clientId,
      metadata: {
        clientName: `${client.firstName} ${client.lastName}`,
        previousStage,
        newStage,
      },
    },
  });

  // TODO: Déclencher les automatisations configurées pour cette étape
  // await triggerAutomations(user.tenantId, newStage, clientId);

  return updated;
}
