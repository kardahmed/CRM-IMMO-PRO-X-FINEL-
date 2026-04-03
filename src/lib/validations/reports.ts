import { z } from "zod";

const isoDateString = z.string().refine(
  (s) => !isNaN(Date.parse(s)),
  { message: "Date ISO invalide" },
);

export const reportFiltersSchema = z.object({
  periodStart: isoDateString,
  periodEnd: isoDateString,
  compareStart: isoDateString.optional(),
  compareEnd: isoDateString.optional(),
  agentId: z.string().uuid().optional(),
  projectId: z.string().uuid().optional(),
});

export type ReportFiltersInput = z.infer<typeof reportFiltersSchema>;
