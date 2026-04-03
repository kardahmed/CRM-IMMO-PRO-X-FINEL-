"use client";

import { useUser } from "@clerk/nextjs";
import { useMemo } from "react";
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
 * Lit le rôle et le type de workspace depuis publicMetadata Clerk.
 */
export function usePermissions(): IPermissionsContext {
  const { user, isLoaded } = useUser();

  const metadata = user?.publicMetadata as
    | {
        tenantId?: string;
        role?: UserRole;
        workspaceType?: WorkspaceType;
        plan?: PlanType;
      }
    | undefined;

  const role = metadata?.role ?? null;
  const tenantId = metadata?.tenantId ?? null;
  const workspaceType = metadata?.workspaceType ?? null;
  const plan = metadata?.plan ?? null;

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
