import { z } from "zod";

export const createClientSchema = z.object({
  firstName: z.string().min(1, "Prénom requis").max(100),
  lastName: z.string().min(1, "Nom requis").max(100),
  phone: z.string().min(8, "Téléphone invalide").max(20),
  email: z.string().email("Email invalide").optional().nullable(),
  source: z.enum(["FACEBOOK", "WEBSITE", "REFERRAL", "WALK_IN", "PHONE", "OTHER"]).optional(),
  budgetMin: z.number().positive().optional().nullable(),
  budgetMax: z.number().positive().optional().nullable(),
  desiredType: z.enum(["APARTMENT", "STUDIO", "DUPLEX", "PENTHOUSE", "VILLA", "COMMERCIAL", "PARKING", "CAVE", "TERRAIN"]).optional().nullable(),
  desiredWilaya: z.string().max(100).optional().nullable(),
  desiredRooms: z.number().int().positive().optional().nullable(),
  desiredSurface: z.number().positive().optional().nullable(),
});

export const updateClientSchema = z.object({
  firstName: z.string().min(1).max(100).optional(),
  lastName: z.string().min(1).max(100).optional(),
  phone: z.string().min(8).max(20).optional(),
  email: z.string().email().optional().nullable(),
  source: z.enum(["FACEBOOK", "WEBSITE", "REFERRAL", "WALK_IN", "PHONE", "OTHER"]).optional(),
  budgetMin: z.number().positive().optional().nullable(),
  budgetMax: z.number().positive().optional().nullable(),
  desiredType: z.enum(["APARTMENT", "STUDIO", "DUPLEX", "PENTHOUSE", "VILLA", "COMMERCIAL", "PARKING", "CAVE", "TERRAIN"]).optional().nullable(),
  desiredWilaya: z.string().max(100).optional().nullable(),
  desiredRooms: z.number().int().positive().optional().nullable(),
  desiredSurface: z.number().positive().optional().nullable(),
  lostReason: z.string().max(500).optional().nullable(),
});

export const changeStageSchema = z.object({
  stage: z.enum(["NEW", "CONTACTED", "QUALIFIED", "VISIT_SCHEDULED", "VISITED", "NEGOTIATION", "RESERVED", "SIGNED", "CLOSED"]),
});

export const reassignClientSchema = z.object({
  agentId: z.string().uuid("ID agent invalide"),
});

export type CreateClientInput = z.infer<typeof createClientSchema>;
export type UpdateClientInput = z.infer<typeof updateClientSchema>;
