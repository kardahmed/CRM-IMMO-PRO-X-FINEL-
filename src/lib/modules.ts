import type { WorkspaceType, PlanType, UserRole } from "@prisma/client";

// ============================================================================
// Définition des modules
// ============================================================================

export type ModuleId =
  // Communs
  | "PIPELINE"
  | "CLIENTS"
  | "PLANNING"
  | "DASHBOARD"
  | "NOTIFICATIONS"
  | "SETTINGS"
  | "AUDIT_LOG"
  // PROMOTION
  | "PROJECTS"
  | "CONSTRUCTION_PROGRESS"
  | "AVAILABILITY_GRID"
  | "PAYMENT_SCHEDULE"
  // AGENCY
  | "PORTFOLIO"
  | "OWNERS"
  | "MANDATES"
  | "COMMISSIONS"
  | "TRANSACTION_TYPE"
  // Optionnels (par plan)
  | "AUTOMATIONS"
  | "AI_AGENT"
  | "GEOMAP"
  | "CADASTRE"
  | "PORTAL"
  | "PERFORMANCE"
  | "DOCUMENTS"
  | "OBJECTIVES";

export interface IModuleDefinition {
  id: ModuleId;
  label: string;
  description: string;
  icon: string;
  category: "COMMON" | "PROMOTION" | "AGENCY" | "OPTIONAL";
}

// ============================================================================
// Registry des modules
// ============================================================================

export const MODULE_REGISTRY: Record<ModuleId, IModuleDefinition> = {
  // --- Communs ---
  PIPELINE: {
    id: "PIPELINE",
    label: "Pipeline",
    description: "Pipeline de vente 9 étapes",
    icon: "kanban",
    category: "COMMON",
  },
  CLIENTS: {
    id: "CLIENTS",
    label: "Clients",
    description: "Gestion des clients et leads",
    icon: "users",
    category: "COMMON",
  },
  PLANNING: {
    id: "PLANNING",
    label: "Planning",
    description: "Calendrier visites et tâches",
    icon: "calendar",
    category: "COMMON",
  },
  DASHBOARD: {
    id: "DASHBOARD",
    label: "Tableau de bord",
    description: "KPIs et statistiques",
    icon: "layout-dashboard",
    category: "COMMON",
  },
  NOTIFICATIONS: {
    id: "NOTIFICATIONS",
    label: "Notifications",
    description: "Centre de notifications",
    icon: "bell",
    category: "COMMON",
  },
  SETTINGS: {
    id: "SETTINGS",
    label: "Paramètres",
    description: "Configuration du workspace",
    icon: "settings",
    category: "COMMON",
  },
  AUDIT_LOG: {
    id: "AUDIT_LOG",
    label: "Journal d'activité",
    description: "Historique des actions",
    icon: "scroll-text",
    category: "COMMON",
  },

  // --- PROMOTION ---
  PROJECTS: {
    id: "PROJECTS",
    label: "Programmes",
    description: "Gestion des programmes immobiliers",
    icon: "building-2",
    category: "PROMOTION",
  },
  CONSTRUCTION_PROGRESS: {
    id: "CONSTRUCTION_PROGRESS",
    label: "Avancement travaux",
    description: "Suivi de la construction",
    icon: "hard-hat",
    category: "PROMOTION",
  },
  AVAILABILITY_GRID: {
    id: "AVAILABILITY_GRID",
    label: "Grille de disponibilité",
    description: "Disponibilité des lots par programme",
    icon: "grid-3x3",
    category: "PROMOTION",
  },
  PAYMENT_SCHEDULE: {
    id: "PAYMENT_SCHEDULE",
    label: "Échéancier",
    description: "Échéancier de paiement",
    icon: "banknote",
    category: "PROMOTION",
  },

  // --- AGENCY ---
  PORTFOLIO: {
    id: "PORTFOLIO",
    label: "Portefeuille",
    description: "Portefeuille de biens",
    icon: "home",
    category: "AGENCY",
  },
  OWNERS: {
    id: "OWNERS",
    label: "Propriétaires",
    description: "Gestion des propriétaires",
    icon: "user-check",
    category: "AGENCY",
  },
  MANDATES: {
    id: "MANDATES",
    label: "Mandats",
    description: "Gestion des mandats de vente/location",
    icon: "file-signature",
    category: "AGENCY",
  },
  COMMISSIONS: {
    id: "COMMISSIONS",
    label: "Commissions",
    description: "Suivi des commissions",
    icon: "percent",
    category: "AGENCY",
  },
  TRANSACTION_TYPE: {
    id: "TRANSACTION_TYPE",
    label: "Type de transaction",
    description: "Vente ou location",
    icon: "arrow-left-right",
    category: "AGENCY",
  },

  // --- Optionnels (par plan) ---
  AUTOMATIONS: {
    id: "AUTOMATIONS",
    label: "Automatisations",
    description: "Règles automatiques par étape",
    icon: "zap",
    category: "OPTIONAL",
  },
  AI_AGENT: {
    id: "AI_AGENT",
    label: "Assistant IA",
    description: "Suggestions IA (validation humaine requise)",
    icon: "sparkles",
    category: "OPTIONAL",
  },
  GEOMAP: {
    id: "GEOMAP",
    label: "Carte",
    description: "Cartographie des biens",
    icon: "map",
    category: "OPTIONAL",
  },
  CADASTRE: {
    id: "CADASTRE",
    label: "Cadastre",
    description: "Données cadastrales",
    icon: "map-pin",
    category: "OPTIONAL",
  },
  PORTAL: {
    id: "PORTAL",
    label: "Portail client",
    description: "Espace client en ligne",
    icon: "globe",
    category: "OPTIONAL",
  },
  PERFORMANCE: {
    id: "PERFORMANCE",
    label: "Performance",
    description: "Tableaux de bord avancés",
    icon: "trending-up",
    category: "OPTIONAL",
  },
  DOCUMENTS: {
    id: "DOCUMENTS",
    label: "Documents",
    description: "Génération et gestion de documents",
    icon: "file-text",
    category: "OPTIONAL",
  },
  OBJECTIVES: {
    id: "OBJECTIVES",
    label: "Objectifs",
    description: "KPIs et objectifs par agent",
    icon: "target",
    category: "OPTIONAL",
  },
};

