"use client";

import { useMemo } from "react";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import type { UserRole, WorkspaceType, PlanType } from "@prisma/client";
import type { ModuleId } from "@/lib/modules";
import type { PermissionAction } from "@/lib/permissions-matrix";
import { hasPermission } from "@/lib/permissions-matrix";
import { getAvailableModules } from "@/lib/modules";

interface IPermissionsContext {
  role: UserRole | null;
  tenantId: string | null;
  workspaceType: WorkspaceType | null;
  plan: PlanType | null;
  isLoading: boolean;
  canDo: (moduleId: ModuleId, action: PermissionAction) => boolean;
  modules: ModuleId[];
}

/**
 * Hook pour vérifier les permissions côté client.
 * Lit le rôle et le type de workspace depuis useSupabaseAuth.
 */
export function usePermissions(): IPermissionsContext {
  const { isLoaded, tenantId: rawTenantId, role: rawRole, workspaceType: rawWorkspaceType, plan: rawPlan } = useSupabaseAuth();

  const role = (rawRole as UserRole) ?? null;
  const tenantId = rawTenantId ?? null;
  const workspaceType = (rawWorkspaceType as WorkspaceType) ?? null;
  const plan = (rawPlan as PlanType) ?? null;

  const modules = useMemo(() => {
    if (!workspaceType || !plan) return [];
    return getAvailableModules(workspaceType, plan);
  }, [workspaceType, plan]);

  const canDo = useMemo(() => {
    return (moduleId: ModuleId, action: PermissionAction): boolean => {
      if (!role) return false;
      return hasPermission(role, moduleId, action);
    };
  }, [role]);

  return {
    role,
    tenantId,
    workspaceType,
    plan,
    isLoading: !isLoaded,
    canDo,
    modules,
  };
}

/**
 * Hook raccourci pour récupérer le rôle courant.
 */
export function useCurrentRole(): UserRole | null {
  const { role } = usePermissions();
  return role;
}

/**
 * Hook raccourci pour récupérer les modules disponibles.
 */
export function useModules(): ModuleId[] {
  const { modules } = usePermissions();
  return modules;
}
