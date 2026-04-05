import { describe, it, expect, vi, beforeEach } from "vitest";

// ============================================================================
// Mocks (vi.hoisted)
// ============================================================================

const {
  mockGetCurrentUser,
  mockClientFindFirst,
  mockClientFindMany,
  mockClientCount,
  mockClientCreate,
  mockClientUpdate,
  mockTaskFindFirst,
  mockTaskFindMany,
  mockTaskCount,
  mockVisitFindMany,
  mockVisitCount,
  mockPaymentFindMany,
  mockPaymentCount,
  mockUserFindMany,
  mockUserFindFirst,
  mockPropertyFindFirst,
  mockPropertyUpdate,
  mockActivityLogCreate,
  mockNotificationCreate,
  mockNotificationCreateMany,
  mockNotificationFindMany,
  mockNotificationCount,
  mockNotificationUpdateMany,
  mockAutomationConfigFindFirst,
  mockAutomationConfigFindMany,
} = vi.hoisted(() => ({
  mockGetCurrentUser: vi.fn(),
  mockClientFindFirst: vi.fn(),
  mockClientFindMany: vi.fn().mockResolvedValue([]),
  mockClientCount: vi.fn().mockResolvedValue(0),
  mockClientCreate: vi.fn(),
  mockClientUpdate: vi.fn(),
  mockTaskFindFirst: vi.fn(),
  mockTaskFindMany: vi.fn().mockResolvedValue([]),
  mockTaskCount: vi.fn().mockResolvedValue(0),
  mockVisitFindMany: vi.fn().mockResolvedValue([]),
  mockVisitCount: vi.fn().mockResolvedValue(0),
  mockPaymentFindMany: vi.fn().mockResolvedValue([]),
  mockPaymentCount: vi.fn().mockResolvedValue(0),
  mockUserFindMany: vi.fn().mockResolvedValue([]),
  mockUserFindFirst: vi.fn(),
  mockPropertyFindFirst: vi.fn(),
  mockPropertyUpdate: vi.fn(),
  mockActivityLogCreate: vi.fn().mockResolvedValue({}),
  mockNotificationCreate: vi.fn().mockResolvedValue({ id: "notif-1" }),
  mockNotificationCreateMany: vi.fn().mockResolvedValue({ count: 0 }),
  mockNotificationFindMany: vi.fn().mockResolvedValue([]),
  mockNotificationCount: vi.fn().mockResolvedValue(0),
  mockNotificationUpdateMany: vi.fn().mockResolvedValue({ count: 0 }),
  mockAutomationConfigFindFirst: vi.fn(),
  mockAutomationConfigFindMany: vi.fn().mockResolvedValue([]),
}));

vi.mock("@/lib/auth", () => ({
  getCurrentUser: (...args: unknown[]) => mockGetCurrentUser(...args),
}));

vi.mock("@/lib/prisma-tenant", () => ({
  createTenantPrisma: vi.fn().mockImplementation(() => ({
    client: {
      findFirst: mockClientFindFirst,
      findMany: mockClientFindMany,
      count: mockClientCount,
      create: mockClientCreate,
      update: mockClientUpdate,
    },
    task: {
      findFirst: mockTaskFindFirst,
      findMany: mockTaskFindMany,
      count: mockTaskCount,
      create: vi.fn().mockResolvedValue({ id: "task-1" }),
      update: vi.fn().mockResolvedValue({}),
    },
    visit: {
      findMany: mockVisitFindMany,
      count: mockVisitCount,
    },
    payment: {
      findMany: mockPaymentFindMany,
      count: mockPaymentCount,
    },
    user: {
      findMany: mockUserFindMany,
      findFirst: mockUserFindFirst,
    },
    property: {
      findFirst: mockPropertyFindFirst,
      findMany: vi.fn().mockResolvedValue([]),
      count: vi.fn().mockResolvedValue(0),
      update: mockPropertyUpdate,
    },
    automationConfig: {
      findFirst: mockAutomationConfigFindFirst,
      findMany: mockAutomationConfigFindMany,
    },
    notification: {
      findMany: mockNotificationFindMany,
      count: mockNotificationCount,
      updateMany: mockNotificationUpdateMany,
    },
  })),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    client: { findFirst: mockClientFindFirst },
    task: { createMany: vi.fn().mockResolvedValue({ count: 0 }), findMany: vi.fn().mockResolvedValue([]), updateMany: vi.fn().mockResolvedValue({ count: 0 }), update: vi.fn() },
    activityLog: { create: mockActivityLogCreate, findFirst: vi.fn().mockResolvedValue(null) },
    notification: { create: mockNotificationCreate, createMany: mockNotificationCreateMany },
    user: { findMany: mockUserFindMany, findFirst: mockUserFindFirst },
    tenant: { findUnique: vi.fn().mockResolvedValue({ id: "t1", plan: "BUSINESS" }) },
    $extends: vi.fn(),
  },
}));

