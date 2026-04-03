import { NextResponse } from "next/server";
import type { UserRole } from "@prisma/client";
import type { ModuleId } from "@/lib/modules";
import {
  type PermissionAction,
  hasPermission,
} from "@/lib/permissions-matrix";
import type { ITenantContext } from "@/middleware/tenant-isolation";
import { withTenantIsolation } from "@/middleware/tenant-isolation";
import type { NextRequest } from "next/server";

/**
 * Vérifie si un rôle peut effectuer une action sur un module.
 * Fonction pure, pas d'I/O.
 */
export function canDo(
  role: UserRole,
  moduleId: ModuleId,
  action: PermissionAction,
): boolean {
  return hasPermission(role, moduleId, action);
}

/**
 * Wrapper API : vérifie tenant isolation + permission avant exécution du handler.
 *
 * Usage :
 *   export async function POST(req: NextRequest) {
 *     return withPermission(req, "CLIENTS", "CREATE", async (ctx) => {
 *       // ctx.user, ctx.tenantId disponibles
 *       return NextResponse.json({ success: true, data: ... });
 *     });
 *   }
 */
export async function withPermission(
  req: NextRequest,
  moduleId: ModuleId,
  action: PermissionAction,
  handler: (ctx: ITenantContext) => Promise<NextResponse>,
): Promise<NextResponse> {
  // 1. Vérifier tenant isolation
  const ctx = await withTenantIsolation(req);
  if (ctx instanceof NextResponse) return ctx;

  // 2. Vérifier permission
  if (!canDo(ctx.user.role, moduleId, action)) {
    return NextResponse.json(
      {
        success: false,
        error: `Permission refusée : ${action} sur ${moduleId} pour le rôle ${ctx.user.role}`,
      },
      { status: 403 },
    );
  }

  // 3. Exécuter le handler
  return handler(ctx);
}
