import { prisma } from "@/lib/prisma";
import {
  getWhatsAppTemplate,
  buildWhatsAppLink,
  hasWhatsAppApi,
  type IWhatsAppTemplateContext,
  type WhatsAppTemplateLanguage,
} from "@/lib/whatsapp-templates";
import { sendMessage, getWhatsAppConfig } from "@/services/whatsapp.service";
import type { PipelineStage } from "@prisma/client";

// ============================================================================
// Types
// ============================================================================

export type WhatsAppMode = "API" | "FALLBACK";

export interface IWhatsAppSendInput {
  tenantId: string;
  clientId: string;
  message?: string;
  pipelineStage?: PipelineStage;
  language?: WhatsAppTemplateLanguage;
  propertyId?: string;
  visitId?: string;
}

export interface IWhatsAppSendResult {
  mode: WhatsAppMode;
  /** Pour le mode API: true si envoye */
  success: boolean;
  /** Pour le mode FALLBACK: lien wa.me/ a ouvrir */
  whatsappLink: string | null;
  /** Message genere (template ou custom) */
  generatedMessage: string;
  error?: string;
}

// ============================================================================
// Detection auto du mode
// ============================================================================

/**
 * Detecte automatiquement si le tenant a l'API WhatsApp configuree.
 * Si oui -> mode API, sinon -> mode FALLBACK (wa.me/).
 */
export async function detectWhatsAppMode(
  tenantId: string,
): Promise<WhatsAppMode> {
  const config = await getWhatsAppConfig(tenantId);
  return config ? "API" : "FALLBACK";
}

// ============================================================================
// Envoi intelligent (API ou Fallback)
// ============================================================================

/**
 * Envoie un message WhatsApp de maniere intelligente :
 * - Si l'API est configuree -> envoi via API Cloud Meta
 * - Si pas d'API -> genere un lien wa.me/ avec message pre-rempli
 *
 * Dans les deux cas, l'interaction est loguee dans l'historique client.
 */
export async function sendWhatsAppSmart(
  input: IWhatsAppSendInput,
  userId: string,
): Promise<IWhatsAppSendResult> {
  // Charger le client
  const client = await prisma.client.findFirst({
    where: { id: input.clientId, tenantId: input.tenantId },
    select: {
      phone: true,
      firstName: true,
      lastName: true,
      pipelineStage: true,
      assignedAgent: { select: { firstName: true, lastName: true } },
    },
  });

  if (!client) {
    return {
      mode: "FALLBACK",
      success: false,
      whatsappLink: null,
      generatedMessage: "",
      error: "Client introuvable",
    };
  }

  // Charger les infos du tenant
  const tenant = await prisma.tenant.findUnique({
    where: { id: input.tenantId },
    select: { name: true, settings: true },
  });

  const tenantName = tenant?.name ?? "IMMO PRO-X";
  const tenantSettings = (tenant?.settings ?? {}) as Record<string, unknown>;

  // Charger le bien si specifie
  let propertyName: string | undefined;
  let price: string | undefined;
  if (input.propertyId) {
    const property = await prisma.property.findFirst({
      where: { id: input.propertyId, tenantId: input.tenantId },
      select: { name: true, price: true },
    });
    if (property) {
      propertyName = property.name;
      if (property.price) {
        price =
          new Intl.NumberFormat("fr-DZ", { maximumFractionDigits: 0 }).format(
            Number(property.price),
          ) + " DA";
      }
    }
  }

  // Charger la visite si specifiee
  let visitDate: string | undefined;
  let visitTime: string | undefined;
  if (input.visitId) {
    const visit = await prisma.visit.findFirst({
      where: { id: input.visitId, tenantId: input.tenantId },
      select: { scheduledAt: true },
    });
    if (visit) {
      visitDate = visit.scheduledAt.toLocaleDateString("fr-FR", {
        weekday: "long",
        day: "numeric",
        month: "long",
      });
      visitTime = visit.scheduledAt.toLocaleTimeString("fr-FR", {
        hour: "2-digit",
        minute: "2-digit",
      });
    }
  }

  // Construire le contexte du template
  const templateContext: IWhatsAppTemplateContext = {
    clientName: client.firstName,
    agentName: client.assignedAgent
      ? `${client.assignedAgent.firstName} ${client.assignedAgent.lastName}`
      : "Votre conseiller",
    companyName: tenantName,
    propertyName,
    visitDate,
    visitTime,
    price,
  };

  // Generer le message (custom ou template)
  const stage = input.pipelineStage ?? client.pipelineStage;
  const message =
    input.message ??
    getWhatsAppTemplate(stage, templateContext, input.language ?? "FR");

  // Detecter le mode
  const mode: WhatsAppMode = hasWhatsAppApi(tenantSettings) ? "API" : "FALLBACK";

  if (mode === "API") {
    // Envoi via API Cloud Meta
    const result = await sendMessage({
      tenantId: input.tenantId,
      phone: client.phone,
      message,
    });

    // Logger l'interaction
    await prisma.interaction.create({
      data: {
        tenantId: input.tenantId,
        clientId: input.clientId,
        userId,
        type: "WHATSAPP",
        direction: "OUT",
        content: message,
      },
    });

    return {
      mode: "API",
      success: result.success,
      whatsappLink: null,
      generatedMessage: message,
      error: result.error,
    };
  }

  // Mode FALLBACK — generer le lien wa.me/
  const whatsappLink = buildWhatsAppLink(client.phone, message);

  // Logger l'interaction comme "manuelle"
  await prisma.interaction.create({
    data: {
      tenantId: input.tenantId,
      clientId: input.clientId,
      userId,
      type: "WHATSAPP",
      direction: "OUT",
      content: `[Fallback wa.me/] ${message}`,
    },
  });

  return {
    mode: "FALLBACK",
    success: true,
    whatsappLink,
    generatedMessage: message,
  };
}
