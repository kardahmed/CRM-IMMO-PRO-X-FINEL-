import { NextRequest, NextResponse } from "next/server";
import { getAdminUser } from "@/lib/auth";
import { createSupabaseAdminClient } from "@/lib/supabase-server";
import { prisma } from "@/lib/prisma";
import { rateLimit, getClientIp, RATE_LIMITS } from "@/lib/rate-limit";
import { z } from "zod";
import * as Sentry from "@sentry/nextjs";

const updateTenantSchema = z.object({
  status: z.enum(["ACTIVE", "DEMO", "SUSPENDED"]).optional(),
  plan: z.enum(["STARTER", "PRO", "BUSINESS", "ENTERPRISE"]).optional(),
  name: z.string().min(1).max(200).optional(),
  settings: z.record(z.string(), z.unknown()).optional(),
});

/**
 * GET /api/v1/admin/tenants/[id]
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const ip = getClientIp(req);
  const rl = await rateLimit(`admin:tenant:${ip}`, RATE_LIMITS.authenticated);
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

  const { id } = await params;

  try {
    const tenant = await prisma.tenant.findUnique({
      where: { id },
      include: {
        users: {
          select: { id: true, firstName: true, lastName: true, email: true, role: true, isActive: true },
        },
        _count: { select: { clients: true, properties: true, projects: true } },
      },
    });

    if (!tenant) {
      return NextResponse.json({ success: false, error: "Tenant introuvable" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: tenant });
  } catch (err) {
    Sentry.captureException(err, { tags: { context: "Admin Tenant Detail" } });
    return NextResponse.json({ success: false, error: "Erreur interne" }, { status: 500 });
  }
}

/**
 * PUT /api/v1/admin/tenants/[id]
 *
 * Update tenant status, plan, name, etc.
 * When changing status from DEMO to ACTIVE, also updates Supabase metadata for all users.
 */
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const ip = getClientIp(req);
  const rl = await rateLimit(`admin:tenant:${ip}`, RATE_LIMITS.authenticated);
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

  const { id } = await params;

  try {
    const body = await req.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ success: false, error: "Corps invalide" }, { status: 400 });
    }

    const parsed = updateTenantSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0]?.message || "Donnees invalides" },
        { status: 422 },
      );
    }

    const data = parsed.data;

    const existing = await prisma.tenant.findUnique({
      where: { id },
      select: { status: true, plan: true },
    });
    if (!existing) {
      return NextResponse.json({ success: false, error: "Tenant introuvable" }, { status: 404 });
    }

    // Build update payload
    const updateData: Record<string, unknown> = {};
    if (data.status) updateData.status = data.status;
    if (data.plan) updateData.plan = data.plan;
    if (data.name) updateData.name = data.name;
    if (data.settings) {
      const currentSettings = await prisma.tenant.findUnique({
        where: { id },
        select: { settings: true },
      });
      const merged = {
        ...(typeof currentSettings?.settings === "object" && currentSettings.settings !== null
          ? currentSettings.settings
          : {}),
        ...data.settings,
      };
      updateData.settings = merged;
    }
    // When activating (DEMO → ACTIVE), clear demo fields from settings
    if (data.status === "ACTIVE" && existing.status === "DEMO") {
      const currentSettings = await prisma.tenant.findUnique({
        where: { id },
        select: { settings: true },
      });
      const settingsObj =
        typeof currentSettings?.settings === "object" && currentSettings.settings !== null
          ? { ...(currentSettings.settings as Record<string, unknown>) }
          : {};
      delete settingsObj.demoExpiresAt;
      delete settingsObj.demoLimits;
      updateData.settings = settingsObj;
    }

    const updated = await prisma.tenant.update({
      where: { id },
      data: updateData,
    });

    // If plan changed, update Supabase user_metadata for all tenant users
    if (data.plan && data.plan !== existing.plan) {
      const tenantUsers = await prisma.user.findMany({
        where: { tenantId: id, isActive: true },
        select: { supabaseId: true },
      });

      const supabaseAdmin = createSupabaseAdminClient();
      await Promise.allSettled(
        tenantUsers.map((u) =>
          supabaseAdmin.auth.admin.updateUserById(u.supabaseId, {
            user_metadata: { plan: data.plan },
          }),
        ),
      );
    }

    return NextResponse.json({ success: true, data: updated });
  } catch (err) {
    Sentry.captureException(err, { tags: { context: "Admin Tenant Update" } });
    return NextResponse.json({ success: false, error: "Erreur interne" }, { status: 500 });
  }
}

/**
 * DELETE /api/v1/admin/tenants/[id]
 *
 * Delete a workspace: deactivate all users, clear Supabase metadata, then delete the tenant.
 * Cascading deletes in Prisma schema handle clients, properties, projects, etc.
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const ip = getClientIp(req);
  const rl = await rateLimit(`admin:tenant:${ip}`, RATE_LIMITS.authenticated);
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

  const { id } = await params;

  try {
    // 1. Get all users of this tenant
    const tenantUsers = await prisma.user.findMany({
      where: { tenantId: id },
      select: { id: true, supabaseId: true },
    });

    // 2. Clear Supabase user_metadata for all users (remove tenantId, role, plan)
    const supabaseAdmin = createSupabaseAdminClient();
    await Promise.allSettled(
      tenantUsers.map((u) =>
        supabaseAdmin.auth.admin.updateUserById(u.supabaseId, {
          user_metadata: {
            tenantId: null,
            role: null,
            workspaceType: null,
            plan: null,
          },
        }),
      ),
    );

    // 3. Deactivate all users in DB
    await prisma.user.updateMany({
      where: { tenantId: id },
      data: { isActive: false },
    });

    // 4. Delete the tenant (cascade removes related data)
    await prisma.tenant.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, data: { deleted: true, usersCleared: tenantUsers.length } });
  } catch (err) {
    Sentry.captureException(err, { tags: { context: "Admin Tenant Delete" } });
    return NextResponse.json({ success: false, error: "Erreur interne" }, { status: 500 });
  }
}
