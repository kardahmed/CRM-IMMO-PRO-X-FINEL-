import { describe, it, expect } from "vitest";
import {
  getAvailableModules,
  hasModule,
  canAccessModule,
} from "@/lib/modules";
import { getNavigation } from "@/lib/navigation";

// ============================================================================
// Tests : Modules par workspace type
// ============================================================================

describe("Modules par workspace type", () => {
  it("PROMOTION a accès à PROJECTS mais pas OWNERS", () => {
    expect(hasModule("PROJECTS", "PROMOTION", "STARTER")).toBe(true);
    expect(hasModule("CONSTRUCTION_PROGRESS", "PROMOTION", "STARTER")).toBe(true);
    expect(hasModule("AVAILABILITY_GRID", "PROMOTION", "STARTER")).toBe(true);
    expect(hasModule("OWNERS", "PROMOTION", "STARTER")).toBe(false);
    expect(hasModule("MANDATES", "PROMOTION", "STARTER")).toBe(false);
    expect(hasModule("COMMISSIONS", "PROMOTION", "STARTER")).toBe(false);
  });

  it("AGENCY a accès à OWNERS et MANDATES mais pas PROJECTS", () => {
    expect(hasModule("OWNERS", "AGENCY", "STARTER")).toBe(true);
    expect(hasModule("MANDATES", "AGENCY", "STARTER")).toBe(true);
    expect(hasModule("COMMISSIONS", "AGENCY", "STARTER")).toBe(true);
    expect(hasModule("PROJECTS", "AGENCY", "STARTER")).toBe(false);
    expect(hasModule("CONSTRUCTION_PROGRESS", "AGENCY", "STARTER")).toBe(false);
    expect(hasModule("AVAILABILITY_GRID", "AGENCY", "STARTER")).toBe(false);
  });

  it("les modules communs sont accessibles aux deux types", () => {
    const commonModules = [
      "PIPELINE",
      "CLIENTS",
      "PLANNING",
      "DASHBOARD",
      "NOTIFICATIONS",
      "SETTINGS",
      "AUDIT_LOG",
    ] as const;

    for (const mod of commonModules) {
      expect(hasModule(mod, "PROMOTION", "STARTER")).toBe(true);
      expect(hasModule(mod, "AGENCY", "STARTER")).toBe(true);
    }
  });
});

// ============================================================================
// Tests : Modules par plan
// ============================================================================

describe("Modules par plan", () => {
  it("STARTER n'a pas accès aux modules optionnels", () => {
    expect(hasModule("AUTOMATIONS", "PROMOTION", "STARTER")).toBe(false);
    expect(hasModule("AI_AGENT", "PROMOTION", "STARTER")).toBe(false);
    expect(hasModule("GEOMAP", "PROMOTION", "STARTER")).toBe(false);
    expect(hasModule("CADASTRE", "PROMOTION", "STARTER")).toBe(false);
    expect(hasModule("PORTAL", "PROMOTION", "STARTER")).toBe(false);
  });

  it("PRO a accès à AUTOMATIONS, GEOMAP, DOCUMENTS, OBJECTIVES", () => {
    expect(hasModule("AUTOMATIONS", "PROMOTION", "PRO")).toBe(true);
    expect(hasModule("GEOMAP", "PROMOTION", "PRO")).toBe(true);
    expect(hasModule("DOCUMENTS", "PROMOTION", "PRO")).toBe(true);
    expect(hasModule("OBJECTIVES", "PROMOTION", "PRO")).toBe(true);
    expect(hasModule("AI_AGENT", "PROMOTION", "PRO")).toBe(false);
    expect(hasModule("CADASTRE", "PROMOTION", "PRO")).toBe(false);
  });

  it("BUSINESS a accès à AI_AGENT et CADASTRE", () => {
    expect(hasModule("AI_AGENT", "AGENCY", "BUSINESS")).toBe(true);
    expect(hasModule("CADASTRE", "AGENCY", "BUSINESS")).toBe(true);
    expect(hasModule("PERFORMANCE", "AGENCY", "BUSINESS")).toBe(true);
    expect(hasModule("PORTAL", "AGENCY", "BUSINESS")).toBe(false);
  });

  it("ENTERPRISE a accès à tout", () => {
    expect(hasModule("AI_AGENT", "PROMOTION", "ENTERPRISE")).toBe(true);
    expect(hasModule("CADASTRE", "PROMOTION", "ENTERPRISE")).toBe(true);
    expect(hasModule("PORTAL", "PROMOTION", "ENTERPRISE")).toBe(true);
    expect(hasModule("PERFORMANCE", "PROMOTION", "ENTERPRISE")).toBe(true);
  });
});

