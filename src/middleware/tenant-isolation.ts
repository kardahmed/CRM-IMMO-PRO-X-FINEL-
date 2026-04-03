import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, type ICurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * Contexte injecté dans chaque requête API après vérification tenant.
 * Les handlers API lisent ce contexte via getTenantContext().
 */
export interface ITenantContext {
  user: ICurrentUser;
  tenantId: string;
}

/**
 * Middleware d'isolation tenant pour les routes /api/v1/*.
 * - Extrait le tenantId du user authentifié
 * - Retourne 403 si pas de tenantId
 * - Log l'accès dans ActivityLog
 * - Injecte le contexte tenant dans les headers de la requête
 */
export async function tenantIsolationMiddleware(
  req: NextRequest,
): Promise<NextResponse | ITenantContext> {
  let user: ICurrentUser;

  try {
    user = await getCurrentUser();
  } catch {
    return NextResponse.json(
      { success: false, error: "Non authentifié" },
      { status: 401 },
    );
  }

  if (!user.tenantId) {
    return NextResponse.json(
      { success: false, error: "Aucun tenant associé à cet utilisateur" },
      { status: 403 },
    );
  }

  // Log asynchrone dans ActivityLog (non-bloquant)
  logApiAccess(user, req).catch(() => {
    // Silently ignore logging errors to not block the request
  });

  return {
    user,
    tenantId: user.tenantId,
  };
}

/**
 * Helper pour les route handlers API.
 * Vérifie l'isolation tenant et retourne le contexte ou une réponse d'erreur.
 *
 * Usage dans un route handler :
 *   const result = await withTenantIsolation(req);
 *   if (result instanceof NextResponse) return result;
 *   const { user, tenantId } = result;
 */
export async function withTenantIsolation(
  req: NextRequest,
): Promise<NextResponse | ITenantContext> {
  return tenantIsolationMiddleware(req);
}

/**
 * Log l'accès API dans activity_logs.
 */
async function logApiAccess(
  user: ICurrentUser,
  req: NextRequest,
): Promise<void> {
  const url = new URL(req.url);
  const path = url.pathname;
  const method = req.method;

  await prisma.activityLog.create({
    data: {
      tenantId: user.tenantId,
      userId: user.userId,
      action: `API_${method}`,
      entity: "API",
      entityId: path,
      metadata: {
        method,
        path,
        userAgent: req.headers.get("user-agent") || "unknown",
        timestamp: new Date().toISOString(),
      },
    },
  });
}
