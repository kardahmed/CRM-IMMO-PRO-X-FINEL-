import { NextResponse } from "next/server";
import { apiHandler, jsonError } from "@/lib/api-handler";
import { documentFiltersSchema } from "@/lib/validations/documents";
import { generateDocument } from "@/services/document-generator.service";

/**
 * GET /api/v1/documents/generate?type=BON_RESERVATION&clientId=X&propertyId=Y
 *
 * Génère un document PDF (bon de réservation, reçu, fiche visite, compromis).
 * Retourne le fichier PDF en téléchargement.
 *
 * Module : DOCUMENTS (PRO+)
 */
export const GET = apiHandler(
  { module: "DOCUMENTS", action: "READ" },
  async (ctx) => {
    const url = new URL(ctx.req.url);
    const params = Object.fromEntries(url.searchParams.entries());

    // Valider les paramètres query
    const parsed = documentFiltersSchema.safeParse(params);
    if (!parsed.success) {
      return jsonError(
        parsed.error.issues.map((e) => `${String(e.path.join("."))}: ${e.message}`).join(", "),
        422,
      );
    }

    const pdfBuffer = await generateDocument({
      type: parsed.data.type,
      tenantId: ctx.tenantId,
      clientId: parsed.data.clientId,
      propertyId: parsed.data.propertyId,
      paymentId: parsed.data.paymentId,
      visitId: parsed.data.visitId,
    });

    const fileNames: Record<string, string> = {
      BON_RESERVATION: "bon-reservation",
      RECU_PAIEMENT: "recu-paiement",
      FICHE_VISITE: "fiche-visite",
      COMPROMIS_VENTE: "compromis-vente",
    };

    const fileName = fileNames[parsed.data.type] ?? "document";

    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${fileName}-${Date.now()}.pdf"`,
        "Content-Length": String(pdfBuffer.length),
      },
    });
  },
);
