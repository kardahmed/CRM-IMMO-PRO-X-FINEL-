import { z } from "zod";

export const createProjectSchema = z.object({
  name: z.string().min(1, "Nom requis").max(200),
  address: z.string().max(500).optional().nullable(),
  wilaya: z.string().max(100).optional().nullable(),
  commune: z.string().max(100).optional().nullable(),
  latitude: z.number().optional().nullable(),
  longitude: z.number().optional().nullable(),
  deliveryDate: z.string().datetime().optional().nullable(),
  status: z.enum(["PLANNING", "IN_PROGRESS", "DELIVERED", "CANCELLED"]).optional(),
});

export const updateProjectSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  address: z.string().max(500).optional().nullable(),
  wilaya: z.string().max(100).optional().nullable(),
  commune: z.string().max(100).optional().nullable(),
  latitude: z.number().optional().nullable(),
  longitude: z.number().optional().nullable(),
  deliveryDate: z.string().datetime().optional().nullable(),
  status: z.enum(["PLANNING", "IN_PROGRESS", "DELIVERED", "CANCELLED"]).optional(),
});

export const constructionUpdateSchema = z.object({
  progressPercentage: z.number().min(0).max(100),
  status: z.enum(["PLANNING", "IN_PROGRESS", "DELIVERED", "CANCELLED"]).optional(),
});

export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