// ============================================================================
// Modules par type de workspace
// ============================================================================

const COMMON_MODULES: ModuleId[] = [
  "PIPELINE",
  "CLIENTS",
  "PLANNING",
  "DASHBOARD",
  "NOTIFICATIONS",
  "SETTINGS",
  "AUDIT_LOG",
];

const PROMOTION_MODULES: ModuleId[] = [
  "PROJECTS",
  "CONSTRUCTION_PROGRESS",
  "AVAILABILITY_GRID",
  "PAYMENT_SCHEDULE",
];

const AGENCY_MODULES: ModuleId[] = [
  "PORTFOLIO",
  "OWNERS",
  "MANDATES",
  "COMMISSIONS",
  "TRANSACTION_TYPE",
];

// ============================================================================
// Modules par plan
// ============================================================================

const PLAN_MODULES: Record<PlanType, ModuleId[]> = {
  STARTER: [],
  PRO: ["AUTOMATIONS", "GEOMAP", "DOCUMENTS", "OBJECTIVES"],
  BUSINESS: [
    "AUTOMATIONS",
    "AI_AGENT",
    "GEOMAP",
    "CADASTRE",
    "DOCUMENTS",
    "OBJECTIVES",
    "PERFORMANCE",
  ],
  ENTERPRISE: [
    "AUTOMATIONS",
    "AI_AGENT",
    "GEOMAP",
    "CADASTRE",
    "PORTAL",
    "DOCUMENTS",
    "OBJECTIVES",
    "PERFORMANCE",
  ],
};

// ============================================================================
// ALL MODULES (for demo bypass)
// ============================================================================

export const ALL_MODULES: ModuleId[] = [
  ...COMMON_MODULES,
  ...PROMOTION_MODULES,
  ...AGENCY_MODULES,
  "AUTOMATIONS",
  "AI_AGENT",
  "GEOMAP",
  "CADASTRE",
  "PORTAL",
  "PERFORMANCE",
  "DOCUMENTS",
  "OBJECTIVES",
];

// ============================================================================
// API publique
// ============================================================================

/**
 * Retourne la liste des modules accessibles pour un workspace donné.
 */
export function getAvailableModules(
  workspaceType: WorkspaceType,
  plan: PlanType,
): ModuleId[] {
  const typeModules =
    workspaceType === "PROMOTION" ? PROMOTION_MODULES : AGENCY_MODULES;
  const planModules = PLAN_MODULES[plan];

  return [...COMMON_MODULES, ...typeModules, ...planModules];
}

/**
 * Vérifie si un module est accessible pour un workspace donné.
 */
export function hasModule(
  moduleId: ModuleId,
  workspaceType: WorkspaceType,
  plan: PlanType,
): boolean {
  return getAvailableModules(workspaceType, plan).includes(moduleId);
}

/**
 * Retourne les modules d'une catégorie donnée.
 */
export function getModulesByCategory(
  category: IModuleDefinition["category"],
): IModuleDefinition[] {
  return Object.values(MODULE_REGISTRY).filter(
    (m) => m.category === category,
  );
}

// ============================================================================
// Rôles et accès aux modules
// ============================================================================

/** Modules restreints par rôle — les modules non listés ici sont accessibles à tous */
const ROLE_RESTRICTED_MODULES: Partial<Record<ModuleId, UserRole[]>> = {
  SETTINGS: ["CEO", "ADMIN"],
  AUDIT_LOG: ["CEO", "ADMIN", "SUPERVISOR"],
  AUTOMATIONS: ["CEO", "ADMIN"],
  AI_AGENT: ["CEO", "ADMIN", "SUPERVISOR", "AGENT"],
  PERFORMANCE: ["CEO", "ADMIN", "SUPERVISOR"],
  OBJECTIVES: ["CEO", "ADMIN", "SUPERVISOR"],
};

/**
 * Vérifie si un utilisateur avec un rôle donné peut accéder à un module.
 */
export function canAccessModule(
  moduleId: ModuleId,
  role: UserRole,
  workspaceType: WorkspaceType,
  plan: PlanType,
): boolean {
  // Le module doit exister pour ce workspace + plan
  if (!hasModule(moduleId, workspaceType, plan)) {
    return false;
  }

  // Vérifier la restriction par rôle
  const allowedRoles = ROLE_RESTRICTED_MODULES[moduleId];
  if (allowedRoles && !allowedRoles.includes(role)) {
    return false;
  }

  return true;
}
