import { z } from "zod";

export const createObjectiveSchema = z.object({
  type: z.enum(["SALES", "VISITS", "CALLS", "REVENUE", "CLIENTS"]),
  targetValue: z.number().positive("La cible doit etre positive"),
  period: z.enum(["DAILY", "WEEKLY", "MONTHLY", "QUARTERLY", "YEARLY"]),
  assignedToId: z.string().uuid("ID utilisateur invalide"),
  startDate: z.string().datetime("Date de debut invalide"),
  endDate: z.string().datetime("Date de fin invalide"),
});

export type CreateObjectiveInput = z.infer<typeof createObjectiveSchema>;
