import { prisma } from "@/lib/prisma";
import { createTenantPrisma } from "@/lib/prisma-tenant";
import { normalizePhone } from "@/services/client-dedup";
import {
  createNotification,
  createNotificationBulk,
} from "@/services/notification.service";
import { decrypt, isEncrypted } from "@/lib/encryption";

// ============================================================================
// Types
// ============================================================================

export interface ISendMessageInput {
  tenantId: string;
  phone: string;
  message: string;
}

export interface ISendMessageResult {
  success: boolean;
  messageId: string | null;
  error?: string;
}

export interface IIncomingWhatsApp {
  from: string; // phone number
  body: string;
  messageId: string;
  timestamp: number;
}

export interface IWebhookResult {
  clientId: string | null;
  interactionId: string | null;
  isNewContact: boolean;
  routedToAgentId: string | null;
}

interface ITenantWhatsAppConfig {
  whatsappApiUrl?: string;
  whatsappApiKey?: string;
  whatsappPhoneId?: string;
}

// ============================================================================
// Configuration
// ============================================================================

/**
 * Récupère la config WhatsApp d'un tenant depuis settings (JSON).
 * Les clés sont stockées dans Tenant.settings.whatsapp.
 */
export async function getWhatsAppConfig(
  tenantId: string,
): Promise<ITenantWhatsAppConfig | null> {
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { settings: true },
  });
  if (!tenant) return null;

  const settings = tenant.settings as Record<string, unknown>;
  const wa = settings?.whatsapp as ITenantWhatsAppConfig | undefined;
  if (!wa?.whatsappApiKey || !wa?.whatsappPhoneId) return null;

  // Decrypt API key if stored encrypted
  const apiKey = isEncrypted(wa.whatsappApiKey) ? decrypt(wa.whatsappApiKey) : wa.whatsappApiKey;

  return { ...wa, whatsappApiKey: apiKey };
}

// ============================================================================
// SEND MESSAGE
// ============================================================================

/**
 * Envoie un message WhatsApp via l'API Cloud (Meta).
 * Utilise la config du tenant (clé API + Phone ID dans settings).
 */
export async function sendMessage(
  input: ISendMessageInput,
): Promise<ISendMessageResult> {
  const config = await getWhatsAppConfig(input.tenantId);
  if (!config) {
    return {
      success: false,
      messageId: null,
      error: "WhatsApp non configuré pour ce workspace. Ajoutez la clé API dans Paramètres.",
    };
  }

  const apiUrl =
    config.whatsappApiUrl ??
    `https://graph.facebook.com/v21.0/${config.whatsappPhoneId}/messages`;

  try {
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.whatsappApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: normalizePhone(input.phone).replace("+", ""),
        type: "text",
        text: { body: input.message },
      }),
    });

    if (!response.ok) {
      const errBody = (await response.json().catch(() => null)) as Record<string, unknown> | null;
      const errMsg =
        (errBody?.error as Record<string, unknown>)?.message ?? response.statusText;
      return { success: false, messageId: null, error: String(errMsg) };
    }

    const data = (await response.json()) as { messages?: Array<{ id: string }> };
    const messageId = data.messages?.[0]?.id ?? null;

    return { success: true, messageId };
  } catch (err) {
    return {
      success: false,
      messageId: null,
      error: err instanceof Error ? err.message : "Erreur réseau",
    };
  }
}

// ============================================================================
// RECEIVE MESSAGE (webhook processing)
// ============================================================================

/**
 * Traite un message WhatsApp entrant.
 * - Identifie le contact par téléphone dans le tenant
 * - Route vers l'agent assigné
 * - Crée une Interaction WHATSAPP (IN)
 * - Si contact inconnu → notification Superviseur
 */
export async function receiveMessage(
  tenantId: string,
  incoming: IIncomingWhatsApp,
): Promise<IWebhookResult> {
  const normalizedPhone = normalizePhone(incoming.from);
  const db = createTenantPrisma(tenantId);

  // Chercher le client par téléphone
  const client = await db.client.findFirst({
    where: { phone: normalizedPhone },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      assignedAgentId: true,
    },
  });

  if (!client) {
    // Contact inconnu → notifier tous les Superviseurs + CEO
    const supervisors = await db.user.findMany({
      where: { role: { in: ["SUPERVISOR", "CEO"] }, isActive: true },
      select: { id: true },
    });

    if (supervisors.length > 0) {
      await createNotificationBulk(
        supervisors.map((s) => ({
          tenantId,
          userId: s.id,
          title: "Nouveau contact inconnu (WhatsApp)",
          message: `Message reçu de ${normalizedPhone} : "${incoming.body.substring(0, 100)}${incoming.body.length > 100 ? "..." : ""}"`,
          type: "WHATSAPP_UNKNOWN" as const,
        })),
      );

      // Log le message avec un superviseur valide comme userId
      await prisma.activityLog.create({
        data: {
          tenantId,
          userId: supervisors[0].id,
          action: "WHATSAPP_UNKNOWN_CONTACT",
          entity: "WhatsApp",
          entityId: incoming.messageId,
          metadata: {
            phone: normalizedPhone,
            messagePreview: incoming.body.substring(0, 200),
          },
        },
      });
    }

    return {
      clientId: null,
      interactionId: null,
      isNewContact: true,
      routedToAgentId: null,
    };
  }

  // Client trouvé → créer l'Interaction
  const agentId = client.assignedAgentId;

  // userId requis par le modèle Interaction — on utilise l'agent assigné ou un superviseur
  let interactionUserId = agentId;
  if (!interactionUserId) {
    const supervisor = await db.user.findFirst({
      where: { role: "SUPERVISOR", isActive: true },
      select: { id: true },
    });
    interactionUserId = supervisor?.id ?? null;
  }

  // Fallback : utiliser le CEO si aucun superviseur
  if (!interactionUserId) {
    const ceo = await db.user.findFirst({
      where: { role: "CEO", isActive: true },
      select: { id: true },
    });
    interactionUserId = ceo?.id ?? null;
  }

  let interactionId: string | null = null;

  if (interactionUserId) {
    const interaction = await prisma.interaction.create({
      data: {
        tenantId,
        clientId: client.id,
        userId: interactionUserId,
        type: "WHATSAPP",
        direction: "IN",
        content: incoming.body,
      },
    });
    interactionId = interaction.id;
  }

  // Notifier l'agent assigné, ou le superviseur si pas d'agent
  const notifyUserId = agentId ?? interactionUserId;
  if (notifyUserId) {
    await createNotification({
      tenantId,
      userId: notifyUserId,
      title: agentId ? "Message WhatsApp reçu" : "Message WhatsApp (client non assigné)",
      message: `${client.firstName} ${client.lastName} : "${incoming.body.substring(0, 80)}${incoming.body.length > 80 ? "..." : ""}"`,
      type: "WHATSAPP_IN",
      link: `/clients/${client.id}`,
    });
  }

  return {
    clientId: client.id,
    interactionId,
    isNewContact: false,
    routedToAgentId: agentId,
  };
}
