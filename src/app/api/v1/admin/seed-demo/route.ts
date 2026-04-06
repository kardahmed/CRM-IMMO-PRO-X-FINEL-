import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase-server";
import { prisma } from "@/lib/prisma";

/**
 * POST /api/v1/admin/seed-demo
 *
 * Temporary route to create demo auth users with proper password hashing.
 * Creates Supabase Auth users via admin API, then updates DB user supabase_id.
 */
export async function POST() {
  const supabaseAdmin = createSupabaseAdminClient();

  const demos = [
    {
      email: "demo-agence@immoprox.com",
      password: "Demo2024!",
      dbUserId: "9af5c205-8610-4133-b502-986e3c30efe7",
      tenantId: "d6fe334f-dae4-4521-a946-d5b6eaba292a",
      firstName: "Ahmad",
      lastName: "Directeur",
      role: "CEO",
      workspaceType: "AGENCY",
      plan: "ENTERPRISE",
      tenantName: "Agence Immobilière Demo",
    },
    {
      email: "demo-promotion@immoprox.com",
      password: "Demo2024!",
      password2: "Demo2024!",
      dbUserId: "8d453680-4cbd-4a13-8bd1-2851719deeb6",
      tenantId: "6cc0f4ca-fd89-47ca-9402-2b269dc89d39",
      firstName: "Ahmad",
      lastName: "Promoteur",
      role: "CEO",
      workspaceType: "PROMOTION",
      plan: "ENTERPRISE",
      tenantName: "Promotion Immobilière Demo",
    },
  ];

  const results = [];

  for (const demo of demos) {
    // Create auth user via admin API (proper bcrypt hashing)
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: demo.email,
      password: demo.password,
      email_confirm: true,
      user_metadata: {
        tenantId: demo.tenantId,
        role: demo.role,
        workspaceType: demo.workspaceType,
        plan: demo.plan,
        tenantName: demo.tenantName,
        dbUserId: demo.dbUserId,
        firstName: demo.firstName,
        lastName: demo.lastName,
      },
    });

    if (authError) {
      results.push({ email: demo.email, error: authError.message });
      continue;
    }

    // Update DB user with new Supabase Auth ID
    await prisma.user.update({
      where: { id: demo.dbUserId },
      data: { supabaseId: authUser.user.id },
    });

    results.push({
      email: demo.email,
      authId: authUser.user.id,
      dbUserId: demo.dbUserId,
      success: true,
    });
  }

  return NextResponse.json({ success: true, results });
}
