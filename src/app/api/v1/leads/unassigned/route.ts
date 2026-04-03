import { apiHandler, jsonOk } from "@/lib/api-handler";

/**
 * GET /api/v1/leads/unassigned
 *
 * Retourne les leads non assignés (assignedAgentId = NULL).
 * Principalement les leads Facebook en attente d'assignation.
 *
 * Accès : CEO, ADMIN, SUPERVISOR
 * Module : CLIENTS (READ_ALL pour voir tous les leads non assignés)
 */
export const GET = apiHandler(
  { module: "CLIENTS", action: "READ_ALL" },
  async (ctx) => {
    const url = new URL(ctx.req.url);
    const page = Math.max(1, Number(url.searchParams.get("page") ?? "1"));
    const limit = Math.min(100, Math.max(1, Number(url.searchParams.get("limit") ?? "50")));
    const source = url.searchParams.get("source"); // Optional filter: FACEBOOK, WEBSITE, etc.

    const where = {
      assignedAgentId: null,
      ...(source ? { source: source as "FACEBOOK" | "WEBSITE" | "REFERRAL" | "WALK_IN" | "PHONE" | "OTHER" } : {}),
    };

    const [leads, total] = await Promise.all([
      ctx.db.client.findMany({
        where,
        select: {
          id: true,
          firstName: true,
          lastName: true,
          phone: true,
          email: true,
          source: true,
          pipelineStage: true,
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      ctx.db.client.count({ where }),
    ]);

    return jsonOk({
      leads,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  },
);
