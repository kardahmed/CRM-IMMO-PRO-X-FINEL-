import { NextRequest, NextResponse } from "next/server";
import { getAdminUser } from "@/lib/auth";
import { createSupabaseAdminClient } from "@/lib/supabase-server";
import { prisma } from "@/lib/prisma";
import { rateLimit, getClientIp, RATE_LIMITS } from "@/lib/rate-limit";
import { z } from "zod";
import * as Sentry from "@sentry/nextjs";

const createUserSchema = z.object({
  firstName: z.string().min(1, "Prenom requis").max(100),
  lastName: z.string().min(1, "Nom requis").max(100),
  email: z.string().email("Email invalide"),
  phone: z.string().max(30).optional().default(""),
  password: z.string().min(6, "Mot de passe trop court (min 6 caracteres)"),
  role: z.enum(["CEO", "SUPERVISOR", "AGENT", "ASSISTANT"]),
});

/**
 * POST /api/v1/admin/tenants/[id]/users
 *
 * Create a new user in the workspace:
 * 1. Create Supabase auth user
 * 2. Create DB user record
 * 3. Update Supabase metadata with tenant info
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const ip = getClientIp(req);
  const rl = await rateLimit(`admin:create-user:${ip}`, RATE_LIMITS.authenticated);
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

    const parsed = createUserSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0]?.message || "Donnees invalides" },
        { status: 422 },
      );
    }

    const { firstName, lastName, email, phone, password, role: userRole } = parsed.data;

    // Verify tenant exists
    const tenant = await prisma.tenant.findUnique({
      where: { id },
      select: { id: true, type: true, plan: true },
    });

    if (!tenant) {
      return NextResponse.json({ success: false, error: "Tenant introuvable" }, { status: 404 });
    }

    // Check if email already exists in this tenant
    const existingUser = await prisma.user.findFirst({
      where: { email, tenantId: id },
    });

    if (existingUser) {
      return NextResponse.json(
        { success: false, error: "Un utilisateur avec cet email existe deja dans ce workspace" },
        { status: 409 },
      );
    }

    // 1. Create Supabase auth user
    const supabaseAdmin = createSupabaseAdminClient();
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { firstName, lastName },
    });

    if (authError || !authData?.user) {
      return NextResponse.json(
        { success: false, error: authError?.message || "Erreur lors de la creation du compte auth" },
        { status: 400 },
      );
    }

    // 2. Create DB user
    const user = await prisma.user.create({
      data: {
        supabaseId: authData.user.id,
        tenantId: id,
        firstName,
        lastName,
        email,
        phone: phone || "",
        role: userRole,
        isActive: true,
      },
      select: { id: true, firstName: true, lastName: true, email: true, role: true, isActive: true },
    });

    // 3. Update Supabase metadata with tenant info
    await supabaseAdmin.auth.admin.updateUserById(authData.user.id, {
      user_metadata: {
        tenantId: id,
        role: userRole,
        workspaceType: tenant.type,
        plan: tenant.plan,
        dbUserId: user.id,
      },
    });

    return NextResponse.json({ success: true, data: user }, { status: 201 });
  } catch (err) {
    Sentry.captureException(err, { tags: { context: "Admin Create User" } });
    return NextResponse.json({ success: false, error: "Erreur interne" }, { status: 500 });
  }
}
