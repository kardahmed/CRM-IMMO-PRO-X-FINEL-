import { NextRequest, NextResponse } from "next/server";
import { withTenantIsolation } from "@/middleware/tenant-isolation";
import { requirePromotion } from "@/middleware/module-guard";
import { createTenantPrisma } from "@/lib/prisma-tenant";

/** GET /api/v1/projects — PROMOTION uniquement */
export async function GET(req: NextRequest) {
  const ctx = await withTenantIsolation(req);
  if (ctx instanceof NextResponse) return ctx;

  const guard = await requirePromotion(ctx);
  if (guard instanceof NextResponse) return guard;

  const db = createTenantPrisma(ctx.tenantId);
  const projects = await db.project.findMany({
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ success: true, data: projects });
}
