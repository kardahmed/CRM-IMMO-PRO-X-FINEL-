import { NextRequest, NextResponse } from "next/server";
import { getAdminUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { rateLimit, getClientIp, RATE_LIMITS } from "@/lib/rate-limit";
import * as Sentry from "@sentry/nextjs";
import { z } from "zod";
import { createSupabaseAdminClient } from "@/lib/supabase-server";

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                   */
/* -------------------------------------------------------------------------- */

async function requireAdmin(req: NextRequest) {
  const ip = getClientIp(req);
  const rl = await rateLimit(`admin:users:${ip}`, RATE_LIMITS.authenticated);
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

/* -------------------------------------------------------------------------- */
/*  GET /api/v1/admin/users — list all users across all tenants               */
/* -------------------------------------------------------------------------- */

export async function GET(req: NextRequest): Promise<NextResponse> {
  const auth = await requireAdmin(req);
  if ("error" in auth) return auth.error;

  try {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        tenant: { select: { id: true, name: true, type: true, plan: true } },
      },
    });

    return NextResponse.json({ success: true, data: users });
  } catch (err) {
    Sentry.captureException(err, { tags: { context: "Admin Users GET" } });
    return NextResponse.json({ success: false, error: "Erreur interne" }, { status: 500 });
  }
}

/* -------------------------------------------------------------------------- */
/*  PATCH /api/v1/admin/users — reset password or toggle active               */
/* -------------------------------------------------------------------------- */

const patchSchema = z.discriminatedUnion("action", [
  z.object({
    userId: z.string().uuid("ID utilisateur invalide"),
    action: z.literal("reset-password"),
    newPassword: z.string().min(8, "Minimum 8 caracteres"),
  }),
  z.object({
    userId: z.string().uuid("ID utilisateur invalide"),
    action: z.literal("toggle-active"),
  }),
]);

export async function PATCH(req: NextRequest): Promise<NextResponse> {
  const auth = await requireAdmin(req);
  if ("error" in auth) return auth.error;

  try {
    const body = await req.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ success: false, error: "Corps de requete invalide" }, { status: 400 });
    }

    const parsed = patchSchema.safeParse(body);
    if (!parsed.success) {
      const firstError = parsed.error.issues[0]?.message || "Donnees invalides";
      return NextResponse.json({ success: false, error: firstError }, { status: 422 });
    }

    const data = parsed.data;

    if (data.action === "reset-password") {
      const user = await prisma.user.findUnique({
        where: { id: data.userId },
        select: { supabaseId: true },
      });

      if (!user) {
        return NextResponse.json({ success: false, error: "Utilisateur introuvable" }, { status: 404 });
      }

      const supabaseAdmin = createSupabaseAdminClient();
      const { error: supaError } = await supabaseAdmin.auth.admin.updateUserById(user.supabaseId, {
        password: data.newPassword,
      });

      if (supaError) {
        return NextResponse.json({ success: false, error: supaError.message }, { status: 400 });
      }

      return NextResponse.json({ success: true, data: { message: "Mot de passe mis a jour" } });
    }

    if (data.action === "toggle-active") {
      const user = await prisma.user.findUnique({
        where: { id: data.userId },
      });

      if (!user) {
        return NextResponse.json({ success: false, error: "Utilisateur introuvable" }, { status: 404 });
      }

      const updated = await prisma.user.update({
        where: { id: data.userId },
        data: { isActive: !user.isActive },
      });

      return NextResponse.json({ success: true, data: { isActive: updated.isActive } });
    }

    return NextResponse.json({ success: false, error: "Action inconnue" }, { status: 400 });
  } catch (err) {
    Sentry.captureException(err, { tags: { context: "Admin Users PATCH" } });
    const message = err instanceof Error ? err.message : "Erreur interne";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
