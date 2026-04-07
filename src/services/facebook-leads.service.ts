import { createTenantPrisma } from "@/lib/prisma-tenant";
import {
  checkDuplicates,
  normalizePhone,
} from "@/services/client-dedup";
import { createNotificationBulk } from "@/services/notification.service";
import type { Client } from "@prisma/client";

// ============================================================================
// Types
// ============================================================================

export interface IFacebookLeadPayload {
  leadId: string;
  formId: string;
  formName?: string;
  firstName: string;
  lastName: string;
  phone: string;
  email?: string;
  adName?: string;
  createdTime: string;
}

export interface IFacebookLeadResult {
  action: "CREATED" | "DUPLICATE" | "ERROR";
  clientId: string | null;
  duplicateClientId?: string;
  error?: string;
}

// ============================================================================
// Process lead
// ============================================================================

/**
 * Traite un lead Facebook entrant.
 * - Vérifie les doublons par téléphone (bloquant)
 * - Crée le client avec source=FACEBOOK, pipelineStage=NEW, assignedAgentId=NULL
 * - Notifie tous les Superviseurs + CEO
 * - Déclenche les automatisations pour l'étape NEW
 */
export async function processFacebookLead(
  tenantId: string,
  payload: IFacebookLeadPayload,
): Promise<IFacebookLeadResult> {
  const normalizedPhone = normalizePhone(payload.phone);

  // 1. Vérifier les doublons
  const dedup = await checkDuplicates(tenantId, {
    phone: normalizedPhone,
    email: payload.email,
    firstName: payload.firstName,
    lastName: payload.lastName,
  });

  if (!dedup.canCreate) {
    const existing = dedup.duplicates.find((d) => d.type === "PHONE_EXACT");

    // Log le doublon
    const dbForLog = createTenantPrisma(tenantId);
    await dbForLog.activityLog.create({
      data: {
        tenantId,
        userId: "SYSTEM",
        action: "FACEBOOK_LEAD_DUPLICATE",
        entity: "Client",
        entityId: existing?.existingClientId ?? "unknown",
        metadata: {
          facebookLeadId: payload.leadId,
          phone: normalizedPhone,
          existingClientName: existing?.existingClientName,
        },
      },
    });

    return {
      action: "DUPLICATE",
      clientId: null,
      duplicateClientId: existing?.existingClientId,
    };
  }

  // 2. Créer le client — source FACEBOOK, non assigné
  const db = createTenantPrisma(tenantId);
  // @ts-expect-error — Prisma $extends typing limitation on create()
  const client: Client = await db.client.create({
    data: {
      firstName: payload.firstName,
      lastName: payload.lastName,
      phone: normalizedPhone,
      email: payload.email?.toLowerCase() ?? null,
      source: "FACEBOOK",
      pipelineStage: "NEW",
      assignedAgentId: null, // Sera assigné par le Superviseur
    },
  });

  // 3. Notifier tous les Superviseurs + CEO
  const managers = await db.user.findMany({
    where: {
      role: { in: ["SUPERVISOR", "CEO"] },
      isActive: true,
    },
    select: { id: true },
  });

  if (managers.length > 0) {
    await createNotificationBulk(
      managers.map((m) => ({
        tenantId,
        userId: m.id,
        title: "Nouveau lead Facebook",
        message: `${payload.firstName} ${payload.lastName} — ${normalizedPhone}${payload.formName ? ` (formulaire: ${payload.formName})` : ""}`,
        type: "FACEBOOK_LEAD" as const,
        link: `/leads/unassigned`,
      })),
    );
  }

  // 4. Log
  await db.activityLog.create({
    data: {
      tenantId,
      userId: "SYSTEM",
      action: "FACEBOOK_LEAD_CREATED",
      entity: "Client",
      entityId: client.id,
      metadata: {
        clientName: `${payload.firstName} ${payload.lastName}`,
        phone: normalizedPhone,
        facebookLeadId: payload.leadId,
        formId: payload.formId,
        formName: payload.formName,
        adName: payload.adName,
        alerts: dedup.duplicates
          .filter((d) => d.type !== "PHONE_EXACT")
          .map((d) => d.type),
      },
    },
  });

  // 5. Ne PAS déclencher les automatisations ici — le lead n'a pas d'agent assigné.
  // Les automatisations seront déclenchées à l'assignation via POST /leads/[id]/assign.
  // triggerAutomations sans agent assigné créerait des tâches orphelines.

  return {
    action: "CREATED",
    clientId: client.id,
  };
}
