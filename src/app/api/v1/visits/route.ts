import { apiHandler, getBody, jsonOk, jsonError } from "@/lib/api-handler";
import { createVisitSchema, type CreateVisitInput } from "@/lib/validations/visits";

/**
 * GET /api/v1/visits — Liste paginée avec filtres date/agent/status
 */
export const GET = apiHandler(
  { module: "PLANNING", action: "READ" },
  async (ctx) => {
    const url = new URL(ctx.req.url);
    const page = Math.max(1, parseInt(url.searchParams.get("page") || "1"));
    const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get("limit") || "20")));
    const skip = (page - 1) * limit;

    const status = url.searchParams.get("status");
    const agentId = url.searchParams.get("agentId");
    const dateFrom = url.searchParams.get("dateFrom");
    const dateTo = url.searchParams.get("dateTo");

    const where: Record<string, unknown> = {};

    if (status) where.status = status;
    if (agentId) where.agentId = agentId;

    // Agent sees only their visits
    if (ctx.user.role === "AGENT") {
      where.agentId = ctx.user.userId;
    }

    if (dateFrom || dateTo) {
      where.scheduledAt = {};
      if (dateFrom) (where.scheduledAt as Record<string, unknown>).gte = new Date(dateFrom);
      if (dateTo) (where.scheduledAt as Record<string, unknown>).lte = new Date(dateTo);
    }

    const [visits, total] = await Promise.all([
      ctx.db.visit.findMany({
        where,
        skip,
        take: limit,
        orderBy: { scheduledAt: "desc" },
        include: {
          client: { select: { id: true, firstName: true, lastName: true, phone: true } },
          property: { select: { id: true, name: true, type: true } },
          agent: { select: { id: true, firstName: true, lastName: true } },
        },
      }),
      ctx.db.visit.count({ where }),
    ]);

    return jsonOk({
      visits,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  },
);

/**
 * POST /api/v1/visits — Créer une visite
 */
export const POST = apiHandler(
  { module: "PLANNING", action: "CREATE", schema: createVisitSchema },
  async (ctx) => {
    const body = getBody<CreateVisitInput>(ctx.req);

    // Check for scheduling conflicts (same agent, overlapping time window of 1 hour)
    const conflictWindow = 60 * 60 * 1000; // 1 hour in ms
    const scheduledTime = new Date(body.scheduledAt);
    const existingVisit = await ctx.db.visit.findFirst({
      where: {
        agentId: body.agentId,
        status: "SCHEDULED",
        scheduledAt: {
          gte: new Date(scheduledTime.getTime() - conflictWindow),
          lte: new Date(scheduledTime.getTime() + conflictWindow),
        },
      },
    });
    if (existingVisit) {
      return jsonError("Conflit de planning : l'agent a déjà une visite programmée dans ce créneau.", 409);
    }

    const visit = await (ctx.db.visit.create as unknown as (...a: unknown[]) => Promise<unknown>)({
      data: {
        ...body,
        scheduledAt: scheduledTime,
      },
    });

    return jsonOk(visit, 201);
  },
);
