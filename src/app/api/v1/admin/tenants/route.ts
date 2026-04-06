import { NextRequest, NextResponse } from "next/server";
import { getAdminUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { rateLimit, getClientIp, RATE_LIMITS } from "@/lib/rate-limit";
import * as Sentry from "@sentry/nextjs";

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                   */
/* -------------------------------------------------------------------------- */

async function requireAdmin(req: NextRequest): Promise<{ error: NextResponse } | { admin: NonNullable<Awaited<ReturnType<typeof getAdminUser>>> }> {
  const ip = getClientIp(req);
  const rl = await rateLimit(`admin:tenants:${ip}`, RATE_LIMITS.authenticated);
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
/*  GET /api/v1/admin/tenants — list all tenants                              */
/* -------------------------------------------------------------------------- */

export async function GET(req: NextRequest): Promise<NextResponse> {
  const auth = await requireAdmin(req);
  if ("error" in auth) return auth.error;

  try {
    const tenants = await prisma.tenant.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        _count: { select: { users: true, clients: true, properties: true } },
      },
    });

    return NextResponse.json({ success: true, data: tenants });
  } catch (err) {
    Sentry.captureException(err, { tags: { context: "Admin Tenants GET" } });
    return NextResponse.json({ success: false, error: "Erreur interne" }, { status: 500 });
  }
}

/* -------------------------------------------------------------------------- */
/*  POST /api/v1/admin/tenants — create a new workspace                       */
/* -------------------------------------------------------------------------- */

import { z } from "zod";
import { createSupabaseAdminClient } from "@/lib/supabase-server";

const createTenantSchema = z.object({
  name: z.string().min(2, "Le nom doit contenir au moins 2 caractères").max(100).trim(),
  type: z.enum(["AGENCY", "PROMOTION"]),
  plan: z.enum(["STARTER", "PRO", "BUSINESS", "ENTERPRISE"]),
  status: z.enum(["ACTIVE", "DEMO", "SUSPENDED"]).default("ACTIVE"),
  // Owner (first user of the workspace)
  ownerEmail: z.string().email("Email invalide"),
  ownerFirstName: z.string().min(1, "Prénom requis").max(100).trim(),
  ownerLastName: z.string().min(1, "Nom requis").max(100).trim(),
  ownerPhone: z.string().max(30).optional(),
  ownerPassword: z.string().min(8, "Minimum 8 caractères"),
});

export async function POST(req: NextRequest): Promise<NextResponse> {
  const auth = await requireAdmin(req);
  if ("error" in auth) return auth.error;

  try {
    const body = await req.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ success: false, error: "Corps de requête invalide" }, { status: 400 });
    }

    const parsed = createTenantSchema.safeParse(body);
    if (!parsed.success) {
      const firstError = parsed.error.issues[0]?.message || "Données invalides";
      return NextResponse.json({ success: false, error: firstError }, { status: 422 });
    }

    const { name, type, plan, status, ownerEmail, ownerFirstName, ownerLastName, ownerPhone, ownerPassword } = parsed.data;

    // 1. Create Supabase Auth user for the owner
    const supabaseAdmin = createSupabaseAdminClient();
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: ownerEmail,
      password: ownerPassword,
      email_confirm: true,
      user_metadata: {
        firstName: ownerFirstName,
        lastName: ownerLastName,
      },
    });

    if (authError || !authData.user) {
      const msg = authError?.message || "Impossible de créer le compte utilisateur";
      return NextResponse.json({ success: false, error: msg }, { status: 400 });
    }

    // 2. Create tenant + user in DB transaction
    const result = await prisma.$transaction(async (tx) => {
      const tenant = await tx.tenant.create({
        data: {
          name,
          type,
          plan,
          status,
          settings: {},
        },
      });

      const user = await tx.user.create({
        data: {
          supabaseId: authData.user.id,
          tenantId: tenant.id,
          firstName: ownerFirstName,
          lastName: ownerLastName,
          email: ownerEmail,
          phone: ownerPhone || null,
          role: "CEO",
          isActive: true,
        },
      });

      return { tenant, userId: user.id };
    });

    // 3. Update Supabase user metadata with tenant info
    await supabaseAdmin.auth.admin.updateUserById(authData.user.id, {
      user_metadata: {
        tenantId: result.tenant.id,
        role: "CEO",
        workspaceType: type,
        plan,
        dbUserId: result.userId,
        firstName: ownerFirstName,
        lastName: ownerLastName,
      },
    });

    return NextResponse.json({ success: true, data: result.tenant }, { status: 201 });
  } catch (err) {
    Sentry.captureException(err, { tags: { context: "Admin Tenants POST" } });
    const message = err instanceof Error ? err.message : "Erreur interne";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
