import { cookies } from "next/headers";
import { WorkspaceType, UserRole } from "@prisma/client";
import { createSupabaseServerClient } from "./supabase-server";

export interface ISimulatedContext {
  isSimulating: boolean;
  tenantId: string | null;
  workspaceType: WorkspaceType | null;
  role: UserRole | null;
}

const COOKIE_NAMES = {
  TENANT_ID: "x-sim-tenant-id",
  MODE: "x-sim-mode",
  ROLE: "x-sim-role",
  ACTIVE: "x-sim-active",
};

/**
 * Récupère le contexte de simulation côté serveur via les cookies.
 * Vérifie TOUJOURS que l'utilisateur est le Super Admin avant d'autoriser la simulation.
 */
export async function getSimulatedContext(): Promise<ISimulatedContext> {
  const cookieStore = await cookies();
  
  const isActive = cookieStore.get(COOKIE_NAMES.ACTIVE)?.value === "true";
  if (!isActive) {
    return { isSimulating: false, tenantId: null, workspaceType: null, role: null };
  }

  // Double check auth to ensure only Super Admin can simulate
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (user?.email !== "contact@sensium-x.com") {
      return { isSimulating: false, tenantId: null, workspaceType: null, role: null };
    }

    return {
      isSimulating: true,
      tenantId: cookieStore.get(COOKIE_NAMES.TENANT_ID)?.value ?? null,
      workspaceType: (cookieStore.get(COOKIE_NAMES.MODE)?.value as WorkspaceType) ?? null,
      role: (cookieStore.get(COOKIE_NAMES.ROLE)?.value as UserRole) ?? null,
    };
  } catch {
    return { isSimulating: false, tenantId: null, workspaceType: null, role: null };
  }
}
