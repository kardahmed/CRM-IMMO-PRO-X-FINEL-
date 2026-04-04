import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import type { UserRole } from "@prisma/client";

/**
 * GET /api/v1/admin/demo-leads
 *
 * Super Admin only — returns all DemoLead entries for the admin panel.
 */
export async function GET(): Promise<NextResponse> {
  const user = await currentUser();
  if (!user) {
    return NextResponse.json(
      { success: false, error: "Non authentifie" },
      { status: 401 },
    );
  }

  const role = user.publicMetadata?.role as UserRole | undefined;
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
    console.error("[Admin DemoLeads]", err);
    return NextResponse.json(
      { success: false, error: "Erreur interne" },
      { status: 500 },
    );
  }
}
