import { NextResponse } from "next/server";
import type { ITenantContext } from "@/middleware/tenant-isolation";
import { type ModuleId, hasModule, canAccessModule } from "@/lib/modules";
import { prisma } from "@/lib/prisma";

/**
 * Vérifie l'accès à un module pour le tenant et l'utilisateur courant.
 * Charge le type de workspace et le plan depuis la DB.
 * Retourne 403 si pas d'accès.
 *
 * Usage dans un route handler :
 *   const guard = await requireModule("PROJECTS", ctx);
 *   if (guard instanceof NextResponse) return guard;
 */
export async function requireModule(
  moduleId: ModuleId,
  ctx: ITenantContext,
): Promise<NextResponse | true> {
  const tenant = await prisma.tenant.findUnique({
    where: { id: ctx.tenantId },
    select: { type: true, plan: true, status: true },
  });

  if (!tenant) {
    return NextResponse.json(
      { success: false, error: "Tenant introuvable" },
      { status: 404 },
    );
  }

  if (tenant.status === "SUSPENDED") {
    return NextResponse.json(
      { success: false, error: "Workspace suspendu" },
      { status: 403 },
    );
  }

  // Vérifier que le module existe pour ce type + plan
  if (!hasModule(moduleId, tenant.type, tenant.plan)) {
    return NextResponse.json(
      {
        success: false,
        error: `Module "${moduleId}" non disponible pour ce workspace (${tenant.type}, plan ${tenant.plan})`,
      },
      { status: 403 },
    );
  }

  // Vérifier que le rôle de l'utilisateur peut accéder au module
  if (!canAccessModule(moduleId, ctx.user.role, tenant.type, tenant.plan)) {
    return NextResponse.json(
      {
        success: false,
        error: `Accès refusé au module "${moduleId}" pour le rôle ${ctx.user.role}`,
      },
      { status: 403 },
    );
  }

  return true;
}

/**
 * Vérifie que le workspace est de type PROMOTION.
 */
export async function requirePromotion(
  ctx: ITenantContext,
): Promise<NextResponse | true> {
  const tenant = await prisma.tenant.findUnique({
    where: { id: ctx.tenantId },
    select: { type: true },
  });

  if (!tenant || tenant.type !== "PROMOTION") {
    return NextResponse.json(
      {
        success: false,
        error: "Cette fonctionnalité est réservée aux promoteurs",
      },
      { status: 403 },
    );
  }

  return true;
}

/**
 * Vérifie que le workspace est de type AGENCY.
 */
export async function requireAgency(
  ctx: ITenantContext,
): Promise<NextResponse | true> {
  const tenant = await prisma.tenant.findUnique({
    where: { id: ctx.tenantId },
    select: { type: true },
  });

  if (!tenant || tenant.type !== "AGENCY") {
    return NextResponse.json(
      {
        success: false,
        error: "Cette fonctionnalité est réservée aux agences",
      },
      { status: 403 },
    );
  }

  return true;
}
