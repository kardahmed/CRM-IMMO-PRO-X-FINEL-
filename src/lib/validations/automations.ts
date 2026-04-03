import { z } from "zod";

const automationTaskSchema = z.object({
  title: z.string().min(1, "Titre requis").max(300),
  type: z.enum(["CALL", "EMAIL", "VISIT", "FOLLOW_UP", "DOCUMENT", "MEETING", "OTHER"]),
  delayMinutes: z.number().int().min(0, "Délai doit être >= 0"),
  description: z.string().max(1000).optional(),
});

export const upsertAutomationConfigSchema = z.object({
  pipelineStage: z.enum([
    "NEW", "CONTACTED", "QUALIFIED", "VISIT_SCHEDULED", "VISITED",
    "NEGOTIATION", "RESERVED", "SIGNED", "CLOSED",
  ]),
  isActive: z.boolean().optional(),
  tasks: z.array(automationTaskSchema).min(0),
});

export const toggleAutomationConfigSchema = z.object({
  pipelineStage: z.enum([
    "NEW", "CONTACTED", "QUALIFIED", "VISIT_SCHEDULED", "VISITED",
    "NEGOTIATION", "RESERVED", "SIGNED", "CLOSED",
  ]),
  isActive: z.boolean(),
});

export type UpsertAutomationConfigInput = z.infer<typeof upsertAutomationConfigSchema>;
export type ToggleAutomationConfigInput = z.infer<typeof toggleAutomationConfigSchema>;
