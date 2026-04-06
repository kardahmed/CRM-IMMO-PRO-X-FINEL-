import { NextRequest, NextResponse } from "next/server";
import { getAdminUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { rateLimit, getClientIp, RATE_LIMITS } from "@/lib/rate-limit";
import * as Sentry from "@sentry/nextjs";

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                   */
/* -------------------------------------------------------------------------- */

async function requireAdmin(req: NextRequest) {
  const ip = getClientIp(req);
  const rl = await rateLimit(`admin:config:${ip}`, RATE_LIMITS.authenticated);
  if (!rl.allowed) {
    return { error: NextResponse.json({ success: false, error: "Trop de requetes" }, { status: 429 }) };
  }

  const admin = await getAdminUser();
  if (!admin) {
    return { error: NextResponse.json({ success: false, error: "Non authentifie" }, { status: 401 }) };
  }

  if (admin.role !== "SUPER_ADMIN" && admin.role !== "ADMIN") {
    return { error: NextResponse.json({ success: false, error: "Acces refuse" }, { status: 403 }) };
  }

  return { admin };
}

/**
 * Ensure the platform_config table exists.
 * Uses IF NOT EXISTS so it's safe to call on every request.
 */
async function ensureTable(): Promise<void> {
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS platform_config (
      key TEXT PRIMARY KEY,
      value JSONB NOT NULL DEFAULT '{}',
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);
}

/* -------------------------------------------------------------------------- */
/*  GET /api/v1/admin/config — read platform configuration                    */
/* -------------------------------------------------------------------------- */

export async function GET(req: NextRequest): Promise<NextResponse> {
  const auth = await requireAdmin(req);
  if ("error" in auth) return auth.error;

  try {
    await ensureTable();

    const rows = await prisma.$queryRawUnsafe<Array<{ value: unknown }>>(
      `SELECT value FROM platform_config WHERE key = 'main' LIMIT 1`
    );

    const config = rows.length > 0 ? rows[0].value : null;

    return NextResponse.json({ success: true, data: config });
  } catch (err) {
    Sentry.captureException(err, { tags: { context: "Admin Config GET" } });
    return NextResponse.json({ success: false, error: "Erreur interne" }, { status: 500 });
  }
}

/* -------------------------------------------------------------------------- */
/*  POST /api/v1/admin/config — save platform configuration                   */
/* -------------------------------------------------------------------------- */

export async function POST(req: NextRequest): Promise<NextResponse> {
  const auth = await requireAdmin(req);
  if ("error" in auth) return auth.error;

  try {
    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json({ success: false, error: "Corps de requete invalide" }, { status: 400 });
    }

    await ensureTable();

    const jsonValue = JSON.stringify(body);

    await prisma.$executeRawUnsafe(
      `INSERT INTO platform_config (key, value, updated_at)
       VALUES ('main', $1::jsonb, NOW())
       ON CONFLICT (key) DO UPDATE SET value = $1::jsonb, updated_at = NOW()`,
      jsonValue
    );

    return NextResponse.json({ success: true });
  } catch (err) {
    Sentry.captureException(err, { tags: { context: "Admin Config POST" } });
    const message = err instanceof Error ? err.message : "Erreur interne";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
