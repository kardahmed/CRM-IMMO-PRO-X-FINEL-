import { NextResponse } from "next/server";
import { z } from "zod";
import { apiHandler, jsonOk, getBody } from "@/lib/api-handler";
import { requireAgency } from "@/middleware/module-guard";

const createMandateSchema = z.object({
  ownerId: z.string().uuid("ID proprietaire invalide"),
  propertyId: z.string().uuid("ID bien invalide"),
  type: z.enum(["EXCLUSIVE", "SIMPLE", "SEMI_EXCLUSIVE"]),
  commission: z.number().min(0).max(100).optional().nullable(),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
});

/**
 * GET /api/v1/mandates — AGENCY uniquement
 */
export const GET = apiHandler(
  { module: "MANDATES", action: "READ" },
  async (ctx) => {
    const guard = await requireAgency(ctx);
    if (guard instanceof NextResponse) return guard;

    const url = new URL(ctx.req.url);
    const page = Math.max(1, parseInt(url.searchParams.get("page") || "1"));
    const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get("limit") || "20")));
    const skip = (page - 1) * limit;
    const status = url.searchParams.get("status");

    const where: Record<string, unknown> = {};
    if (status) where.status = status;

    const [mandates, total] = await Promise.all([
      ctx.db.mandate.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          owner: { select: { id: true, firstName: true, lastName: true, phone: true } },
          property: { select: { id: true, name: true, type: true, status: true } },
        },
      }),
      ctx.db.mandate.count({ where }),
    ]);

    return jsonOk({
      mandates,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  },
);

/**
 * POST /api/v1/mandates — Creer un mandat (AGENCY)
 */
export const POST = apiHandler(
  { module: "MANDATES", action: "CREATE", schema: createMandateSchema },
  async (ctx) => {
    const guard = await requireAgency(ctx);
    if (guard instanceof NextResponse) return guard;

    const body = getBody<z.infer<typeof createMandateSchema>>(ctx.req);

    const mandate = await ctx.db.mandate.create({
      data: {
        ownerId: body.ownerId,
        propertyId: body.propertyId,
        type: body.type,
        commission: body.commission ?? null,
        startDate: new Date(body.startDate),
        endDate: new Date(body.endDate),
      },
      include: {
        owner: { select: { id: true, firstName: true, lastName: true } },
        property: { select: { id: true, name: true } },
      },
    });

    return jsonOk(mandate, 201);
  },
);
