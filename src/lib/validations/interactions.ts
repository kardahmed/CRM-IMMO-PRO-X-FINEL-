import { z } from "zod";

export const createInteractionSchema = z.object({
  clientId: z.string().uuid("ID client invalide"),
  type: z.enum(["CALL", "EMAIL", "SMS", "WHATSAPP", "MEETING", "NOTE"]),
  direction: z.enum(["IN", "OUT"]),
  content: z.string().max(5000).optional().nullable(),
});

export type CreateInteractionInput = z.infer<typeof createInteractionSchema>;
