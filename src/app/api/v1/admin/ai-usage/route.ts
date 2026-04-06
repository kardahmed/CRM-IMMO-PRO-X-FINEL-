import { NextRequest, NextResponse } from "next/server";
import { getAdminUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { rateLimit, getClientIp, RATE_LIMITS } from "@/lib/rate-limit";
import * as Sentry from "@sentry/nextjs";

/**
 * GET /api/v1/admin/ai-usage
 *
 * Super Admin only — returns AI usage stats per workspace.
 */
export async function GET(req: NextRequest): Promise<NextResponse> {
  const ip = getClientIp(req);
  const rl = await rateLimit(`admin:ai-usage:${ip}`, RATE_LIMITS.authenticated);
  if (!rl.allowed) {
    return NextResponse.json({ success: false, error: "Trop de requetes" }, { status: 429 });
  }

  const admin = await getAdminUser();
  if (!admin) {
    return NextResponse.json({ success: false, error: "Non authentifie" }, { status: 401 });
  }

  const role = admin.role;
  if (role !== "SUPER_ADMIN" && role !== "ADMIN") {
    return NextResponse.json({ success: false, error: "Acces refuse" }, { status: 403 });
  }

  try {
    // AI generations grouped by tenant
    const usageByTenant = await prisma.aIGeneration.groupBy({
      by: ["tenantId"],
      _count: { id: true },
      orderBy: { _count: { id: "desc" } },
    });

    // Get tenant names
    const tenantIds = usageByTenant.map((u) => u.tenantId);
    const tenants = await prisma.tenant.findMany({
      where: { id: { in: tenantIds } },
      select: { id: true, name: true, plan: true },
    });

    // Total AI generations
    const totalGenerations = await prisma.aIGeneration.count();

    // This month's generations
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    const thisMonthGenerations = await prisma.aIGeneration.count({
      where: { createdAt: { gte: startOfMonth } },
    });

    // Map results
    const usage = usageByTenant.map((u) => {
      const tenant = tenants.find((t) => t.id === u.tenantId);
      return {
        tenantId: u.tenantId,
        workspace: tenant?.name || "Inconnu",
        plan: tenant?.plan || "STARTER",
        generations: u._count.id,
      };
    });

    return NextResponse.json({
      success: true,
      data: { usage, totalGenerations, thisMonthGenerations },
    });
  } catch (err) {
    Sentry.captureException(err, { tags: { context: "Admin AI Usage" } });
    return NextResponse.json({ success: false, error: "Erreur interne" }, { status: 500 });
  }
}
