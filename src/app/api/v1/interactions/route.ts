import { apiHandler, getBody, jsonOk } from "@/lib/api-handler";
import { createInteractionSchema, type CreateInteractionInput } from "@/lib/validations/interactions";

/**
 * POST /api/v1/interactions — Créer une interaction
 */
export const POST = apiHandler(
  { module: "CLIENTS", action: "UPDATE", schema: createInteractionSchema },
  async (ctx) => {
    const body = getBody<CreateInteractionInput>(ctx.req);

    // @ts-expect-error — Prisma $extends typing limitation on create()
    const interaction = await ctx.db.interaction.create({
      data: {
        ...body,
        userId: ctx.user.userId,
      },
    });

    return jsonOk(interaction, 201);
  },
);
