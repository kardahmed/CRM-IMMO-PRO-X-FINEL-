import { NextRequest, NextResponse } from "next/server";
import { getAdminUser } from "@/lib/auth";
import { createSupabaseAdminClient } from "@/lib/supabase-server";
import { prisma } from "@/lib/prisma";
import { rateLimit, getClientIp, RATE_LIMITS } from "@/lib/rate-limit";
import * as Sentry from "@sentry/nextjs";

/**
 * PATCH /api/v1/admin/tenants/[id]/users/[userId]
 *
 * Deactivate or reactivate a user. Syncs with Supabase metadata.
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; userId: string }> },
): Promise<NextResponse> {
  const ip = getClientIp(req);
  const rl = await rateLimit(`admin:user:${ip}`, RATE_LIMITS.authenticated);
  if (!rl.allowed) {
    return NextResponse.json({ success: false, error: "Trop de requetes" }, { status: 429 });
  }

  const admin = await getAdminUser();
  if (!admin) {
    return NextResponse.json({ success: false, error: "Non authentifie" }, { status: 401 });
  }

  const role = admin.role;
  if (role !== "SUPER_ADMIN" && role !== "ADMIN") {
    return NextResponse.json({ success: false, error: "Acces refuse" }, { status: 403 });
  }

  const { id: tenantId, userId } = await params;

  try {
    const body = await req.json().catch(() => null);
    if (!body || typeof body.isActive !== "boolean") {
      return NextResponse.json(
        { success: false, error: "Corps invalide — isActive (boolean) requis" },
        { status: 400 },
      );
    }

    const dbUser = await prisma.user.findFirst({
      where: { id: userId, tenantId },
      select: { id: true, supabaseId: true, isActive: true },
    });

    if (!dbUser) {
      return NextResponse.json({ success: false, error: "Utilisateur introuvable" }, { status: 404 });
    }

    // Update DB
    const updated = await prisma.user.update({
      where: { id: userId },
      data: { isActive: body.isActive },
      select: { id: true, firstName: true, lastName: true, email: true, role: true, isActive: true },
    });

    // Sync Supabase user_metadata
    const supabaseAdmin = createSupabaseAdminClient();
    if (!body.isActive) {
      // Deactivating — clear tenantId so user gets redirected to onboarding
      await supabaseAdmin.auth.admin.updateUserById(dbUser.supabaseId, {
        user_metadata: {
          tenantId: null,
          role: null,
          workspaceType: null,
          plan: null,
        },
      });
    } else {
      // Reactivating — restore tenantId
      const tenant = await prisma.tenant.findUnique({
        where: { id: tenantId },
        select: { type: true, plan: true },
      });
      await supabaseAdmin.auth.admin.updateUserById(dbUser.supabaseId, {
        user_metadata: {
          tenantId,
          role: updated.role,
          workspaceType: tenant?.type ?? null,
          plan: tenant?.plan ?? null,
        },
      });
    }

    return NextResponse.json({ success: true, data: updated });
  } catch (err) {
    Sentry.captureException(err, { tags: { context: "Admin User PATCH" } });
    return NextResponse.json({ success: false, error: "Erreur interne" }, { status: 500 });
  }
}

/**
 * DELETE /api/v1/admin/tenants/[id]/users/[userId]
 *
 * Hard-delete a user from DB and clear their Supabase metadata.
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; userId: string }> },
): Promise<NextResponse> {
  const ip = getClientIp(req);
  const rl = await rateLimit(`admin:user:${ip}`, RATE_LIMITS.authenticated);
  if (!rl.allowed) {
    return NextResponse.json({ success: false, error: "Trop de requetes" }, { status: 429 });
  }

  const admin = await getAdminUser();
  if (!admin) {
    return NextResponse.json({ success: false, error: "Non authentifie" }, { status: 401 });
  }

  const role = admin.role;
  if (role !== "SUPER_ADMIN") {
    return NextResponse.json({ success: false, error: "Acces refuse — SUPER_ADMIN requis" }, { status: 403 });
  }

  const { id: tenantId, userId } = await params;

  try {
    const dbUser = await prisma.user.findFirst({
      where: { id: userId, tenantId },
      select: { id: true, supabaseId: true },
    });

    if (!dbUser) {
      return NextResponse.json({ success: false, error: "Utilisateur introuvable" }, { status: 404 });
    }

    // 1. Clear Supabase user_metadata
    const supabaseAdmin = createSupabaseAdminClient();
    await supabaseAdmin.auth.admin.updateUserById(dbUser.supabaseId, {
      user_metadata: {
        tenantId: null,
        role: null,
        workspaceType: null,
        plan: null,
      },
    });

    // 2. Delete user from DB
    await prisma.user.delete({
      where: { id: userId },
    });

    return NextResponse.json({ success: true, data: { deleted: true } });
  } catch (err) {
    Sentry.captureException(err, { tags: { context: "Admin User DELETE" } });
    return NextResponse.json({ success: false, error: "Erreur interne" }, { status: 500 });
  }
}
