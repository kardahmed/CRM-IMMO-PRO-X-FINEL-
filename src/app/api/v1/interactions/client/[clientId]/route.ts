import { apiHandler, jsonOk } from "@/lib/api-handler";

/**
 * GET /api/v1/interactions/client/[clientId] — Interactions d'un client
 */
export const GET = apiHandler(
  { module: "CLIENTS", action: "READ" },
  async (ctx) => {
    const { clientId } = ctx.params;

    const url = new URL(ctx.req.url);
    const page = Math.max(1, parseInt(url.searchParams.get("page") || "1"));
    const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get("limit") || "20")));
    const skip = (page - 1) * limit;
    const type = url.searchParams.get("type");

    const where: Record<string, unknown> = { clientId };
    if (type) where.type = type;

    const [interactions, total] = await Promise.all([
      ctx.db.interaction.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          user: { select: { id: true, firstName: true, lastName: true } },
        },
      }),
      ctx.db.interaction.count({ where }),
    ]);

    return jsonOk({
      interactions,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  },
);
