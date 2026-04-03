"use client";

import type { ReactNode } from "react";
import { usePermissions } from "@/hooks/usePermissions";
import type { ModuleId } from "@/lib/modules";
import type { PermissionAction } from "@/lib/permissions-matrix";

interface PermissionGateProps {
  module: ModuleId;
  action: PermissionAction;
  children: ReactNode;
  fallback?: ReactNode;
}

/**
 * Cache ou affiche ses enfants selon les permissions de l'utilisateur courant.
 *
 * Usage :
 *   <PermissionGate module="CLIENTS" action="CREATE">
 *     <Button>Nouveau client</Button>
 *   </PermissionGate>
 */
export function PermissionGate({
  module,
  action,
  children,
  fallback = null,
}: PermissionGateProps) {
  const { canDo, isLoading } = usePermissions();

  if (isLoading) return null;

  if (!canDo(module, action)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
