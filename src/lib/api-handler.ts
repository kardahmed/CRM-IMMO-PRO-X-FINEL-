import { NextRequest, NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { type ZodSchema, ZodError } from "zod";
import type { ModuleId } from "@/lib/modules";
import type { PermissionAction } from "@/lib/permissions-matrix";
import { hasPermission } from "@/lib/permissions-matrix";
import { getCurrentUser, type ICurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createTenantPrisma, type TenantPrismaClient } from "@/lib/prisma-tenant";
import { rateLimit, getClientIp, RATE_LIMITS } from "@/lib/rate-limit";

// ============================================================================
// Types
// ============================================================================

export interface IApiContext {
  req: NextRequest;
  user: ICurrentUser;
  tenantId: string;
  db: TenantPrismaClient;
  params: Record<string, string>;
}

interface IApiHandlerOptions {
  module?: ModuleId;
  action?: PermissionAction;
  schema?: ZodSchema;
}

type ApiHandlerFn = (ctx: IApiContext) => Promise<NextResponse>;

// ============================================================================
// Helpers
// ============================================================================

function jsonOk(data: unknown, status = 200) {
  return NextResponse.json({ success: true, data }, { status });
}

function jsonError(error: string, status = 400) {
  return NextResponse.json({ success: false, error }, { status });
}

// ============================================================================
// Core handler
// ============================================================================

/**
 * Wrapper API réutilisable.
 * Gère : auth → tenant isolation → permissions → Zod validation → error handling.
 *
 * Usage :
 *   export const GET = apiHandler(
 *     { module: "CLIENTS", action: "READ" },
 *     async (ctx) => {
 *       const clients = await ctx.db.client.findMany();
 *       return jsonOk(clients);
 *     }
 *   );
 */
export function apiHandler(options: IApiHandlerOptions, handler: ApiHandlerFn) {
  return async (
    req: NextRequest,
    context?: { params?: Promise<Record<string, string>> },
  ): Promise<NextResponse> => {
    try {
      // 0. Rate limiting (50 req/sec per IP for authenticated routes)
      const ip = getClientIp(req);
      const rl = await rateLimit(`api:${ip}`, RATE_LIMITS.authenticated);
      if (!rl.allowed) {
        return jsonError("Too many requests", 429);
      }

      // 1. Auth
      let user: ICurrentUser;
      try {
        user = await getCurrentUser();
      } catch {
        return jsonError("Non authentifié", 401);
      }

      // Super Admin plateforme — accès total, pas de tenant requis
      if (!user.isSuperAdmin && !user.tenantId) {
        return jsonError("Aucun tenant associé", 403);
      }

      // 2. Permission (Super Admin a accès à tout)
      if (options.module && options.action && !user.isSuperAdmin) {
        if (!hasPermission(user.role, options.module, options.action)) {
          return jsonError(
            `Permission refusée : ${options.action} sur ${options.module}`,
            403,
          );
        }
      }

      // 3. Zod validation (body pour POST/PATCH/PUT)
      if (options.schema && ["POST", "PATCH", "PUT"].includes(req.method)) {
        const body = await req.json().catch(() => null);
        if (!body) {
          return jsonError("Corps de requête invalide", 400);
        }
        const parsed = options.schema.safeParse(body);
        if (!parsed.success) {
          const zodErr = parsed.error as ZodError;
          return jsonError(
            zodErr.issues.map((e) => `${String(e.path.join("."))}: ${e.message}`).join(", "),
            422,
          );
        }
        // Attach validated body to request for handler to use
        (req as NextRequest & { validatedBody: unknown }).validatedBody = parsed.data;
      }

      // 4. Build context
      // Super admin sans tenant → client Prisma global (cast pour compatibilité de type)
      const tenantId = user.tenantId ?? "";
      const db = tenantId
        ? createTenantPrisma(tenantId)
        : (prisma as unknown as TenantPrismaClient);
      const params = context?.params ? await context.params : {};

      const ctx: IApiContext = { req, user, tenantId, db, params };

      // 5. Execute handler
      return await handler(ctx);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erreur interne";
      Sentry.captureException(err, { tags: { context: "API Error" }, extra: { method: req.method, url: req.url } });
      return jsonError(message, 500);
    }
  };
}

/**
 * Helper pour extraire le body validé par Zod depuis la requête.
 */
export function getBody<T>(req: NextRequest): T {
  return (req as NextRequest & { validatedBody: T }).validatedBody;
}

// Re-export helpers for route files
export { jsonOk, jsonError };
