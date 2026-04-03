import { prisma } from "@/lib/prisma";
import { createTenantPrisma } from "@/lib/prisma-tenant";
import {
  checkDuplicates,
  normalizePhone,
} from "@/services/client-dedup";
import { triggerAutomations } from "@/services/automation-engine";
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
    await prisma.activityLog.create({
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
  const client = await (db.client.create as unknown as (...args: unknown[]) => Promise<unknown>)({
    data: {
      firstName: payload.firstName,
      lastName: payload.lastName,
      phone: normalizedPhone,
      email: payload.email?.toLowerCase() ?? null,
      source: "FACEBOOK",
      pipelineStage: "NEW",
      assignedAgentId: null, // Sera assigné par le Superviseur
    },
  }) as Client;

  // 3. Notifier tous les Superviseurs + CEO
  const managers = await db.user.findMany({
    where: {
      role: { in: ["SUPERVISOR", "CEO"] },
      isActive: true,
    },
    select: { id: true },
  });

  if (managers.length > 0) {
    await prisma.notification.createMany({
      data: managers.map((m) => ({
        tenantId,
        userId: m.id,
        title: "Nouveau lead Facebook",
        message: `${payload.firstName} ${payload.lastName} — ${normalizedPhone}${payload.formName ? ` (formulaire: ${payload.formName})` : ""}`,
        type: "FACEBOOK_LEAD",
        isRead: false,
        link: `/leads/unassigned`,
      })),
    });
  }

  // 4. Log
  await prisma.activityLog.create({
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

  // 5. Déclencher les automatisations pour l'étape NEW (non-bloquant)
  triggerAutomations(tenantId, client.id, "NEW").catch((err) => {
    console.error("[Facebook Lead automation error]", err);
  });

  return {
    action: "CREATED",
    clientId: client.id,
  };
}
