import { z } from "zod";

/**
 * Schema pour le webhook Facebook Lead Ads.
 * Facebook envoie un payload avec les field_data du formulaire.
 */
export const facebookLeadWebhookSchema = z.object({
  object: z.literal("page"),
  entry: z.array(
    z.object({
      id: z.string(),
      time: z.number(),
      changes: z.array(
        z.object({
          value: z.object({
            leadgen_id: z.string(),
            page_id: z.string(),
            form_id: z.string(),
            created_time: z.number(),
          }),
          field: z.literal("leadgen"),
        }),
      ),
    }),
  ),
});

export type FacebookLeadWebhookPayload = z.infer<typeof facebookLeadWebhookSchema>;

/**
 * Schema pour les données du lead récupérées via l'API Graph.
 */
export const facebookLeadDataSchema = z.object({
  id: z.string(),
  field_data: z.array(
    z.object({
      name: z.string(),
      values: z.array(z.string()),
    }),
  ),
  form_id: z.string().optional(),
  ad_name: z.string().optional(),
  created_time: z.string(),
});

export type FacebookLeadData = z.infer<typeof facebookLeadDataSchema>;

/**
 * Schema pour l'assignation d'un lead.
 */
export const assignLeadSchema = z.object({
  agentId: z.string().uuid("agentId doit être un UUID valide"),
});

export type AssignLeadInput = z.infer<typeof assignLeadSchema>;
