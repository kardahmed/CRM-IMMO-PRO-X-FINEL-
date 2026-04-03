import { NextRequest, NextResponse } from "next/server";
import { withTenantIsolation } from "@/middleware/tenant-isolation";
import { requireAgency } from "@/middleware/module-guard";
import { createTenantPrisma } from "@/lib/prisma-tenant";

/** GET /api/v1/mandates — AGENCY uniquement */
export async function GET(req: NextRequest) {
  const ctx = await withTenantIsolation(req);
  if (ctx instanceof NextResponse) return ctx;

  const guard = await requireAgency(ctx);
  if (guard instanceof NextResponse) return guard;

  const db = createTenantPrisma(ctx.tenantId);
  const mandates = await db.mandate.findMany({
    include: {
      owner: { select: { firstName: true, lastName: true, phone: true } },
      property: { select: { name: true, type: true, status: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ success: true, data: mandates });
}
