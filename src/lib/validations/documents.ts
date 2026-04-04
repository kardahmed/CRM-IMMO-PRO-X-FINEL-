import { z } from "zod";

export const documentFiltersSchema = z.object({
  type: z.enum(["BON_RESERVATION", "RECU_PAIEMENT", "FICHE_VISITE", "COMPROMIS_VENTE", "BON_COMMANDE", "ETAT_DES_LIEUX", "CONTRAT_LOCATION"]),
  clientId: z.string().uuid("clientId invalide"),
  propertyId: z.string().uuid("propertyId invalide").optional(),
  paymentId: z.string().uuid("paymentId invalide").optional(),
  visitId: z.string().uuid("visitId invalide").optional(),
});

export type DocumentFiltersInput = z.infer<typeof documentFiltersSchema>;