vi.mock("@clerk/nextjs/server", () => ({
  auth: vi.fn(),
  currentUser: vi.fn(),
}));

vi.mock("@/services/notification.service", () => ({
  createNotification: (...args: unknown[]) => mockNotificationCreate(...args),
  createNotificationBulk: vi.fn().mockResolvedValue(0),
  getUserNotifications: mockNotificationFindMany,
  getUnreadCount: mockNotificationCount,
  markAsRead: mockNotificationUpdateMany,
  markAllAsRead: mockNotificationUpdateMany,
}));

// ============================================================================
// Imports (AFTER mocks)
// ============================================================================

import { NextRequest } from "next/server";
import { hasPermission, getAllowedActions } from "@/lib/permissions-matrix";
import { hasModule, canAccessModule } from "@/lib/modules";
import type { ICurrentUser } from "@/lib/auth";

// ============================================================================
// Helpers
// ============================================================================

function makeUser(overrides: Partial<ICurrentUser> & { role: ICurrentUser["role"] }): ICurrentUser {
  return {
    userId: "user-001",
    tenantId: "tenant-001",
    clerkId: "clerk-001",
    firstName: "Test",
    lastName: "User",
    email: "test@test.com",
    ...overrides,
  };
}

function makeRequest(
  method: string,
  url: string,
  body?: Record<string, unknown>,
): NextRequest {
  const init: RequestInit = { method };
  if (body) {
    init.body = JSON.stringify(body);
    init.headers = { "Content-Type": "application/json" };
  }
  return new NextRequest(new URL(url, "http://localhost:3000"), init as ConstructorParameters<typeof NextRequest>[1]);
}

// ============================================================================
// 2. TESTS PERMISSIONS
// ============================================================================

