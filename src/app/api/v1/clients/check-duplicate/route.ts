import { NextRequest, NextResponse } from "next/server";
import { withPermission } from "@/lib/check-permission";
import { checkDuplicates, normalizePhone } from "@/services/client-dedup";

/** GET /api/v1/clients/check-duplicate?phone=xxx&firstName=x&lastName=x */
export async function GET(req: NextRequest) {
  return withPermission(req, "CLIENTS", "READ", async (ctx) => {
    const { searchParams } = new URL(req.url);
    const phone = searchParams.get("phone");
    const firstName = searchParams.get("firstName") ?? "";
    const lastName = searchParams.get("lastName") ?? "";
    const email = searchParams.get("email");

    if (!phone) {
      return NextResponse.json(
        { success: false, error: "Paramètre phone requis" },
        { status: 400 },
      );
    }

    const result = await checkDuplicates(ctx.tenantId, {
      phone: normalizePhone(phone),
      email,
      firstName,
      lastName,
    });

    return NextResponse.json({ success: true, data: result });
  });
}
