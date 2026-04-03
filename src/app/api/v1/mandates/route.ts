import { NextResponse } from "next/server";
import { apiHandler, jsonOk } from "@/lib/api-handler";
import { requireAgency } from "@/middleware/module-guard";

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
