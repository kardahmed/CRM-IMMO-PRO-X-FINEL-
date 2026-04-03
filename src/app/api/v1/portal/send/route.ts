import { apiHandler, getBody, jsonOk, jsonError } from "@/lib/api-handler";
import {
  sendPortalLinkSchema,
  type SendPortalLinkInput,
} from "@/lib/validations/portal";
import { prisma } from "@/lib/prisma";

/**
 * POST /api/v1/portal/send
 *
 * Envoie le lien du portail client via le canal choisi (SMS, Email, WhatsApp).
 * L'agent déclenche cet envoi manuellement depuis l'interface.
 *
 * - Vérifie que le client a un portalToken
 * - Log l'action dans ActivityLog
 * - Crée une interaction (trace de l'envoi)
 * - Retourne le lien portail + message de confirmation
 *
 * Note : L'envoi réel (SMS/Email) est délégué aux intégrations externes.
 * Cette route prépare les données et logue l'action.
 */
export const POST = apiHandler(
  { module: "PORTAL", action: "CREATE", schema: sendPortalLinkSchema },
  async (ctx) => {
    const { clientId, channel } = getBody<SendPortalLinkInput>(ctx.req);

    // Charger le client avec son token portail
    const client = await ctx.db.client.findFirst({
      where: { id: clientId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        phone: true,
        email: true,
        portalToken: true,
      },
    });

    if (!client) {
      return jsonError("Client introuvable", 404);
    }

    if (!client.portalToken) {
      return jsonError(
        "Ce client n'a pas de portail. Le portail est généré quand le client passe à l'étape RESERVED ou SIGNED.",
        400,
      );
    }

    // Vérifier que le client a les coordonnées nécessaires pour le canal
    if (channel === "EMAIL" && !client.email) {
      return jsonError("Le client n'a pas d'adresse email renseignée", 400);
    }
    if ((channel === "SMS" || channel === "WHATSAPP") && !client.phone) {
      return jsonError("Le client n'a pas de numéro de téléphone renseigné", 400);
    }

    const portalUrl = `/portal/${client.portalToken}`;

    // Créer le message selon le canal
    const messages: Record<string, string> = {
      SMS: `Bonjour ${client.firstName}, suivez votre dossier immobilier en ligne : ${portalUrl}`,
      EMAIL: `Bonjour ${client.firstName} ${client.lastName},\n\nVotre espace client est disponible. Vous pouvez suivre l'avancement de votre dossier, consulter vos paiements et vos documents en ligne.\n\nAccédez à votre espace : ${portalUrl}\n\nCordialement,\nVotre agent immobilier`,
      WHATSAPP: `Bonjour ${client.firstName} ! Votre espace client est prêt. Consultez votre dossier ici : ${portalUrl}`,
    };

    // Log l'interaction (trace de l'envoi)
    await prisma.interaction.create({
      data: {
        tenantId: ctx.tenantId,
        clientId: client.id,
        userId: ctx.user.userId,
        type: channel === "EMAIL" ? "EMAIL" : channel === "WHATSAPP" ? "WHATSAPP" : "SMS",
        direction: "OUT",
        content: messages[channel],
      },
    });

    // Log dans ActivityLog
    await prisma.activityLog.create({
      data: {
        tenantId: ctx.tenantId,
        userId: ctx.user.userId,
        action: "PORTAL_LINK_SENT",
        entity: "Client",
        entityId: client.id,
        metadata: {
          clientName: `${client.firstName} ${client.lastName}`,
          channel,
          portalUrl,
          recipient: channel === "EMAIL" ? client.email : client.phone,
        },
      },
    });

    return jsonOk({
      portalUrl,
      channel,
      recipient: channel === "EMAIL" ? client.email : client.phone,
      message: messages[channel],
      info: "Lien portail préparé. L'envoi effectif dépend de l'intégration SMS/Email configurée.",
    });
  },
);
