import { NextResponse } from "next/server";
import { apiHandler, jsonError } from "@/lib/api-handler";
import { exportClientsCsv, exportPropertiesCsv } from "@/services/import-export.service";

/**
 * GET /api/v1/import-export/export?entity=clients|properties&format=csv
 *
 * Optional filters via query params:
 *   - Clients: stage, agentId, source
 *   - Properties: type, status, transactionType, projectId
 */
export const GET = apiHandler(
  { module: "CLIENTS", action: "EXPORT" },
  async (ctx) => {
    const url = new URL(ctx.req.url);
    const entity = url.searchParams.get("entity");
    const format = url.searchParams.get("format") ?? "csv";

    if (format !== "csv") {
      return jsonError("Format non supporté. Utilisez format=csv", 400);
    }

    if (!entity || (entity !== "clients" && entity !== "properties")) {
      return jsonError("Paramètre entity requis : clients ou properties", 400);
    }

    let csv: string;
    let filename: string;

    if (entity === "clients") {
      const filters = {
        stage: url.searchParams.get("stage") ?? undefined,
        agentId: url.searchParams.get("agentId") ?? undefined,
        source: url.searchParams.get("source") ?? undefined,
      };
      csv = await exportClientsCsv(ctx.tenantId, filters);
      filename = `clients_export_${new Date().toISOString().slice(0, 10)}.csv`;
    } else {
      const filters = {
        type: url.searchParams.get("type") ?? undefined,
        status: url.searchParams.get("status") ?? undefined,
        transactionType: url.searchParams.get("transactionType") ?? undefined,
        projectId: url.searchParams.get("projectId") ?? undefined,
      };
      csv = await exportPropertiesCsv(ctx.tenantId, filters);
      filename = `properties_export_${new Date().toISOString().slice(0, 10)}.csv`;
    }

    // Add BOM for Excel UTF-8 compatibility
    const bom = "\uFEFF";
    const body = bom + csv;

    return new NextResponse(body, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  },
);
