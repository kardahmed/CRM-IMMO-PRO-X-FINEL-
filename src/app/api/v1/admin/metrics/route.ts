import { NextRequest, NextResponse } from "next/server";
import { getAdminUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { rateLimit, getClientIp, RATE_LIMITS } from "@/lib/rate-limit";
import * as Sentry from "@sentry/nextjs";

/**
 * GET /api/v1/admin/metrics
 *
 * Super Admin only — returns platform-wide metrics for the dashboard.
 */
export async function GET(req: NextRequest): Promise<NextResponse> {
  const ip = getClientIp(req);
  const rl = await rateLimit(`admin:metrics:${ip}`, RATE_LIMITS.authenticated);
  if (!rl.allowed) {
    return NextResponse.json(
      { success: false, error: "Trop de requetes" },
      { status: 429 }
    );
  }

  const admin = await getAdminUser();
  if (!admin) {
    return NextResponse.json(
      { success: false, error: "Non authentifie" },
      { status: 401 }
    );
  }

  const role = admin.role;
  if (role !== "SUPER_ADMIN" && role !== "ADMIN") {
    return NextResponse.json(
      { success: false, error: "Acces refuse" },
      { status: 403 }
    );
  }

  try {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const [
      totalTenants,
      activeTenants,
      demoTenants,
      suspendedTenants,
      totalUsers,
      totalClients,
      totalAiGenerations,
      newTenantsThisMonth,
      newUsersThisMonth,
      planDistribution,
    ] = await Promise.all([
      prisma.tenant.count(),
      prisma.tenant.count({ where: { status: "ACTIVE" } }),
      prisma.tenant.count({ where: { status: "DEMO" } }),
      prisma.tenant.count({ where: { status: "SUSPENDED" } }),
      prisma.user.count({ where: { isActive: true } }),
      prisma.client.count(),
      prisma.aIGeneration.count(),
      prisma.tenant.count({ where: { createdAt: { gte: startOfMonth } } }),
      prisma.user.count({ where: { createdAt: { gte: startOfMonth } } }),
      prisma.tenant.groupBy({
        by: ["plan"],
        _count: { plan: true },
      }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        totalTenants,
        activeTenants,
        demoTenants,
        suspendedTenants,
        totalUsers,
        totalClients,
        totalAiGenerations,
        newTenantsThisMonth,
        newUsersThisMonth,
        planDistribution,
      },
    });
  } catch (err) {
    Sentry.captureException(err, { tags: { context: "Admin Metrics" } });
    return NextResponse.json(
      { success: false, error: "Erreur interne" },
      { status: 500 }
    );
  }
}
