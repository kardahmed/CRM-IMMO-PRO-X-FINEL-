"use server";

import { prisma } from "@/lib/prisma";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { WorkspaceType } from "@prisma/client";

export async function getAllTenants() {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    // STRICT Security check: Only the super admin can fetch all tenants
    if (user?.email !== "contact@sensium-x.com") {
      throw new Error("Unauthorized");
    }

    const tenants = await prisma.tenant.findMany({
      select: {
        id: true,
        name: true,
        status: true,
        type: true,
      },
      orderBy: { name: "asc" },
    });

    return { tenants };
  } catch (error) {
    console.error("Error fetching tenants:", error);
    return { tenants: [], error: "Failed to fetch tenants" };
  }
}