describe("Permissions — Matrice de roles", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // -----------------------------------------------------------------------
  // Agent ne peut pas DELETE client
  // -----------------------------------------------------------------------
  describe("AGENT restrictions", () => {
    it("Agent ne peut pas DELETE client", () => {
      expect(hasPermission("AGENT", "CLIENTS", "DELETE")).toBe(false);
    });

    it("Agent ne peut pas ASSIGN client", () => {
      expect(hasPermission("AGENT", "CLIENTS", "ASSIGN")).toBe(false);
    });

    it("Agent ne peut pas READ_ALL clients (voit seulement les siens)", () => {
      expect(hasPermission("AGENT", "CLIENTS", "READ_ALL")).toBe(false);
    });

    it("Agent ne peut pas EXPORT", () => {
      expect(hasPermission("AGENT", "CLIENTS", "EXPORT")).toBe(false);
    });

    it("Agent ne peut pas acceder aux SETTINGS", () => {
      expect(hasPermission("AGENT", "SETTINGS", "READ")).toBe(false);
      expect(hasPermission("AGENT", "SETTINGS", "UPDATE")).toBe(false);
    });

    it("Agent ne peut pas acceder a l'AUDIT_LOG", () => {
      expect(hasPermission("AGENT", "AUDIT_LOG", "READ")).toBe(false);
    });

    it("Agent peut CREATE et READ ses propres clients", () => {
      expect(hasPermission("AGENT", "CLIENTS", "CREATE")).toBe(true);
      expect(hasPermission("AGENT", "CLIENTS", "READ")).toBe(true);
      expect(hasPermission("AGENT", "CLIENTS", "UPDATE")).toBe(true);
    });

    it("Agent peut CREATE et READ ses taches (PLANNING)", () => {
      expect(hasPermission("AGENT", "PLANNING", "CREATE")).toBe(true);
      expect(hasPermission("AGENT", "PLANNING", "READ")).toBe(true);
      expect(hasPermission("AGENT", "PLANNING", "UPDATE")).toBe(true);
    });

    it("Agent ne voit pas les taches de tous (READ_ALL = false sur PLANNING)", () => {
      expect(hasPermission("AGENT", "PLANNING", "READ_ALL")).toBe(false);
    });

    it("getAllowedActions AGENT sur CLIENTS = CREATE, READ, UPDATE", () => {
      const actions = getAllowedActions("AGENT", "CLIENTS");
      expect(actions).toContain("CREATE");
      expect(actions).toContain("READ");
      expect(actions).toContain("UPDATE");
      expect(actions).not.toContain("DELETE");
      expect(actions).not.toContain("ASSIGN");
      expect(actions).not.toContain("EXPORT");
      expect(actions).not.toContain("READ_ALL");
    });
  });

  // -----------------------------------------------------------------------
  // Agent ne peut pas voir clients d'un autre agent
  // -----------------------------------------------------------------------
  describe("AGENT — isolation des clients entre agents", () => {
    it("Agent ne peut voir que ses propres clients dans la matrice", () => {
      // READ_ALL = false pour AGENT sur CLIENTS
      expect(hasPermission("AGENT", "CLIENTS", "READ_ALL")).toBe(false);
    });

    it("API clients/[id] retourne 403 si client assigne a un autre agent", async () => {
      const agentUser = makeUser({ userId: "agent-001", role: "AGENT" });
      mockGetCurrentUser.mockResolvedValue(agentUser);
      mockClientFindFirst.mockResolvedValue({
        id: "client-1",
        assignedAgentId: "agent-999", // autre agent
        firstName: "Test",
        lastName: "Client",
      });

      const { GET } = await import("@/app/api/v1/clients/[id]/route");
      const req = makeRequest("GET", "http://localhost:3000/api/v1/clients/client-1");
      const res = await GET(req, { params: Promise.resolve({ id: "client-1" }) });
      const body = await res.json();

      expect(res.status).toBe(403);
      expect(body.error).toContain("refusé");
    });

    it("API clients/[id] retourne 200 si client assigne a l'agent lui-meme", async () => {
      const agentUser = makeUser({ userId: "agent-001", role: "AGENT" });
      mockGetCurrentUser.mockResolvedValue(agentUser);
      mockClientFindFirst.mockResolvedValue({
        id: "client-1",
        assignedAgentId: "agent-001", // meme agent
        firstName: "Test",
        lastName: "Client",
        interactions: [],
        visits: [],
        tasks: [],
        assignedAgent: null,
      });

      const { GET } = await import("@/app/api/v1/clients/[id]/route");
      const req = makeRequest("GET", "http://localhost:3000/api/v1/clients/client-1");
      const res = await GET(req, { params: Promise.resolve({ id: "client-1" }) });

      expect(res.status).toBe(200);
    });
  });

  // -----------------------------------------------------------------------
  // Supervisor peut tout voir dans son tenant
  // -----------------------------------------------------------------------
  describe("SUPERVISOR permissions", () => {
    it("Supervisor peut READ_ALL clients", () => {
      expect(hasPermission("SUPERVISOR", "CLIENTS", "READ_ALL")).toBe(true);
    });

    it("Supervisor peut ASSIGN des clients", () => {
      expect(hasPermission("SUPERVISOR", "CLIENTS", "ASSIGN")).toBe(true);
    });

    it("Supervisor peut CREATE, READ, UPDATE clients", () => {
      expect(hasPermission("SUPERVISOR", "CLIENTS", "CREATE")).toBe(true);
      expect(hasPermission("SUPERVISOR", "CLIENTS", "READ")).toBe(true);
      expect(hasPermission("SUPERVISOR", "CLIENTS", "UPDATE")).toBe(true);
    });

    it("Supervisor ne peut PAS DELETE", () => {
      expect(hasPermission("SUPERVISOR", "CLIENTS", "DELETE")).toBe(false);
    });

    it("Supervisor peut EXPORT", () => {
      expect(hasPermission("SUPERVISOR", "CLIENTS", "EXPORT")).toBe(true);
    });

    it("Supervisor peut lire SETTINGS mais pas modifier", () => {
      expect(hasPermission("SUPERVISOR", "SETTINGS", "READ")).toBe(true);
      expect(hasPermission("SUPERVISOR", "SETTINGS", "UPDATE")).toBe(false);
      expect(hasPermission("SUPERVISOR", "SETTINGS", "CREATE")).toBe(false);
    });

    it("Supervisor peut lire AUTOMATIONS mais pas creer", () => {
      expect(hasPermission("SUPERVISOR", "AUTOMATIONS", "READ")).toBe(true);
      expect(hasPermission("SUPERVISOR", "AUTOMATIONS", "CREATE")).toBe(false);
      expect(hasPermission("SUPERVISOR", "AUTOMATIONS", "UPDATE")).toBe(false);
    });
  });

  // -----------------------------------------------------------------------
  // CEO peut tout faire dans son tenant
  // -----------------------------------------------------------------------
  describe("CEO permissions", () => {
    const ALL_ACTIONS = ["CREATE", "READ", "READ_ALL", "UPDATE", "DELETE", "ASSIGN", "EXPORT"] as const;
    const MODULES = ["CLIENTS", "PLANNING", "SETTINGS", "AUDIT_LOG", "NOTIFICATIONS"] as const;

    for (const mod of MODULES) {
      for (const action of ALL_ACTIONS) {
        it(`CEO peut ${action} sur ${mod}`, () => {
          expect(hasPermission("CEO", mod, action)).toBe(true);
        });
      }
    }
  });

  // -----------------------------------------------------------------------
  // ASSISTANT restrictions
  // -----------------------------------------------------------------------
  describe("ASSISTANT permissions", () => {
    it("Assistant peut READ et READ_ALL clients (lecture seule)", () => {
      expect(hasPermission("ASSISTANT", "CLIENTS", "READ")).toBe(true);
      expect(hasPermission("ASSISTANT", "CLIENTS", "READ_ALL")).toBe(true);
    });

    it("Assistant ne peut PAS CREATE, UPDATE, DELETE, ASSIGN clients", () => {
      expect(hasPermission("ASSISTANT", "CLIENTS", "CREATE")).toBe(false);
      expect(hasPermission("ASSISTANT", "CLIENTS", "UPDATE")).toBe(false);
      expect(hasPermission("ASSISTANT", "CLIENTS", "DELETE")).toBe(false);
      expect(hasPermission("ASSISTANT", "CLIENTS", "ASSIGN")).toBe(false);
    });

    it("Assistant ne peut pas modifier les objectifs (UPDATE sur module generique)", () => {
      // Assistant defaults: UPDATE = false
      expect(hasPermission("ASSISTANT", "OBJECTIVES", "UPDATE")).toBe(false);
      expect(hasPermission("ASSISTANT", "OBJECTIVES", "CREATE")).toBe(false);
    });

    it("Assistant ne peut pas acceder aux SETTINGS", () => {
      expect(hasPermission("ASSISTANT", "SETTINGS", "READ")).toBe(false);
      expect(hasPermission("ASSISTANT", "SETTINGS", "UPDATE")).toBe(false);
    });
  });

  // -----------------------------------------------------------------------
  // Module PROJECTS inaccessible pour type AGENCY
  // -----------------------------------------------------------------------
  describe("Modules par workspace type", () => {
    it("AGENCY n'a PAS acces au module PROJECTS", () => {
      expect(hasModule("PROJECTS", "AGENCY", "STARTER")).toBe(false);
      expect(hasModule("PROJECTS", "AGENCY", "PRO")).toBe(false);
      expect(hasModule("PROJECTS", "AGENCY", "BUSINESS")).toBe(false);
    });

    it("PROMOTION a acces au module PROJECTS", () => {
      expect(hasModule("PROJECTS", "PROMOTION", "STARTER")).toBe(true);
      expect(hasModule("PROJECTS", "PROMOTION", "PRO")).toBe(true);
    });

    it("AGENCY a acces a PORTFOLIO, OWNERS, MANDATES", () => {
      expect(hasModule("PORTFOLIO", "AGENCY", "STARTER")).toBe(true);
      expect(hasModule("OWNERS", "AGENCY", "STARTER")).toBe(true);
      expect(hasModule("MANDATES", "AGENCY", "STARTER")).toBe(true);
    });

    it("PROMOTION n'a PAS acces a OWNERS et MANDATES", () => {
      expect(hasModule("OWNERS", "PROMOTION", "STARTER")).toBe(false);
      expect(hasModule("MANDATES", "PROMOTION", "STARTER")).toBe(false);
    });

    it("les modules communs sont accessibles aux deux types", () => {
      for (const type of ["PROMOTION", "AGENCY"] as const) {
        expect(hasModule("PIPELINE", type, "STARTER")).toBe(true);
        expect(hasModule("CLIENTS", type, "STARTER")).toBe(true);
        expect(hasModule("PLANNING", type, "STARTER")).toBe(true);
        expect(hasModule("DASHBOARD", type, "STARTER")).toBe(true);
      }
    });
  });

  // -----------------------------------------------------------------------
  // canAccessModule (role + workspace + plan)
  // -----------------------------------------------------------------------
  describe("canAccessModule integre role + workspace + plan", () => {
    it("AGENT AGENCY STARTER peut acceder a CLIENTS", () => {
      expect(canAccessModule("CLIENTS", "AGENT", "AGENCY", "STARTER")).toBe(true);
    });

    it("AGENT AGENCY STARTER ne peut PAS acceder a SETTINGS", () => {
      expect(canAccessModule("SETTINGS", "AGENT", "AGENCY", "STARTER")).toBe(false);
    });

    it("CEO PROMOTION PRO peut acceder a AUTOMATIONS", () => {
      expect(canAccessModule("AUTOMATIONS", "CEO", "PROMOTION", "PRO")).toBe(true);
    });

    it("AGENT PROMOTION STARTER ne peut PAS acceder a AUTOMATIONS", () => {
      // AUTOMATIONS n'est pas dispo en STARTER
      expect(canAccessModule("AUTOMATIONS", "AGENT", "PROMOTION", "STARTER")).toBe(false);
    });

    it("CEO PROMOTION BUSINESS peut acceder a AI_AGENT", () => {
      expect(canAccessModule("AI_AGENT", "CEO", "PROMOTION", "BUSINESS")).toBe(true);
    });

    it("AGENT AGENCY STARTER ne peut PAS acceder a AI_AGENT", () => {
      expect(canAccessModule("AI_AGENT", "AGENT", "AGENCY", "STARTER")).toBe(false);
    });
  });

  // -----------------------------------------------------------------------
  // API apiHandler bloque les permissions
  // -----------------------------------------------------------------------
  describe("apiHandler bloque les acces non autorises", () => {
    it("retourne 401 si non authentifie", async () => {
      mockGetCurrentUser.mockRejectedValue(new Error("Non authentifié"));

      const { GET } = await import("@/app/api/v1/clients/route");
      const req = makeRequest("GET", "http://localhost:3000/api/v1/clients");
      const res = await GET(req);
      const body = await res.json();

      expect(res.status).toBe(401);
      expect(body.error).toContain("authentifié");
    });

    it("retourne 403 si pas de tenantId", async () => {
      mockGetCurrentUser.mockResolvedValue(
        makeUser({ tenantId: "", role: "CEO" }),
      );

      const { GET } = await import("@/app/api/v1/clients/route");
      const req = makeRequest("GET", "http://localhost:3000/api/v1/clients");
      const res = await GET(req);

      // tenantId empty = falsy → 403
      expect(res.status).toBe(403);
    });

    it("Agent ne peut pas POST /clients/[id]/reassign (ASSIGN bloque)", async () => {
      mockGetCurrentUser.mockResolvedValue(
        makeUser({ role: "AGENT", userId: "agent-001" }),
      );

      const { POST } = await import("@/app/api/v1/clients/[id]/reassign/route");
      const req = makeRequest(
        "POST",
        "http://localhost:3000/api/v1/clients/c1/reassign",
        { agentId: "agent-002" },
      );
      const res = await POST(req, { params: Promise.resolve({ id: "c1" }) });

      expect(res.status).toBe(403);
    });

    it("Agent ne peut pas GET /leads/unassigned (READ_ALL bloque)", async () => {
      mockGetCurrentUser.mockResolvedValue(
        makeUser({ role: "AGENT", userId: "agent-001" }),
      );

      const { GET } = await import("@/app/api/v1/leads/unassigned/route");
      const req = makeRequest("GET", "http://localhost:3000/api/v1/leads/unassigned");
      const res = await GET(req);

      expect(res.status).toBe(403);
    });

    it("Supervisor PEUT GET /leads/unassigned", async () => {
      mockGetCurrentUser.mockResolvedValue(
        makeUser({ role: "SUPERVISOR", userId: "sup-001" }),
      );
      mockClientFindMany.mockResolvedValue([]);
      mockClientCount.mockResolvedValue(0);

      const { GET } = await import("@/app/api/v1/leads/unassigned/route");
      const req = makeRequest("GET", "http://localhost:3000/api/v1/leads/unassigned");
      const res = await GET(req);

      expect(res.status).toBe(200);
    });
  });

  // -----------------------------------------------------------------------
  // Reassign — seuls CEO/ADMIN/SUPERVISOR
  // -----------------------------------------------------------------------
  describe("reassignClient — verification role", () => {
    it("AGENT ne peut pas reassigner", async () => {
      const { reassignClient } = await import("@/services/client.service");
      const agentUser = makeUser({ role: "AGENT", userId: "agent-001" });

      await expect(
        reassignClient(agentUser, "client-1", "agent-2"),
      ).rejects.toThrow("seuls CEO, ADMIN et SUPERVISOR");
    });

    it("ASSISTANT ne peut pas reassigner", async () => {
      const { reassignClient } = await import("@/services/client.service");
      const assistantUser = makeUser({ role: "ASSISTANT", userId: "assistant-001" });

      await expect(
        reassignClient(assistantUser, "client-1", "agent-2"),
      ).rejects.toThrow("seuls CEO, ADMIN et SUPERVISOR");
    });

    it("SUPERVISOR peut reassigner (pas d'erreur de role)", async () => {
      const { reassignClient } = await import("@/services/client.service");
      const supUser = makeUser({ role: "SUPERVISOR", userId: "sup-001" });

      mockClientFindFirst.mockResolvedValue({
        id: "client-1",
        assignedAgentId: "agent-1",
        firstName: "Test",
        lastName: "Client",
      });
      mockUserFindFirst.mockResolvedValue({ id: "agent-2", isActive: true });
      mockClientUpdate.mockResolvedValue({
        id: "client-1",
        assignedAgentId: "agent-2",
        firstName: "Test",
        lastName: "Client",
      });

      const result = await reassignClient(supUser, "client-1", "agent-2");
      expect(result.newAgentId).toBe("agent-2");
    });

    it("CEO peut reassigner", async () => {
      const { reassignClient } = await import("@/services/client.service");
      const ceoUser = makeUser({ role: "CEO", userId: "ceo-001" });

      mockClientFindFirst.mockResolvedValue({
        id: "client-1",
        assignedAgentId: "agent-1",
        firstName: "Test",
        lastName: "Client",
      });
      mockUserFindFirst.mockResolvedValue({ id: "agent-2", isActive: true });
      mockClientUpdate.mockResolvedValue({
        id: "client-1",
        assignedAgentId: "agent-2",
        firstName: "Test",
        lastName: "Client",
      });

      const result = await reassignClient(ceoUser, "client-1", "agent-2");
      expect(result.newAgentId).toBe("agent-2");
    });
  });
});
