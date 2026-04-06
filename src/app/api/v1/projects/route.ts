import { NextResponse } from "next/server";
import { apiHandler, getBody, jsonOk } from "@/lib/api-handler";
import { requirePromotion } from "@/middleware/module-guard";
import { createProjectSchema, type CreateProjectInput } from "@/lib/validations/projects";

/**
 * GET /api/v1/projects — Liste paginée (PROMOTION only)
 */
export const GET = apiHandler(
  { module: "PROJECTS", action: "READ" },
  async (ctx) => {
    const guard = await requirePromotion(ctx);
    if (guard instanceof NextResponse) return guard;

    const url = new URL(ctx.req.url);
    const page = Math.max(1, parseInt(url.searchParams.get("page") || "1"));
    const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get("limit") || "20")));
    const skip = (page - 1) * limit;
    const status = url.searchParams.get("status");
    const search = url.searchParams.get("search");

    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { address: { contains: search, mode: "insensitive" } },
        { wilaya: { contains: search, mode: "insensitive" } },
      ];
    }

    const [projects, total] = await Promise.all([
      ctx.db.project.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          properties: {
            select: { id: true, status: true, price: true },
          },
        },
      }),
      ctx.db.project.count({ where }),
    ]);

    return jsonOk({
      projects,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  },
);

/**
 * POST /api/v1/projects — Créer un projet (PROMOTION only)
 */
export const POST = apiHandler(
  { module: "PROJECTS", action: "CREATE", schema: createProjectSchema },
  async (ctx) => {
    const guard = await requirePromotion(ctx);
    if (guard instanceof NextResponse) return guard;

    const body = getBody<CreateProjectInput>(ctx.req);

    const project = await (ctx.db.project.create as unknown as (...a: unknown[]) => Promise<unknown>)({
      data: {
        ...body,
        deliveryDate: body.deliveryDate ? new Date(body.deliveryDate) : null,
      },
    });

    return jsonOk(project, 201);
  },
);
