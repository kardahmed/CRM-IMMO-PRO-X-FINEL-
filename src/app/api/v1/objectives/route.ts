import { apiHandler, getBody, jsonOk } from "@/lib/api-handler";
import { createObjectiveSchema, type CreateObjectiveInput } from "@/lib/validations/objectives";

/**
 * GET /api/v1/objectives
 *
 * List all objectives for the tenant, with assigned user details.
 */
export const GET = apiHandler(
  { module: "OBJECTIVES", action: "READ" },
  async (ctx) => {
    const objectives = await ctx.db.objective.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        assignedTo: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            role: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    return jsonOk(objectives);
  },
);

/**
 * POST /api/v1/objectives — Create a new objective
 */
export const POST = apiHandler(
  { module: "OBJECTIVES", action: "CREATE", schema: createObjectiveSchema },
  async (ctx) => {
    const body = getBody<CreateObjectiveInput>(ctx.req);

    const objective = await (ctx.db.objective.create as unknown as (...a: unknown[]) => Promise<unknown>)({
      data: {
        type: body.type,
        targetValue: body.targetValue,
        currentValue: 0,
        period: body.period,
        assignedToId: body.assignedToId,
        createdById: ctx.user.userId,
        startDate: new Date(body.startDate),
        endDate: new Date(body.endDate),
      },
    });

    return jsonOk(objective, 201);
  },
);
