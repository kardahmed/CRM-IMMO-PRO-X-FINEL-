import { apiHandler, jsonOk, jsonError } from "@/lib/api-handler";
import {
  parseClientsCsv,
  parsePropertiesCsv,
  importClients,
  importProperties,
} from "@/services/import-export.service";

/**
 * POST /api/v1/import-export/import
 *
 * Accepts multipart/form-data with:
 *   - file: CSV file
 *   - entity: "clients" | "properties"
 *
 * Returns JSON with import results: { imported, skipped, errors }
 */
export const POST = apiHandler(
  { module: "CLIENTS", action: "CREATE" },
  async (ctx) => {
    const contentType = ctx.req.headers.get("content-type") ?? "";

    if (!contentType.includes("multipart/form-data")) {
      return jsonError("Content-Type doit être multipart/form-data", 400);
    }

    const formData = await ctx.req.formData();
    const entity = formData.get("entity");
    const file = formData.get("file");

    if (!entity || (entity !== "clients" && entity !== "properties")) {
      return jsonError("Champ entity requis : clients ou properties", 400);
    }

    if (!file || !(file instanceof File)) {
      return jsonError("Champ file requis (fichier CSV)", 400);
    }

    // Validate file type
    const fileName = file.name.toLowerCase();
    if (!fileName.endsWith(".csv")) {
      return jsonError("Seuls les fichiers CSV sont acceptés", 400);
    }

    // Limit file size (5 MB)
    const MAX_FILE_SIZE = 5 * 1024 * 1024;
    if (file.size > MAX_FILE_SIZE) {
      return jsonError("Fichier trop volumineux (max 5 Mo)", 400);
    }

    const csvContent = await file.text();

    if (csvContent.trim().length === 0) {
      return jsonError("Fichier CSV vide", 400);
    }

    if (entity === "clients") {
      const { data, errors: parseErrors } = parseClientsCsv(csvContent);

      if (data.length === 0) {
        return jsonError(
          `Aucun client valide trouvé dans le CSV. ${parseErrors.length > 0 ? `Erreurs : ${parseErrors.join("; ")}` : ""}`,
          422,
        );
      }

      const result = await importClients(ctx.tenantId, ctx.user.userId, data);

      return jsonOk({
        imported: result.imported,
        skipped: result.skipped,
        errors: [...parseErrors, ...result.errors],
        totalParsed: data.length,
      });
    } else {
      const { data, errors: parseErrors } = parsePropertiesCsv(csvContent);

      if (data.length === 0) {
        return jsonError(
          `Aucun bien valide trouvé dans le CSV. ${parseErrors.length > 0 ? `Erreurs : ${parseErrors.join("; ")}` : ""}`,
          422,
        );
      }

      const result = await importProperties(ctx.tenantId, ctx.user.userId, data);

      return jsonOk({
        imported: result.imported,
        skipped: result.skipped,
        errors: [...parseErrors, ...result.errors],
        totalParsed: data.length,
      });
    }
  },
);
