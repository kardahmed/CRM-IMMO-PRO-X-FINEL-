import { z } from "zod";

export const createVisitSchema = z.object({
  clientId: z.string().uuid("ID client invalide"),
  propertyId: z.string().uuid("ID bien invalide"),
  agentId: z.string().uuid("ID agent invalide"),
  scheduledAt: z.string().datetime("Date invalide"),
  feedback: z.string().max(2000).optional().nullable(),
});

export const updateVisitSchema = z.object({
  scheduledAt: z.string().datetime().optional(),
  feedback: z.string().max(2000).optional().nullable(),
  agentId: z.string().uuid().optional(),
});

export const changeVisitStatusSchema = z.object({
  status: z.enum(["SCHEDULED", "COMPLETED", "CANCELLED", "NO_SHOW"]),
  feedback: z.string().max(2000).optional().nullable(),
});

export type CreateVisitInput = z.infer<typeof createVisitSchema>;
export type UpdateVisitInput = z.infer<typeof updateVisitSchema>;
