import { NextResponse } from "next/server";
import { apiHandler, getBody, jsonOk, jsonError } from "@/lib/api-handler";
import { requirePromotion } from "@/middleware/module-guard";
import { updateProjectSchema, constructionUpdateSchema, type UpdateProjectInput } from "@/lib/validations/projects";

/**
 * GET /api/v1/projects/[id] — Détail + propriétés du projet
 */
export const GET = apiHandler(
  { module: "PROJECTS", action: "READ" },
  async (ctx) => {
    const guard = await requirePromotion(ctx);
    if (guard instanceof NextResponse) return guard;

    const { id } = ctx.params;

    const project = await ctx.db.project.findFirst({
      where: { id },
      include: {
        properties: {
          orderBy: { createdAt: "desc" },
          select: {
            id: true, name: true, type: true, floor: true, rooms: true,
            surface: true, price: true, status: true, transactionType: true,
          },
        },
      },
    });

    if (!project) return jsonError("Projet introuvable", 404);
    return jsonOk(project);
  },
);

/**
 * PATCH /api/v1/projects/[id] — Modifier un projet
 */
export const PATCH = apiHandler(
  { module: "PROJECTS", action: "UPDATE", schema: updateProjectSchema },
  async (ctx) => {
    const guard = await requirePromotion(ctx);
    if (guard instanceof NextResponse) return guard;

    const { id } = ctx.params;
    const body = getBody<UpdateProjectInput>(ctx.req);

    const existing = await ctx.db.project.findFirst({ where: { id } });
    if (!existing) return jsonError("Projet introuvable", 404);

    const updated = await ctx.db.project.update({
      where: { id },
      data: {
        ...body,
        deliveryDate: body.deliveryDate ? new Date(body.deliveryDate) : undefined,
      },
    });

    return jsonOk(updated);
  },
);

/**
 * PUT /api/v1/projects/[id] — Construction update (progress + status)
 */
export const PUT = apiHandler(
  { module: "PROJECTS", action: "UPDATE", schema: constructionUpdateSchema },
  async (ctx) => {
    const guard = await requirePromotion(ctx);
    if (guard instanceof NextResponse) return guard;

    const { id } = ctx.params;
    const body = getBody<{ progressPercentage: number; status?: string }>(ctx.req);

    const existing = await ctx.db.project.findFirst({ where: { id } });
    if (!existing) return jsonError("Projet introuvable", 404);

    const data: Record<string, unknown> = { progressPercentage: body.progressPercentage };
    if (body.status) data.status = body.status;

    const updated = await ctx.db.project.update({ where: { id }, data });
    return jsonOk(updated);
  },
);
