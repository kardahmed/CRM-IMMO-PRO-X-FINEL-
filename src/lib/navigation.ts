import type { WorkspaceType, PlanType, UserRole } from "@prisma/client";
import {
  type ModuleId,
  getAvailableModules,
  canAccessModule,
} from "@/lib/modules";

// ============================================================================
// Types
// ============================================================================

export interface INavItem {
  id: string;
  label: string;
  icon: string;
  href: string;
  moduleId?: ModuleId;
  children?: INavItem[];
}

export interface INavSection {
  title: string;
  items: INavItem[];
}

// ============================================================================
// Définition des items de navigation
// ============================================================================

const NAV_ITEMS: Record<ModuleId, INavItem> = {
  DASHBOARD: {
    id: "dashboard",
    label: "Tableau de bord",
    icon: "layout-dashboard",
    href: "/dashboard",
    moduleId: "DASHBOARD",
  },
  PIPELINE: {
    id: "pipeline",
    label: "Pipeline",
    icon: "kanban",
    href: "/pipeline",
    moduleId: "PIPELINE",
  },
  CLIENTS: {
    id: "clients",
    label: "Clients",
    icon: "users",
    href: "/clients",
    moduleId: "CLIENTS",
  },
  PLANNING: {
    id: "planning",
    label: "Planning",
    icon: "calendar",
    href: "/planning",
    moduleId: "PLANNING",
  },
  NOTIFICATIONS: {
    id: "notifications",
    label: "Notifications",
    icon: "bell",
    href: "/notifications",
    moduleId: "NOTIFICATIONS",
  },

  // PROMOTION
  PROJECTS: {
    id: "projects",
    label: "Properties",
    icon: "building-2",
    href: "/properties",
    moduleId: "PROJECTS",
  },
  CONSTRUCTION_PROGRESS: {
    id: "construction",
    label: "Avancement",
    icon: "hard-hat",
    href: "/construction",
    moduleId: "CONSTRUCTION_PROGRESS",
  },
  AVAILABILITY_GRID: {
    id: "availability",
    label: "Catalogue",
    icon: "grid-3x3",
    href: "/properties",
    moduleId: "AVAILABILITY_GRID",
  },
  PAYMENT_SCHEDULE: {
    id: "payments",
    label: "Echeancier",
    icon: "banknote",
    href: "/payments",
    moduleId: "PAYMENT_SCHEDULE",
  },

  // AGENCY
  PORTFOLIO: {
    id: "portfolio",
    label: "Portefeuille",
    icon: "home",
    href: "/portfolio",
    moduleId: "PORTFOLIO",
  },
  OWNERS: {
    id: "owners",
    label: "Proprietaires",
    icon: "user-check",
    href: "/owners",
    moduleId: "OWNERS",
  },
  MANDATES: {
    id: "mandates",
    label: "Mandats",
    icon: "file-signature",
    href: "/mandates",
    moduleId: "MANDATES",
  },
  COMMISSIONS: {
    id: "commissions",
    label: "Commissions",
    icon: "percent",
    href: "/commissions",
    moduleId: "COMMISSIONS",
  },
  TRANSACTION_TYPE: {
    id: "transaction-type",
    label: "Type transaction",
    icon: "arrow-left-right",
    href: "/transaction-type",
    moduleId: "TRANSACTION_TYPE",
  },

  // Optionnels
  AUTOMATIONS: {
    id: "automations",
    label: "Automatisations",
    icon: "zap",
    href: "/automations",
    moduleId: "AUTOMATIONS",
  },
  AI_AGENT: {
    id: "ai-agent",
    label: "Assistant IA",
    icon: "sparkles",
    href: "/ai",
    moduleId: "AI_AGENT",
  },
  GEOMAP: {
    id: "geomap",
    label: "Carte",
    icon: "map",
    href: "/map",
    moduleId: "GEOMAP",
  },
  CADASTRE: {
    id: "cadastre",
    label: "Cadastre",
    icon: "map-pin",
    href: "/cadastre",
    moduleId: "CADASTRE",
  },
  PORTAL: {
    id: "portal",
    label: "Portail client",
    icon: "globe",
    href: "/portal-manager",
    moduleId: "PORTAL",
  },
  PERFORMANCE: {
    id: "performance",
    label: "Performance",
    icon: "trending-up",
    href: "/performance",
    moduleId: "PERFORMANCE",
  },
  DOCUMENTS: {
    id: "documents",
    label: "Documents",
    icon: "file-text",
    href: "/documents",
    moduleId: "DOCUMENTS",
  },
  OBJECTIVES: {
    id: "objectives",
    label: "Objectifs",
    icon: "target",
    href: "/objectives",
    moduleId: "OBJECTIVES",
  },

  // Admin
  SETTINGS: {
    id: "settings",
    label: "Parametres",
    icon: "settings",
    href: "/settings",
    moduleId: "SETTINGS",
  },
  AUDIT_LOG: {
    id: "audit-log",
    label: "Journal",
    icon: "scroll-text",
    href: "/audit-log",
    moduleId: "AUDIT_LOG",
  },
};

// ============================================================================
// Groupement des sections
// ============================================================================

const SECTION_ORDER: { title: string; modules: ModuleId[] }[] = [
  {
    title: "Principal",
    modules: ["DASHBOARD", "PIPELINE", "CLIENTS", "PLANNING"],
  },
  {
    title: "Promotion",
    modules: [
      "PROJECTS",
      "CONSTRUCTION_PROGRESS",
      "PAYMENT_SCHEDULE",
    ],
  },
  {
    title: "Agence",
    modules: [
      "PORTFOLIO",
      "OWNERS",
      "MANDATES",
      "COMMISSIONS",
      "TRANSACTION_TYPE",
    ],
  },
  {
    title: "Outils",
    modules: [
      "AUTOMATIONS",
      "AI_AGENT",
      "GEOMAP",
      "CADASTRE",
      "DOCUMENTS",
      "OBJECTIVES",
      "PERFORMANCE",
      "PORTAL",
    ],
  },
  {
    title: "Administration",
    modules: ["NOTIFICATIONS", "SETTINGS", "AUDIT_LOG"],
  },
];

// ============================================================================
// API publique
// ============================================================================

/**
 * Génère la navigation sidebar filtrée par type de workspace, plan et rôle.
 * Seuls les modules accessibles apparaissent.
 */
/**
 * Retourne le href d'un module depuis NAV_ITEMS.
 */
export function getModuleHref(moduleId: ModuleId): string {
  return NAV_ITEMS[moduleId]?.href ?? "/dashboard";
}

export function getNavigation(
  workspaceType: WorkspaceType,
  plan: PlanType,
  role: UserRole,
): INavSection[] {
  const availableModules = getAvailableModules(workspaceType, plan);

  const sections: INavSection[] = [];

  for (const section of SECTION_ORDER) {
    const items: INavItem[] = [];

    for (const moduleId of section.modules) {
      // Le module doit être disponible pour ce workspace + plan
      if (!availableModules.includes(moduleId)) continue;

      // Le rôle doit avoir accès
      if (!canAccessModule(moduleId, role, workspaceType, plan)) continue;

      const navItem = NAV_ITEMS[moduleId];
      if (navItem) {
        items.push(navItem);
      }
    }

    // N'ajouter la section que si elle a des items
    if (items.length > 0) {
      sections.push({ title: section.title, items });
    }
  }

  return sections;
}
