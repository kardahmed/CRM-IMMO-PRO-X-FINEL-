import { apiHandler, getBody, jsonOk, jsonError } from "@/lib/api-handler";
import { updatePaymentSchema, type UpdatePaymentInput } from "@/lib/validations/payments";

/**
 * GET /api/v1/payments/[id] — Détail d'un paiement
 */
export const GET = apiHandler(
  { module: "PAYMENT_SCHEDULE", action: "READ" },
  async (ctx) => {
    const { id } = ctx.params;

    const payment = await ctx.db.payment.findFirst({
      where: { id },
      include: {
        client: { select: { id: true, firstName: true, lastName: true } },
        property: { select: { id: true, name: true } },
      },
    });

    if (!payment) return jsonError("Paiement introuvable", 404);
    return jsonOk(payment);
  },
);

/**
 * PATCH /api/v1/payments/[id] — Modifier un paiement
 */
export const PATCH = apiHandler(
  { module: "PAYMENT_SCHEDULE", action: "UPDATE", schema: updatePaymentSchema },
  async (ctx) => {
    const { id } = ctx.params;
    const body = getBody<UpdatePaymentInput>(ctx.req);

    const existing = await ctx.db.payment.findFirst({ where: { id } });
    if (!existing) return jsonError("Paiement introuvable", 404);

    const updated = await ctx.db.payment.update({
      where: { id },
      data: body,
    });

    return jsonOk(updated);
  },
);
