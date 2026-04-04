import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { rateLimit, getClientIp, RATE_LIMITS } from "@/lib/rate-limit";
import type { UserRole } from "@prisma/client";

/**
 * GET /api/v1/admin/tenants
 *
 * Super Admin only — lists all tenants with user count.
 */
export async function GET(req: NextRequest): Promise<NextResponse> {
  const ip = getClientIp(req);
  const rl = await rateLimit(`admin:tenants:${ip}`, RATE_LIMITS.authenticated);
  if (!rl.allowed) {
    return NextResponse.json({ success: false, error: "Trop de requetes" }, { status: 429 });
  }

  const user = await currentUser();
  if (!user) {
    return NextResponse.json({ success: false, error: "Non authentifie" }, { status: 401 });
  }

  const role = user.publicMetadata?.role as UserRole | undefined;
  if (role !== "SUPER_ADMIN" && role !== "ADMIN") {
    return NextResponse.json({ success: false, error: "Acces refuse" }, { status: 403 });
  }

  try {
    const tenants = await prisma.tenant.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        _count: { select: { users: true, clients: true, properties: true } },
      },
    });

    return NextResponse.json({ success: true, data: tenants });
  } catch (err) {
    console.error("[Admin Tenants]", err);
    return NextResponse.json({ success: false, error: "Erreur interne" }, { status: 500 });
  }
}