// ============================================================================
// Tests : Accès par rôle
// ============================================================================

describe("Accès module par rôle", () => {
  it("AGENT ne peut pas accéder à SETTINGS", () => {
    expect(canAccessModule("SETTINGS", "AGENT", "PROMOTION", "STARTER")).toBe(
      false,
    );
  });

  it("CEO peut accéder à SETTINGS", () => {
    expect(canAccessModule("SETTINGS", "CEO", "PROMOTION", "STARTER")).toBe(
      true,
    );
  });

  it("ASSISTANT ne peut pas accéder à PERFORMANCE", () => {
    expect(
      canAccessModule("PERFORMANCE", "ASSISTANT", "AGENCY", "BUSINESS"),
    ).toBe(false);
  });

  it("SUPERVISOR peut accéder à PERFORMANCE", () => {
    expect(
      canAccessModule("PERFORMANCE", "SUPERVISOR", "AGENCY", "BUSINESS"),
    ).toBe(true);
  });

  it("module inexistant pour le workspace retourne false", () => {
    expect(canAccessModule("PROJECTS", "CEO", "AGENCY", "ENTERPRISE")).toBe(
      false,
    );
  });
});

// ============================================================================
// Tests : Navigation sidebar
// ============================================================================

describe("Navigation sidebar", () => {
  it("PROMOTION CEO STARTER voit Programmes mais pas Mandats", () => {
    const nav = getNavigation("PROMOTION", "STARTER", "CEO");
    const allIds = nav.flatMap((s) => s.items.map((i) => i.id));

    expect(allIds).toContain("projects");
    expect(allIds).not.toContain("mandates");
    expect(allIds).not.toContain("owners");
    expect(allIds).toContain("dashboard");
    expect(allIds).toContain("pipeline");
  });

  it("AGENCY CEO STARTER voit Mandats et Propriétaires mais pas Programmes", () => {
    const nav = getNavigation("AGENCY", "STARTER", "CEO");
    const allIds = nav.flatMap((s) => s.items.map((i) => i.id));

    expect(allIds).toContain("mandates");
    expect(allIds).toContain("owners");
    expect(allIds).not.toContain("projects");
  });

  it("AGENT STARTER ne voit pas Settings ni Audit Log", () => {
    const nav = getNavigation("PROMOTION", "STARTER", "AGENT");
    const allIds = nav.flatMap((s) => s.items.map((i) => i.id));

    expect(allIds).not.toContain("settings");
    expect(allIds).not.toContain("audit-log");
  });

  it("PROMOTION PRO CEO voit Automatisations", () => {
    const nav = getNavigation("PROMOTION", "PRO", "CEO");
    const allIds = nav.flatMap((s) => s.items.map((i) => i.id));

    expect(allIds).toContain("automations");
  });

  it("PROMOTION STARTER CEO ne voit PAS Automatisations", () => {
    const nav = getNavigation("PROMOTION", "STARTER", "CEO");
    const allIds = nav.flatMap((s) => s.items.map((i) => i.id));

    expect(allIds).not.toContain("automations");
  });

  it("les sections vides ne sont pas incluses", () => {
    const nav = getNavigation("PROMOTION", "STARTER", "CEO");
    const sectionTitles = nav.map((s) => s.title);

    // Pas de section "Agence" pour un workspace PROMOTION
    expect(sectionTitles).not.toContain("Agence");
    // Pas de section "Outils" pour STARTER (pas de modules optionnels)
    expect(sectionTitles).not.toContain("Outils");
  });
});
