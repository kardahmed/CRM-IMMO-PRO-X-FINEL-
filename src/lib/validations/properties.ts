import { z } from "zod";

export const createPropertySchema = z.object({
  name: z.string().min(1, "Nom requis").max(200),
  type: z.enum(["APARTMENT", "STUDIO", "DUPLEX", "PENTHOUSE", "VILLA", "COMMERCIAL", "PARKING", "CAVE", "TERRAIN"]),
  projectId: z.string().uuid().optional().nullable(),
  floor: z.number().int().optional().nullable(),
  rooms: z.number().int().positive().optional().nullable(),
  surface: z.number().positive().optional().nullable(),
  price: z.number().positive().optional().nullable(),
  status: z.enum(["AVAILABLE", "RESERVED", "SOLD", "RENTED", "BLOCKED"]).optional(),
  transactionType: z.enum(["SALE", "RENT"]).optional(),
  cadastralRef: z.string().max(100).optional().nullable(),
  lotNumber: z.string().max(100).optional().nullable(),
  titleDeedNumber: z.string().max(100).optional().nullable(),
  latitude: z.number().optional().nullable(),
  longitude: z.number().optional().nullable(),
});

export const updatePropertySchema = z.object({
  name: z.string().min(1).max(200).optional(),
  type: z.enum(["APARTMENT", "STUDIO", "DUPLEX", "PENTHOUSE", "VILLA", "COMMERCIAL", "PARKING", "CAVE", "TERRAIN"]).optional(),
  projectId: z.string().uuid().optional().nullable(),
  floor: z.number().int().optional().nullable(),
  rooms: z.number().int().positive().optional().nullable(),
  surface: z.number().positive().optional().nullable(),
  price: z.number().positive().optional().nullable(),
  transactionType: z.enum(["SALE", "RENT"]).optional(),
  cadastralRef: z.string().max(100).optional().nullable(),
  lotNumber: z.string().max(100).optional().nullable(),
  titleDeedNumber: z.string().max(100).optional().nullable(),
  latitude: z.number().optional().nullable(),
  longitude: z.number().optional().nullable(),
});

export const changePropertyStatusSchema = z.object({
  status: z.enum(["AVAILABLE", "RESERVED", "SOLD", "RENTED", "BLOCKED"]),
});

export type CreatePropertyInput = z.infer<typeof createPropertySchema>;
export type UpdatePropertyInput = z.infer<typeof updatePropertySchema>;
