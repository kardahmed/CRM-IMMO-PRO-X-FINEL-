import { z } from "zod";

export const generateMessageSchema = z.object({
  taskId: z.string().uuid("taskId doit être un UUID valide"),
  channel: z.enum(["EMAIL", "SMS", "WHATSAPP", "INTERNAL"]),
  language: z.enum(["FR", "AR_CLASSIC", "AR_DIALECT", "EN"]).default("FR"),
});

export type GenerateMessageInput = z.infer<typeof generateMessageSchema>;
