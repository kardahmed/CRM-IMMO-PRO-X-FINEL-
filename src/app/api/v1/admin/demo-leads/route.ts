import { NextResponse } from "next/server";
import { getAdminUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { rateLimit, getClientIp, RATE_LIMITS } from "@/lib/rate-limit";
import { NextRequest } from "next/server";
import * as Sentry from "@sentry/nextjs";

/**
 * GET /api/v1/admin/demo-leads
 *
 * Super Admin / Admin only — returns all DemoLead entries for the admin panel.
 * Uses manual auth (not apiHandler) because DemoLead is cross-tenant.
 */
export async function GET(req: NextRequest): Promise<NextResponse> {
  // Rate limiting
  const ip = getClientIp(req);
  const rl = await rateLimit(`admin:demo-leads:${ip}`, RATE_LIMITS.authenticated);
  if (!rl.allowed) {
    return NextResponse.json(
      { success: false, error: "Trop de requetes" },
      { status: 429 },
    );
  }

  const admin = await getAdminUser();
  if (!admin) {
    return NextResponse.json(
      { success: false, error: "Non authentifie" },
      { status: 401 },
    );
  }

  const role = admin.role;
  if (role !== "SUPER_ADMIN" && role !== "ADMIN") {
    return NextResponse.json(
      { success: false, error: "Acces refuse" },
      { status: 403 },
    );
  }

  try {
    const leads = await prisma.demoLead.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    return NextResponse.json({ success: true, data: leads });
  } catch (err) {
    Sentry.captureException(err, { tags: { context: "Admin DemoLeads" } });
    return NextResponse.json(
      { success: false, error: "Erreur interne" },
      { status: 500 },
    );
  }
}
