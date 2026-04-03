import { apiHandler, getBody, jsonOk } from "@/lib/api-handler";
import { reassignClientSchema } from "@/lib/validations/clients";
import { reassignClient } from "@/services/client.service";

/**
 * POST /api/v1/clients/[id]/reassign
 */
export const POST = apiHandler(
  { module: "CLIENTS", action: "ASSIGN", schema: reassignClientSchema },
  async (ctx) => {
    const { id } = ctx.params;
    const { agentId } = getBody<{ agentId: string }>(ctx.req);
    const result = await reassignClient(ctx.user, id, agentId);
    return jsonOk(result);
  },
);
