import { apiHandler, getBody, jsonOk } from "@/lib/api-handler";
import { changeStageSchema } from "@/lib/validations/clients";
import { changeClientStage } from "@/services/client.service";
import type { PipelineStage } from "@prisma/client";

/**
 * POST /api/v1/clients/[id]/change-stage
 */
export const POST = apiHandler(
  { module: "CLIENTS", action: "UPDATE", schema: changeStageSchema },
  async (ctx) => {
    const { id } = ctx.params;
    const { stage } = getBody<{ stage: PipelineStage }>(ctx.req);
    const updated = await changeClientStage(ctx.user, id, stage);
    return jsonOk(updated);
  },
);
