import { apiHandler, jsonOk } from "@/lib/api-handler";

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
