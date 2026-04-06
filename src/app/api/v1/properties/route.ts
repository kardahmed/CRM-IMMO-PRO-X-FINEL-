import { apiHandler, getBody, jsonOk } from "@/lib/api-handler";
import { createPropertySchema, type CreatePropertyInput } from "@/lib/validations/properties";

/**
 * GET /api/v1/properties — Liste paginée avec filtres type/status/price/surface/project
 */
export const GET = apiHandler(
  { module: "PORTFOLIO", action: "READ" },
  async (ctx) => {
    const url = new URL(ctx.req.url);
    const page = Math.max(1, parseInt(url.searchParams.get("page") || "1"));
    const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get("limit") || "20")));
    const skip = (page - 1) * limit;

    const type = url.searchParams.get("type");
    const status = url.searchParams.get("status");
    const projectId = url.searchParams.get("projectId");
    const minPrice = url.searchParams.get("minPrice");
    const maxPrice = url.searchParams.get("maxPrice");
    const minSurface = url.searchParams.get("minSurface");
    const maxSurface = url.searchParams.get("maxSurface");
    const transactionType = url.searchParams.get("transactionType");
    const search = url.searchParams.get("search");

    const where: Record<string, unknown> = {};

    if (type) where.type = type;
    if (status) where.status = status;
    if (projectId) where.projectId = projectId;
    if (transactionType) where.transactionType = transactionType;

    if (minPrice || maxPrice) {
      where.price = {};
      if (minPrice) (where.price as Record<string, unknown>).gte = parseFloat(minPrice);
      if (maxPrice) (where.price as Record<string, unknown>).lte = parseFloat(maxPrice);
    }

    if (minSurface || maxSurface) {
      where.surface = {};
      if (minSurface) (where.surface as Record<string, unknown>).gte = parseFloat(minSurface);
      if (maxSurface) (where.surface as Record<string, unknown>).lte = parseFloat(maxSurface);
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { cadastralRef: { contains: search, mode: "insensitive" } },
      ];
    }

    const [properties, total] = await Promise.all([
      ctx.db.property.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          project: { select: { id: true, name: true, deliveryDate: true } },
        },
      }),
      ctx.db.property.count({ where }),
    ]);

    return jsonOk({
      properties,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  },
);

/**
 * POST /api/v1/properties — Créer un bien
 */
export const POST = apiHandler(
  { module: "PORTFOLIO", action: "CREATE", schema: createPropertySchema },
  async (ctx) => {
    const body = getBody<CreatePropertyInput>(ctx.req);

    const property = await (ctx.db.property.create as unknown as (...a: unknown[]) => Promise<unknown>)({
      data: body,
    });

    return jsonOk(property, 201);
  },
);
