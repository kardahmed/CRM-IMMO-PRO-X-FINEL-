import { apiHandler, getBody, jsonOk } from "@/lib/api-handler";
import { createPaymentSchema, type CreatePaymentInput } from "@/lib/validations/payments";

/**
 * GET /api/v1/payments — Liste paginée avec filtres
 */
export const GET = apiHandler(
  { module: "PAYMENT_SCHEDULE", action: "READ" },
  async (ctx) => {
    const url = new URL(ctx.req.url);
    const page = Math.max(1, parseInt(url.searchParams.get("page") || "1"));
    const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get("limit") || "20")));
    const skip = (page - 1) * limit;

    const status = url.searchParams.get("status");
    const type = url.searchParams.get("type");
    const clientId = url.searchParams.get("clientId");

    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    if (type) where.type = type;
    if (clientId) where.clientId = clientId;

    const [payments, total] = await Promise.all([
      ctx.db.payment.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          client: { select: { id: true, firstName: true, lastName: true } },
          property: { select: { id: true, name: true } },
        },
      }),
      ctx.db.payment.count({ where }),
    ]);

    return jsonOk({
      payments,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  },
);

/**
 * POST /api/v1/payments — Créer un paiement
 */
export const POST = apiHandler(
  { module: "PAYMENT_SCHEDULE", action: "CREATE", schema: createPaymentSchema },
  async (ctx) => {
    const body = getBody<CreatePaymentInput>(ctx.req);

    // @ts-expect-error — Prisma $extends typing limitation on create()
    const payment = await ctx.db.payment.create({
      data: body,
    });

    return jsonOk(payment, 201);
  },
);
