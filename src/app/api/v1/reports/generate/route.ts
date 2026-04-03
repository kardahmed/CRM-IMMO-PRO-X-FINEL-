import { NextResponse } from "next/server";
import { apiHandler, jsonError } from "@/lib/api-handler";
import { reportFiltersSchema } from "@/lib/validations/reports";
import { generateReport } from "@/services/pdf-report.service";

/**
 * GET /api/v1/reports/generate?periodStart=X&periodEnd=X&agentId=Y&projectId=Z
 *
 * Génère un rapport PDF de performance.
 * Retourne le fichier PDF en téléchargement.
 *
 * Module : DOCUMENTS (PRO+)
 * Rôles : CEO, ADMIN, SUPERVISOR
 */
export const GET = apiHandler(
  { module: "DOCUMENTS", action: "READ" },
  async (ctx) => {
    const url = new URL(ctx.req.url);
    const params = Object.fromEntries(url.searchParams.entries());

    // Valider les paramètres query
    const parsed = reportFiltersSchema.safeParse(params);
    if (!parsed.success) {
      return jsonError(
        parsed.error.issues.map((e) => `${String(e.path.join("."))}: ${e.message}`).join(", "),
        422,
      );
    }

    const filters = {
      periodStart: new Date(parsed.data.periodStart),
      periodEnd: new Date(parsed.data.periodEnd),
      compareStart: parsed.data.compareStart ? new Date(parsed.data.compareStart) : undefined,
      compareEnd: parsed.data.compareEnd ? new Date(parsed.data.compareEnd) : undefined,
      agentId: parsed.data.agentId,
      projectId: parsed.data.projectId,
    };

    const pdfBuffer = await generateReport(ctx.tenantId, filters);

    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="rapport-${parsed.data.periodStart}-${parsed.data.periodEnd}.pdf"`,
        "Content-Length": String(pdfBuffer.length),
      },
    });
  },
);
