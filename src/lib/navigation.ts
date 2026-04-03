import type { WorkspaceType, PlanType, UserRole } from "@prisma/client";
import {
  type ModuleId,
  getAvailableModules,
  canAccessModule,
  MODULE_REGISTRY,
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
    href: "/dashboard/pipeline",
    moduleId: "PIPELINE",
  },
  CLIENTS: {
    id: "clients",
    label: "Clients",
    icon: "users",
    href: "/dashboard/clients",
    moduleId: "CLIENTS",
  },
  PLANNING: {
    id: "planning",
    label: "Planning",
    icon: "calendar",
    href: "/dashboard/planning",
    moduleId: "PLANNING",
  },
  NOTIFICATIONS: {
    id: "notifications",
    label: "Notifications",
    icon: "bell",
    href: "/dashboard/notifications",
    moduleId: "NOTIFICATIONS",
  },

  // PROMOTION
  PROJECTS: {
    id: "projects",
    label: "Programmes",
    icon: "building-2",
    href: "/dashboard/projects",
    moduleId: "PROJECTS",
  },
  CONSTRUCTION_PROGRESS: {
    id: "construction",
    label: "Avancement",
    icon: "hard-hat",
    href: "/dashboard/construction",
    moduleId: "CONSTRUCTION_PROGRESS",
  },
  AVAILABILITY_GRID: {
    id: "availability",
    label: "Disponibilité",
    icon: "grid-3x3",
    href: "/dashboard/availability",
    moduleId: "AVAILABILITY_GRID",
  },
  PAYMENT_SCHEDULE: {
    id: "payments",
    label: "Échéancier",
    icon: "banknote",
    href: "/dashboard/payments",
    moduleId: "PAYMENT_SCHEDULE",
  },

  // AGENCY
  PORTFOLIO: {
    id: "portfolio",
    label: "Portefeuille",
    icon: "home",
    href: "/dashboard/portfolio",
    moduleId: "PORTFOLIO",
  },
  OWNERS: {
    id: "owners",
    label: "Propriétaires",
    icon: "user-check",
    href: "/dashboard/owners",
    moduleId: "OWNERS",
  },
  MANDATES: {
    id: "mandates",
    label: "Mandats",
    icon: "file-signature",
    href: "/dashboard/mandates",
    moduleId: "MANDATES",
  },
  COMMISSIONS: {
    id: "commissions",
    label: "Commissions",
    icon: "percent",
    href: "/dashboard/commissions",
    moduleId: "COMMISSIONS",
  },
  TRANSACTION_TYPE: {
    id: "transaction-type",
    label: "Type transaction",
    icon: "arrow-left-right",
    href: "/dashboard/transaction-type",
    moduleId: "TRANSACTION_TYPE",
  },

  // Optionnels
  AUTOMATIONS: {
    id: "automations",
    label: "Automatisations",
    icon: "zap",
    href: "/dashboard/automations",
    moduleId: "AUTOMATIONS",
  },
  AI_AGENT: {
    id: "ai-agent",
    label: "Assistant IA",
    icon: "sparkles",
    href: "/dashboard/ai",
    moduleId: "AI_AGENT",
  },
  GEOMAP: {
    id: "geomap",
    label: "Carte",
    icon: "map",
    href: "/dashboard/map",
    moduleId: "GEOMAP",
  },
  CADASTRE: {
    id: "cadastre",
    label: "Cadastre",
    icon: "map-pin",
    href: "/dashboard/cadastre",
    moduleId: "CADASTRE",
  },
  PORTAL: {
    id: "portal",
    label: "Portail client",
    icon: "globe",
    href: "/dashboard/portal",
    moduleId: "PORTAL",
  },
  PERFORMANCE: {
    id: "performance",
    label: "Performance",
    icon: "trending-up",
    href: "/dashboard/performance",
    moduleId: "PERFORMANCE",
  },
  DOCUMENTS: {
    id: "documents",
    label: "Documents",
    icon: "file-text",
    href: "/dashboard/documents",
    moduleId: "DOCUMENTS",
  },
  OBJECTIVES: {
    id: "objectives",
    label: "Objectifs",
    icon: "target",
    href: "/dashboard/objectives",
    moduleId: "OBJECTIVES",
  },

  // Admin
  SETTINGS: {
    id: "settings",
    label: "Paramètres",
    icon: "settings",
    href: "/dashboard/settings",
    moduleId: "SETTINGS",
  },
  AUDIT_LOG: {
    id: "audit-log",
    label: "Journal",
    icon: "scroll-text",
    href: "/dashboard/audit-log",
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
      "AVAILABILITY_GRID",
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
