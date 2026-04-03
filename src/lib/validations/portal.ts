import { z } from "zod";

export const sendPortalLinkSchema = z.object({
  clientId: z.string().uuid("clientId doit être un UUID valide"),
  channel: z.enum(["SMS", "EMAIL", "WHATSAPP"]),
});

export type SendPortalLinkInput = z.infer<typeof sendPortalLinkSchema>;
