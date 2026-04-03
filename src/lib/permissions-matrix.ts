import type { UserRole } from "@prisma/client";
import type { ModuleId } from "@/lib/modules";

// ============================================================================
// Actions
// ============================================================================

export type PermissionAction =
  | "CREATE"
  | "READ"
  | "READ_ALL"
  | "UPDATE"
  | "DELETE"
  | "ASSIGN"
  | "EXPORT";

// ============================================================================
// Matrice de permissions : { role → { module → { action → boolean } } }
// ============================================================================

type ModulePermissions = Partial<Record<PermissionAction, boolean>>;
type RolePermissions = Partial<Record<ModuleId, ModulePermissions>>;

/** Permissions par défaut pour chaque rôle si non spécifié dans la matrice */
const DEFAULT_PERMISSIONS: Record<UserRole, ModulePermissions> = {
  SUPER_ADMIN: {
    CREATE: true,
    READ: true,
    READ_ALL: true,
    UPDATE: true,
    DELETE: true,
    ASSIGN: true,
    EXPORT: true,
  },
  CEO: {
    CREATE: true,
    READ: true,
    READ_ALL: true,
    UPDATE: true,
    DELETE: true,
    ASSIGN: true,
    EXPORT: true,
  },
  ADMIN: {
    CREATE: true,
    READ: true,
    READ_ALL: true,
    UPDATE: true,
    DELETE: true,
    ASSIGN: true,
    EXPORT: true,
  },
  SUPERVISOR: {
    CREATE: true,
    READ: true,
    READ_ALL: true,
    UPDATE: true,
    DELETE: false,
    ASSIGN: true,
    EXPORT: true,
  },
  AGENT: {
    CREATE: true,
    READ: true,
    READ_ALL: false,
    UPDATE: true,
    DELETE: false,
    ASSIGN: false,
    EXPORT: false,
  },
  ASSISTANT: {
    CREATE: false,
    READ: true,
    READ_ALL: true,
    UPDATE: false,
    DELETE: false,
    ASSIGN: false,
    EXPORT: false,
  },
};

/**
 * Overrides spécifiques par module.
 * Seules les exceptions sont listées — le reste utilise DEFAULT_PERMISSIONS.
 */
const PERMISSION_OVERRIDES: Partial<Record<UserRole, RolePermissions>> = {
  SUPERVISOR: {
    SETTINGS: {
      CREATE: false,
      READ: true,
      READ_ALL: true,
      UPDATE: false,
      DELETE: false,
      ASSIGN: false,
      EXPORT: false,
    },
    AUDIT_LOG: {
      CREATE: false,
      READ: true,
      READ_ALL: true,
      UPDATE: false,
      DELETE: false,
      ASSIGN: false,
      EXPORT: true,
    },
    AUTOMATIONS: {
      CREATE: false,
      READ: true,
      READ_ALL: true,
      UPDATE: false,
      DELETE: false,
      ASSIGN: false,
      EXPORT: false,
    },
  },
  AGENT: {
    CLIENTS: {
      CREATE: true,
      READ: true,
      READ_ALL: false, // Agent ne voit que ses clients
      UPDATE: true,
      DELETE: false,
      ASSIGN: false, // Agent ne peut pas réassigner
      EXPORT: false,
    },
    PLANNING: {
      CREATE: true,
      READ: true,
      READ_ALL: false,
      UPDATE: true,
      DELETE: false,
      ASSIGN: false,
      EXPORT: false,
    },
    SETTINGS: {
      CREATE: false,
      READ: false,
      READ_ALL: false,
      UPDATE: false,
      DELETE: false,
      ASSIGN: false,
      EXPORT: false,
    },
    AUDIT_LOG: {
      CREATE: false,
      READ: false,
      READ_ALL: false,
      UPDATE: false,
      DELETE: false,
      ASSIGN: false,
      EXPORT: false,
    },
  },
  ASSISTANT: {
    CLIENTS: {
      CREATE: false,
      READ: true,
      READ_ALL: true, // Lecture seule mais voit tous
      UPDATE: false,
      DELETE: false,
      ASSIGN: false,
      EXPORT: false,
    },
    SETTINGS: {
      CREATE: false,
      READ: false,
      READ_ALL: false,
      UPDATE: false,
      DELETE: false,
      ASSIGN: false,
      EXPORT: false,
    },
  },
};

// ============================================================================
// API publique
// ============================================================================

/**
 * Retourne les permissions pour un rôle sur un module donné.
 * Utilise les overrides si définis, sinon les defaults du rôle.
 */
export function getPermissions(
  role: UserRole,
  moduleId: ModuleId,
): ModulePermissions {
  const overrides = PERMISSION_OVERRIDES[role]?.[moduleId];
  if (overrides) return overrides;
  return DEFAULT_PERMISSIONS[role];
}

/**
 * Vérifie si un rôle a une permission spécifique sur un module.
 */
export function hasPermission(
  role: UserRole,
  moduleId: ModuleId,
  action: PermissionAction,
): boolean {
  const perms = getPermissions(role, moduleId);
  return perms[action] ?? false;
}

/**
 * Retourne toutes les actions autorisées pour un rôle sur un module.
 */
export function getAllowedActions(
  role: UserRole,
  moduleId: ModuleId,
): PermissionAction[] {
  const perms = getPermissions(role, moduleId);
  return (Object.entries(perms) as [PermissionAction, boolean][])
    .filter(([, allowed]) => allowed)
    .map(([action]) => action);
}
