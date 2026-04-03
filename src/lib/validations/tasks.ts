import { z } from "zod";

export const createTaskSchema = z.object({
  title: z.string().min(1, "Titre requis").max(300),
  type: z.enum(["CALL", "EMAIL", "VISIT", "FOLLOW_UP", "DOCUMENT", "MEETING", "OTHER"]).optional(),
  clientId: z.string().uuid().optional().nullable(),
  propertyId: z.string().uuid().optional().nullable(),
  assignedToId: z.string().uuid().optional().nullable(),
  dueAt: z.string().datetime().optional().nullable(),
  notes: z.string().max(2000).optional().nullable(),
  pipelineStage: z.enum(["NEW", "CONTACTED", "QUALIFIED", "VISIT_SCHEDULED", "VISITED", "NEGOTIATION", "RESERVED", "SIGNED", "CLOSED"]).optional().nullable(),
});

export const updateTaskSchema = z.object({
  title: z.string().min(1).max(300).optional(),
  type: z.enum(["CALL", "EMAIL", "VISIT", "FOLLOW_UP", "DOCUMENT", "MEETING", "OTHER"]).optional(),
  clientId: z.string().uuid().optional().nullable(),
  propertyId: z.string().uuid().optional().nullable(),
  assignedToId: z.string().uuid().optional().nullable(),
  dueAt: z.string().datetime().optional().nullable(),
  status: z.enum(["PENDING", "IN_PROGRESS", "COMPLETED", "CANCELLED"]).optional(),
  notes: z.string().max(2000).optional().nullable(),
});

export const postponeTaskSchema = z.object({
  dueAt: z.string().datetime("Date invalide"),
});

export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
