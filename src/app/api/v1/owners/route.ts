import { NextResponse } from "next/server";
import { z } from "zod";
import { apiHandler, jsonOk, jsonError, getBody } from "@/lib/api-handler";
import { requireAgency } from "@/middleware/module-guard";

const createOwnerSchema = z.object({
  firstName: z.string().min(1, "Prenom requis").max(100),
  lastName: z.string().min(1, "Nom requis").max(100),
  phone: z.string().min(8, "Telephone invalide").max(20),
  email: z.string().email("Email invalide").optional().nullable(),
  address: z.string().max(500).optional().nullable(),
});

/**
 * GET /api/v1/owners — AGENCY uniquement
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

    const [owners, total] = await Promise.all([
      ctx.db.ownerMandate.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: { mandates: { select: { id: true, type: true, status: true } } },
      }),
      ctx.db.ownerMandate.count(),
    ]);

    return jsonOk({
      owners,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  },
);

/**
 * POST /api/v1/owners — Creer un proprietaire (AGENCY)
 */
export const POST = apiHandler(
  { module: "MANDATES", action: "CREATE", schema: createOwnerSchema },
  async (ctx) => {
    const guard = await requireAgency(ctx);
    if (guard instanceof NextResponse) return guard;

    const body = getBody<z.infer<typeof createOwnerSchema>>(ctx.req);

    // Check duplicate phone
    const existing = await ctx.db.ownerMandate.findFirst({
      where: { phone: body.phone },
    });
    if (existing) {
      return jsonError("Un proprietaire avec ce numero existe deja", 409);
    }

    const owner = await ctx.db.ownerMandate.create({
      data: {
        firstName: body.firstName,
        lastName: body.lastName,
        phone: body.phone,
        email: body.email ?? null,
        address: body.address ?? null,
      },
    });

    return jsonOk(owner, 201);
  },
);
