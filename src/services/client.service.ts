import { randomUUID } from "crypto";
import * as Sentry from "@sentry/nextjs";
import { createTenantPrisma } from "@/lib/prisma-tenant";
import type { ICurrentUser } from "@/lib/auth";
import type { Client, PipelineStage } from "@prisma/client";
import {
  checkDuplicates,
  normalizePhone,
  type IDeduplicationResult,
} from "@/services/client-dedup";
import { triggerAutomations } from "@/services/automation-engine";
import {
  createNotification,
  createNotificationBulk,
} from "@/services/notification.service";

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
  // @ts-expect-error — Prisma $extends typing limitation on create()
  const client: Client = await db.client.create({
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
  });

  // 4. Log
  await db.activityLog.create({
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

  // 5. Notification — informer les superviseurs d'un nouveau client
  const supervisors = await db.user.findMany({
    where: { role: { in: ["SUPERVISOR", "CEO"] }, isActive: true },
    select: { id: true },
  });
  if (supervisors.length > 0) {
    await createNotificationBulk(
      supervisors
        .filter((s) => s.id !== user.userId) // ne pas notifier l'auteur
        .map((s) => ({
          tenantId: user.tenantId,
          userId: s.id,
          title: "Nouveau client",
          message: `${input.firstName} ${input.lastName} ajouté par ${user.firstName} ${user.lastName}`,
          type: "NEW_CLIENT" as const,
          link: `/clients/${client.id}`,
        })),
    );
  }

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
  await db.activityLog.create({
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
  const notifInputs = [];

  if (previousAgentId) {
    notifInputs.push({
      tenantId: user.tenantId,
      userId: previousAgentId,
      title: "Client réassigné",
      message: `${client.firstName} ${client.lastName} a été réassigné à un autre agent`,
      type: "REASSIGNMENT" as const,
      link: `/clients/${clientId}`,
    });
  }

  notifInputs.push({
    tenantId: user.tenantId,
    userId: newAgentId,
    title: "Nouveau client assigné",
    message: `${client.firstName} ${client.lastName} vous a été assigné`,
    type: "REASSIGNMENT" as const,
    link: `/clients/${clientId}`,
  });

  await createNotificationBulk(notifInputs);

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

  // Générer un token portail si passage à RESERVED ou SIGNED (et pas déjà généré)
  const portalStages: PipelineStage[] = ["RESERVED", "SIGNED"];
  const portalToken =
    portalStages.includes(newStage) && !client.portalToken
      ? randomUUID()
      : undefined;

  // Portal token expires in 180 days
  const portalTokenExpiresAt = portalToken
    ? new Date(Date.now() + 180 * 24 * 60 * 60 * 1000)
    : undefined;

  const updated = await db.client.update({
    where: { id: clientId },
    data: {
      pipelineStage: newStage,
      ...(portalToken ? { portalToken, portalTokenExpiresAt } : {}),
    },
  });

  // ── Stock Sync: auto-update property status based on pipeline stage ──
  if (updated.selectedPropertyId) {
    const stockSyncMap: Partial<Record<PipelineStage, "RESERVED" | "SOLD" | "AVAILABLE">> = {
      RESERVED: "RESERVED",
      SIGNED: "SOLD",
      CLOSED: "SOLD",
    };

    const newPropertyStatus = stockSyncMap[newStage];
    if (newPropertyStatus) {
      await db.property.update({
        where: { id: updated.selectedPropertyId },
        data: { status: newPropertyStatus },
      });
    }

    // If lead goes backwards (lost/reset), free the property
    const lostStages: PipelineStage[] = ["NEW", "CONTACTED", "QUALIFIED"];
    if (lostStages.includes(newStage) && ["RESERVED", "SIGNED"].includes(previousStage)) {
      await db.property.update({
        where: { id: updated.selectedPropertyId },
        data: { status: "AVAILABLE" },
      });
    }
  }

  // Log
  await db.activityLog.create({
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
        ...(portalToken ? { portalToken } : {}),
      },
    },
  });

  // Notifications — changement d'étape
  const stageLabels: Record<string, string> = {
    NEW: "Nouveau lead",
    CONTACTED: "Contacté",
    QUALIFIED: "Qualifié",
    VISIT_SCHEDULED: "Visite programmée",
    VISITED: "Visité",
    NEGOTIATION: "Négociation",
    RESERVED: "Réservé",
    SIGNED: "Signé",
    CLOSED: "Finalisé",
  };

  // Notifier l'agent assigné (s'il n'est pas l'auteur)
  if (client.assignedAgentId && client.assignedAgentId !== user.userId) {
    await createNotification({
      tenantId: user.tenantId,
      userId: client.assignedAgentId,
      title: "Changement d'étape",
      message: `${client.firstName} ${client.lastName} → ${stageLabels[newStage] ?? newStage}`,
      type: "STAGE_CHANGED",
      link: `/clients/${clientId}`,
    });
  }

  // Notifier les superviseurs pour les étapes critiques
  const criticalStages: PipelineStage[] = ["NEGOTIATION", "RESERVED", "SIGNED", "CLOSED"];
  if (criticalStages.includes(newStage)) {
    const supervisors = await db.user.findMany({
      where: { role: { in: ["SUPERVISOR", "CEO"] }, isActive: true, id: { not: user.userId } },
      select: { id: true },
    });
    if (supervisors.length > 0) {
      await createNotificationBulk(
        supervisors.map((s) => ({
          tenantId: user.tenantId,
          userId: s.id,
          title: `Pipeline : ${stageLabels[newStage] ?? newStage}`,
          message: `${client.firstName} ${client.lastName} est passé en ${stageLabels[newStage] ?? newStage}`,
          type: "STAGE_CHANGED" as const,
          link: `/clients/${clientId}`,
        })),
      );
    }
  }

  // Déclencher les automatisations configurées pour cette étape (non-bloquant)
  triggerAutomations(user.tenantId, clientId, newStage).catch((err) => {
    Sentry.captureException(err, { tags: { context: "Automation trigger error" } });
  });

  return updated;
}
