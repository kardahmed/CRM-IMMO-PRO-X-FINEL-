import { z } from "zod";

export const createPaymentSchema = z.object({
  clientId: z.string().uuid("ID client invalide"),
  propertyId: z.string().uuid().optional().nullable(),
  type: z.enum(["RESERVATION", "INSTALLMENT", "FINAL", "COMMISSION", "REFUND"]),
  amount: z.number().positive("Montant doit être positif"),
  status: z.enum(["PENDING", "COMPLETED", "FAILED", "REFUNDED"]).optional(),
});

export const updatePaymentSchema = z.object({
  type: z.enum(["RESERVATION", "INSTALLMENT", "FINAL", "COMMISSION", "REFUND"]).optional(),
  amount: z.number().positive().optional(),
  status: z.enum(["PENDING", "COMPLETED", "FAILED", "REFUNDED"]).optional(),
});

export type CreatePaymentInput = z.infer<typeof createPaymentSchema>;
export type UpdatePaymentInput = z.infer<typeof updatePaymentSchema>;
