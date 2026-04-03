import { z } from "zod";

/**
 * Schema pour l'envoi d'un message WhatsApp par un agent.
 */
export const sendWhatsAppSchema = z.object({
  clientId: z.string().uuid("clientId doit être un UUID valide"),
  message: z.string().min(1, "Le message ne peut pas être vide").max(4096, "Message trop long (max 4096 caractères)"),
});

export type SendWhatsAppInput = z.infer<typeof sendWhatsAppSchema>;

/**
 * Schema pour le webhook entrant WhatsApp (Cloud API).
 * Structure simplifiée — le payload complet est plus complexe.
 */
export const whatsappWebhookSchema = z.object({
  object: z.literal("whatsapp_business_account"),
  entry: z.array(
    z.object({
      id: z.string(),
      changes: z.array(
        z.object({
          value: z.object({
            messaging_product: z.literal("whatsapp"),
            metadata: z.object({
              phone_number_id: z.string(),
            }),
            messages: z
              .array(
                z.object({
                  from: z.string(),
                  id: z.string(),
                  timestamp: z.string(),
                  type: z.string(),
                  text: z
                    .object({
                      body: z.string(),
                    })
                    .optional(),
                }),
              )
              .optional(),
          }),
          field: z.literal("messages"),
        }),
      ),
    }),
  ),
});

export type WhatsAppWebhookPayload = z.infer<typeof whatsappWebhookSchema>;
