import { apiHandler, getBody, jsonOk, jsonError } from "@/lib/api-handler";
import { updateVisitSchema, changeVisitStatusSchema, type UpdateVisitInput } from "@/lib/validations/visits";

/**
 * GET /api/v1/visits/[id] — Détail d'une visite
 */
export const GET = apiHandler(
  { module: "PLANNING", action: "READ" },
  async (ctx) => {
    const { id } = ctx.params;

    const visit = await ctx.db.visit.findFirst({
      where: { id },
      include: {
        client: { select: { id: true, firstName: true, lastName: true, phone: true, email: true } },
        property: { select: { id: true, name: true, type: true, surface: true, price: true } },
        agent: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    if (!visit) return jsonError("Visite introuvable", 404);

    if (ctx.user.role === "AGENT" && visit.agentId !== ctx.user.userId) {
      return jsonError("Accès refusé", 403);
    }

    return jsonOk(visit);
  },
);

/**
 * PATCH /api/v1/visits/[id] — Modifier une visite
 */
export const PATCH = apiHandler(
  { module: "PLANNING", action: "UPDATE", schema: updateVisitSchema },
  async (ctx) => {
    const { id } = ctx.params;
    const body = getBody<UpdateVisitInput>(ctx.req);

    const existing = await ctx.db.visit.findFirst({ where: { id } });
    if (!existing) return jsonError("Visite introuvable", 404);

    if (ctx.user.role === "AGENT" && existing.agentId !== ctx.user.userId) {
      return jsonError("Accès refusé", 403);
    }

    const updated = await ctx.db.visit.update({
      where: { id },
      data: {
        ...body,
        scheduledAt: body.scheduledAt ? new Date(body.scheduledAt) : undefined,
      },
    });

    return jsonOk(updated);
  },
);

/**
 * PUT /api/v1/visits/[id] — Changer le statut d'une visite
 */
export const PUT = apiHandler(
  { module: "PLANNING", action: "UPDATE", schema: changeVisitStatusSchema },
  async (ctx) => {
    const { id } = ctx.params;
    const body = getBody<{ status: string; feedback?: string | null }>(ctx.req);

    const existing = await ctx.db.visit.findFirst({ where: { id } });
    if (!existing) return jsonError("Visite introuvable", 404);

    if (ctx.user.role === "AGENT" && existing.agentId !== ctx.user.userId) {
      return jsonError("Accès refusé", 403);
    }

    const data: Record<string, unknown> = { status: body.status };
    if (body.feedback !== undefined) data.feedback = body.feedback;

    const updated = await ctx.db.visit.update({ where: { id }, data });
    return jsonOk(updated);
  },
);
