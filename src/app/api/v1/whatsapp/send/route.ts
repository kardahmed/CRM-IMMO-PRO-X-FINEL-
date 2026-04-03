import { apiHandler, getBody, jsonOk, jsonError } from "@/lib/api-handler";
import { sendWhatsAppSchema } from "@/lib/validations/whatsapp";
import { sendMessage } from "@/services/whatsapp.service";
import { prisma } from "@/lib/prisma";

/**
 * POST /api/v1/whatsapp/send
 *
 * Envoie un message WhatsApp à un client.
 * Crée une Interaction WHATSAPP_OUT.
 *
 * Body : { clientId, message }
 */
export const POST = apiHandler(
  { module: "CLIENTS", action: "UPDATE", schema: sendWhatsAppSchema },
  async (ctx) => {
    const { clientId, message } = getBody<{ clientId: string; message: string }>(ctx.req);

    // Vérifier que le client existe et récupérer son téléphone
    const client = await ctx.db.client.findFirst({
      where: { id: clientId },
      select: { id: true, firstName: true, lastName: true, phone: true },
    });
    if (!client) {
      return jsonError("Client introuvable", 404);
    }

    // Envoyer via WhatsApp API
    const result = await sendMessage({
      tenantId: ctx.tenantId,
      phone: client.phone,
      message,
    });

    if (!result.success) {
      return jsonError(result.error ?? "Échec de l'envoi WhatsApp", 502);
    }

    // Créer l'Interaction
    const interaction = await prisma.interaction.create({
      data: {
        tenantId: ctx.tenantId,
        clientId: client.id,
        userId: ctx.user.userId,
        type: "WHATSAPP",
        direction: "OUT",
        content: message,
      },
    });

    // Log
    await prisma.activityLog.create({
      data: {
        tenantId: ctx.tenantId,
        userId: ctx.user.userId,
        action: "WHATSAPP_SENT",
        entity: "Interaction",
        entityId: interaction.id,
        metadata: {
          clientId: client.id,
          clientName: `${client.firstName} ${client.lastName}`,
          messagePreview: message.substring(0, 100),
          whatsappMessageId: result.messageId,
        },
      },
    });

    return jsonOk({
      interactionId: interaction.id,
      whatsappMessageId: result.messageId,
      clientName: `${client.firstName} ${client.lastName}`,
    });
  },
);
