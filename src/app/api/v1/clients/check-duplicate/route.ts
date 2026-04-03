import { apiHandler, jsonOk } from "@/lib/api-handler";
import { checkDuplicates, normalizePhone } from "@/services/client-dedup";

/**
 * GET /api/v1/clients/check-duplicate?phone=...&email=...&firstName=...&lastName=...
 */
export const GET = apiHandler(
  { module: "CLIENTS", action: "READ" },
  async (ctx) => {
    const url = new URL(ctx.req.url);
    const phone = url.searchParams.get("phone") || "";
    const email = url.searchParams.get("email") || undefined;
    const firstName = url.searchParams.get("firstName") || "";
    const lastName = url.searchParams.get("lastName") || "";

    const normalizedPhone = normalizePhone(phone);
    const result = await checkDuplicates(ctx.tenantId, {
      phone: normalizedPhone,
      email,
      firstName,
      lastName,
    });

    return jsonOk(result);
  },
);
