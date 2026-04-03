import { apiHandler, getBody, jsonOk } from "@/lib/api-handler";
import { changeStageSchema } from "@/lib/validations/clients";
import { changeClientStage } from "@/services/client.service";
import type { PipelineStage } from "@prisma/client";

/**
 * POST /api/v1/clients/[id]/change-stage
 *
 * Change l'étape du pipeline d'un client.
 * Génère automatiquement un token portail à RESERVED ou SIGNED.
 * Retourne le client mis à jour + portalUrl si token généré.
 */
export const POST = apiHandler(
  { module: "CLIENTS", action: "UPDATE", schema: changeStageSchema },
  async (ctx) => {
    const { stage } = getBody<{ stage: PipelineStage }>(ctx.req);
    const clientId = ctx.params.id;

    const updated = await changeClientStage(ctx.user, clientId, stage);

    return jsonOk({
      ...updated,
      portalUrl: updated.portalToken
        ? `/portal/${updated.portalToken}`
        : null,
    });
  },
);
