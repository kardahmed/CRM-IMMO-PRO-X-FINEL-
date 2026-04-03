import { apiHandler, getBody, jsonOk, jsonError } from "@/lib/api-handler";
import { updatePropertySchema, changePropertyStatusSchema, type UpdatePropertyInput } from "@/lib/validations/properties";
import type { PropertyStatus } from "@prisma/client";

/**
 * GET /api/v1/properties/[id] — Détail d'un bien
 */
export const GET = apiHandler(
  { module: "PORTFOLIO", action: "READ" },
  async (ctx) => {
    const { id } = ctx.params;

    const property = await ctx.db.property.findFirst({
      where: { id },
      include: {
        project: { select: { id: true, name: true, status: true } },
        visits: { orderBy: { scheduledAt: "desc" }, take: 10, include: { client: { select: { id: true, firstName: true, lastName: true } } } },
        payments: { orderBy: { createdAt: "desc" }, take: 10 },
        mandates: { take: 5 },
      },
    });

    if (!property) return jsonError("Bien introuvable", 404);
    return jsonOk(property);
  },
);

/**
 * PATCH /api/v1/properties/[id] — Modifier un bien
 */
export const PATCH = apiHandler(
  { module: "PORTFOLIO", action: "UPDATE", schema: updatePropertySchema },
  async (ctx) => {
    const { id } = ctx.params;
    const body = getBody<UpdatePropertyInput>(ctx.req);

    const existing = await ctx.db.property.findFirst({ where: { id } });
    if (!existing) return jsonError("Bien introuvable", 404);

    const updated = await ctx.db.property.update({
      where: { id },
      data: body,
    });

    return jsonOk(updated);
  },
);

/**
 * PUT /api/v1/properties/[id] — Changer le statut
 */
export const PUT = apiHandler(
  { module: "PORTFOLIO", action: "UPDATE", schema: changePropertyStatusSchema },
  async (ctx) => {
    const { id } = ctx.params;
    const { status } = getBody<{ status: PropertyStatus }>(ctx.req);

    const existing = await ctx.db.property.findFirst({ where: { id } });
    if (!existing) return jsonError("Bien introuvable", 404);

    const updated = await ctx.db.property.update({
      where: { id },
      data: { status },
    });

    return jsonOk(updated);
  },
);
