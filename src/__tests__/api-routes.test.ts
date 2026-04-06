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
  mockTaskCreate,
  mockTaskUpdate,
  mockVisitFindMany,
  mockVisitCount,
  mockVisitCreate,
  mockPaymentFindMany,
  mockPaymentCount,
  mockPaymentCreate,
  mockPropertyFindFirst,
  mockPropertyFindMany,
  mockPropertyCount,
  mockPropertyCreate,
  mockPropertyUpdate,
  mockUserFindMany,
  mockUserFindFirst,
  mockNotificationFindMany,
  mockNotificationCount,
  mockNotificationUpdateMany,
  mockAutomationConfigFindFirst,
  mockAutomationConfigFindMany,
  mockAutomationConfigCreate,
  mockAutomationConfigUpdate,
  mockActivityLogCreate,
  mockNotificationServiceCreate,
  mockNotificationServiceBulk,
  mockNotificationServiceGet,
  mockNotificationServiceUnread,
  mockNotificationServiceMarkRead,
  mockNotificationServiceMarkAll,
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
  mockTaskCreate: vi.fn(),
  mockTaskUpdate: vi.fn(),
  mockVisitFindMany: vi.fn().mockResolvedValue([]),
  mockVisitCount: vi.fn().mockResolvedValue(0),
  mockVisitCreate: vi.fn(),
  mockPaymentFindMany: vi.fn().mockResolvedValue([]),
  mockPaymentCount: vi.fn().mockResolvedValue(0),
  mockPaymentCreate: vi.fn(),
  mockPropertyFindFirst: vi.fn(),
  mockPropertyFindMany: vi.fn().mockResolvedValue([]),
  mockPropertyCount: vi.fn().mockResolvedValue(0),
  mockPropertyCreate: vi.fn(),
  mockPropertyUpdate: vi.fn(),
  mockUserFindMany: vi.fn().mockResolvedValue([]),
  mockUserFindFirst: vi.fn(),
  mockNotificationFindMany: vi.fn().mockResolvedValue([]),
  mockNotificationCount: vi.fn().mockResolvedValue(0),
  mockNotificationUpdateMany: vi.fn().mockResolvedValue({ count: 0 }),
  mockAutomationConfigFindFirst: vi.fn(),
  mockAutomationConfigFindMany: vi.fn().mockResolvedValue([]),
  mockAutomationConfigCreate: vi.fn(),
  mockAutomationConfigUpdate: vi.fn(),
  mockActivityLogCreate: vi.fn().mockResolvedValue({}),
  mockNotificationServiceCreate: vi.fn().mockResolvedValue("notif-1"),
  mockNotificationServiceBulk: vi.fn().mockResolvedValue(0),
  mockNotificationServiceGet: vi.fn().mockResolvedValue([]),
  mockNotificationServiceUnread: vi.fn().mockResolvedValue(3),
  mockNotificationServiceMarkRead: vi.fn().mockResolvedValue(undefined),
  mockNotificationServiceMarkAll: vi.fn().mockResolvedValue(5),
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
      create: mockTaskCreate,
      update: mockTaskUpdate,
    },
    visit: {
      findMany: mockVisitFindMany,
      count: mockVisitCount,
      create: mockVisitCreate,
    },
    payment: {
      findMany: mockPaymentFindMany,
      count: mockPaymentCount,
      create: mockPaymentCreate,
    },
    property: {
      findFirst: mockPropertyFindFirst,
      findMany: mockPropertyFindMany,
      count: mockPropertyCount,
      create: mockPropertyCreate,
      update: mockPropertyUpdate,
    },
    user: {
      findMany: mockUserFindMany,
      findFirst: mockUserFindFirst,
    },
    notification: {
      findMany: mockNotificationFindMany,
      count: mockNotificationCount,
      updateMany: mockNotificationUpdateMany,
    },
    automationConfig: {
      findFirst: mockAutomationConfigFindFirst,
      findMany: mockAutomationConfigFindMany,
      create: mockAutomationConfigCreate,
      update: mockAutomationConfigUpdate,
    },
  })),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    client: { findFirst: mockClientFindFirst },
    task: {
      createMany: vi.fn().mockResolvedValue({ count: 0 }),
      findMany: vi.fn().mockResolvedValue([]),
      updateMany: vi.fn().mockResolvedValue({ count: 0 }),
      update: vi.fn(),
    },
    activityLog: {
      create: mockActivityLogCreate,
      findFirst: vi.fn().mockResolvedValue(null),
    },
    notification: {
      create: vi.fn().mockResolvedValue({ id: "n1" }),
      createMany: vi.fn().mockResolvedValue({ count: 0 }),
    },
    user: { findMany: mockUserFindMany },
    tenant: { findUnique: vi.fn().mockResolvedValue({ id: "t1", plan: "BUSINESS" }) },
    $extends: vi.fn(),
  },
}));

vi.mock("@/lib/auth", () => ({
  auth: vi.fn(),
  currentUser: vi.fn(),
}));

vi.mock("@/services/notification.service", () => ({
  createNotification: (...args: unknown[]) => mockNotificationServiceCreate(...args),
  createNotificationBulk: (...args: unknown[]) => mockNotificationServiceBulk(...args),
  getUserNotifications: (...args: unknown[]) => mockNotificationServiceGet(...args),
  getUnreadCount: (...args: unknown[]) => mockNotificationServiceUnread(...args),
  markAsRead: (...args: unknown[]) => mockNotificationServiceMarkRead(...args),
  markAllAsRead: (...args: unknown[]) => mockNotificationServiceMarkAll(...args),
}));

vi.mock("@/services/client-dedup", () => ({
  checkDuplicates: vi.fn().mockResolvedValue({ canCreate: true, duplicates: [] }),
  normalizePhone: vi.fn().mockImplementation((p: string) => p),
}));

vi.mock("@/services/automation-engine", () => ({
  triggerAutomations: vi.fn().mockResolvedValue(undefined),
  checkOverdueTasks: vi.fn().mockResolvedValue({ markedOverdue: 0, escalated: 0 }),
  checkUpcomingVisits: vi.fn().mockResolvedValue(0),
  checkOverduePayments: vi.fn().mockResolvedValue(0),
}));

// ============================================================================
// Imports (AFTER mocks)
// ============================================================================

import { NextRequest } from "next/server";
import type { ICurrentUser } from "@/lib/auth";

// ============================================================================
// Helpers
// ============================================================================

function makeUser(overrides: Partial<ICurrentUser> = {}): ICurrentUser {
  return {
    userId: "user-001",
    tenantId: "tenant-001",
    role: "CEO",
    supabaseId: "sb-001",
    firstName: "Test",
    lastName: "CEO",
    email: "ceo@test.com",
    isSuperAdmin: false,
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

async function extractJson(response: Response): Promise<Record<string, unknown>> {
  return response.json() as Promise<Record<string, unknown>>;
}

// ============================================================================
// 4. TESTS API ROUTES
// ============================================================================

describe("API Routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default: authenticated CEO
    mockGetCurrentUser.mockResolvedValue(makeUser());
  });

  // =========================================================================
  // GET /api/v1/clients
  // =========================================================================
  describe("GET /api/v1/clients", () => {
    it("retourne 200 avec pagination", async () => {
      mockClientFindMany.mockResolvedValue([
        { id: "c1", firstName: "A", lastName: "B", assignedAgent: null },
      ]);
      mockClientCount.mockResolvedValue(1);

      const { GET } = await import("@/app/api/v1/clients/route");
      const req = makeRequest("GET", "http://localhost:3000/api/v1/clients?page=1&limit=10");
      const res = await GET(req);
      const body = await extractJson(res);

      expect(res.status).toBe(200);
      expect(body.success).toBe(true);
      const data = body.data as Record<string, unknown>;
      expect(data.clients).toHaveLength(1);
      expect(data.pagination).toEqual(
        expect.objectContaining({ page: 1, limit: 10, total: 1, totalPages: 1 }),
      );
    });

    it("filtre par stage", async () => {
      mockClientFindMany.mockResolvedValue([]);
      mockClientCount.mockResolvedValue(0);

      const { GET } = await import("@/app/api/v1/clients/route");
      const req = makeRequest("GET", "http://localhost:3000/api/v1/clients?stage=NEW");
      await GET(req);

      expect(mockClientFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ pipelineStage: "NEW" }),
        }),
      );
    });

    it("filtre par search (nom, prenom, tel, email)", async () => {
      mockClientFindMany.mockResolvedValue([]);
      mockClientCount.mockResolvedValue(0);

      const { GET } = await import("@/app/api/v1/clients/route");
      const req = makeRequest("GET", "http://localhost:3000/api/v1/clients?search=Ahmed");
      await GET(req);

      expect(mockClientFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.arrayContaining([
              expect.objectContaining({ firstName: expect.objectContaining({ contains: "Ahmed" }) }),
            ]),
          }),
        }),
      );
    });

    it("Agent ne voit que ses propres clients", async () => {
      mockGetCurrentUser.mockResolvedValue(makeUser({ role: "AGENT", userId: "agent-001" }));
      mockClientFindMany.mockResolvedValue([]);
      mockClientCount.mockResolvedValue(0);

      const { GET } = await import("@/app/api/v1/clients/route");
      const req = makeRequest("GET", "http://localhost:3000/api/v1/clients");
      await GET(req);

      expect(mockClientFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ assignedAgentId: "agent-001" }),
        }),
      );
    });

    it("limite le max a 100 items par page", async () => {
      mockClientFindMany.mockResolvedValue([]);
      mockClientCount.mockResolvedValue(0);

      const { GET } = await import("@/app/api/v1/clients/route");
      const req = makeRequest("GET", "http://localhost:3000/api/v1/clients?limit=999");
      await GET(req);

      expect(mockClientFindMany).toHaveBeenCalledWith(
        expect.objectContaining({ take: 100 }),
      );
    });

    it("retourne 401 si non authentifie", async () => {
      mockGetCurrentUser.mockRejectedValue(new Error("Non authentifié"));

      const { GET } = await import("@/app/api/v1/clients/route");
      const req = makeRequest("GET", "http://localhost:3000/api/v1/clients");
      const res = await GET(req);

      expect(res.status).toBe(401);
    });
  });

  // =========================================================================
  // POST /api/v1/clients
  // =========================================================================
  describe("POST /api/v1/clients", () => {
    it("cree un client avec 201", async () => {
      const { createClient } = await import("@/services/client.service");
      const mockCreateClient = vi.mocked(createClient);

      const { POST } = await import("@/app/api/v1/clients/route");
      const req = makeRequest("POST", "http://localhost:3000/api/v1/clients", {
        firstName: "Ahmed",
        lastName: "Kard",
        phone: "+213555111111",
      });

      // Mock the underlying service to return success
      mockClientCreate.mockResolvedValue({
        id: "new-client",
        firstName: "Ahmed",
        lastName: "Kard",
      });
      mockUserFindMany.mockResolvedValue([]);

      const res = await POST(req);
      const body = await extractJson(res);

      expect(res.status).toBe(201);
      expect(body.success).toBe(true);
    });

    it("retourne 422 si validation Zod echoue (prenom manquant)", async () => {
      const { POST } = await import("@/app/api/v1/clients/route");
      const req = makeRequest("POST", "http://localhost:3000/api/v1/clients", {
        // firstName missing
        lastName: "Kard",
        phone: "+213555111111",
      });
      const res = await POST(req);

      expect(res.status).toBe(422);
    });

    it("retourne 422 si telephone trop court", async () => {
      const { POST } = await import("@/app/api/v1/clients/route");
      const req = makeRequest("POST", "http://localhost:3000/api/v1/clients", {
        firstName: "Test",
        lastName: "User",
        phone: "123", // trop court
      });
      const res = await POST(req);

      expect(res.status).toBe(422);
    });

    it("retourne 400 si body vide", async () => {
      const { POST } = await import("@/app/api/v1/clients/route");
      const req = new NextRequest("http://localhost:3000/api/v1/clients", {
        method: "POST",
        // No body
      });
      const res = await POST(req);

      expect(res.status).toBe(400);
    });
  });

  // =========================================================================
  // GET /api/v1/clients/[id]
  // =========================================================================
  describe("GET /api/v1/clients/[id]", () => {
    it("retourne 200 avec les details du client", async () => {
      mockClientFindFirst.mockResolvedValue({
        id: "c1",
        firstName: "Ahmed",
        lastName: "Kard",
        assignedAgentId: null,
        assignedAgent: null,
        interactions: [],
        visits: [],
        tasks: [],
      });

      const { GET } = await import("@/app/api/v1/clients/[id]/route");
      const req = makeRequest("GET", "http://localhost:3000/api/v1/clients/c1");
      const res = await GET(req, { params: Promise.resolve({ id: "c1" }) });
      const body = await extractJson(res);

      expect(res.status).toBe(200);
      expect((body.data as Record<string, unknown>).firstName).toBe("Ahmed");
    });

    it("retourne 404 si client introuvable", async () => {
      mockClientFindFirst.mockResolvedValue(null);

      const { GET } = await import("@/app/api/v1/clients/[id]/route");
      const req = makeRequest("GET", "http://localhost:3000/api/v1/clients/xxx");
      const res = await GET(req, { params: Promise.resolve({ id: "xxx" }) });

      expect(res.status).toBe(404);
    });

    it("Agent ne peut pas voir un client d'un autre agent (403)", async () => {
      mockGetCurrentUser.mockResolvedValue(makeUser({ role: "AGENT", userId: "agent-001" }));
      mockClientFindFirst.mockResolvedValue({
        id: "c1",
        assignedAgentId: "agent-999",
        firstName: "X",
        lastName: "Y",
      });

      const { GET } = await import("@/app/api/v1/clients/[id]/route");
      const req = makeRequest("GET", "http://localhost:3000/api/v1/clients/c1");
      const res = await GET(req, { params: Promise.resolve({ id: "c1" }) });

      expect(res.status).toBe(403);
    });
  });

  // =========================================================================
  // PATCH /api/v1/clients/[id]
  // =========================================================================
  describe("PATCH /api/v1/clients/[id]", () => {
    it("retourne 200 apres update", async () => {
      mockClientFindFirst.mockResolvedValue({
        id: "c1",
        assignedAgentId: "user-001",
      });
      mockClientUpdate.mockResolvedValue({
        id: "c1",
        firstName: "Updated",
        lastName: "Name",
      });

      const { PATCH } = await import("@/app/api/v1/clients/[id]/route");
      const req = makeRequest("PATCH", "http://localhost:3000/api/v1/clients/c1", {
        firstName: "Updated",
      });
      const res = await PATCH(req, { params: Promise.resolve({ id: "c1" }) });

      expect(res.status).toBe(200);
    });

    it("retourne 404 si client introuvable", async () => {
      mockClientFindFirst.mockResolvedValue(null);

      const { PATCH } = await import("@/app/api/v1/clients/[id]/route");
      const req = makeRequest("PATCH", "http://localhost:3000/api/v1/clients/xxx", {
        firstName: "Test",
      });
      const res = await PATCH(req, { params: Promise.resolve({ id: "xxx" }) });

      expect(res.status).toBe(404);
    });

    it("Agent ne peut pas modifier le client d'un autre agent (403)", async () => {
      mockGetCurrentUser.mockResolvedValue(makeUser({ role: "AGENT", userId: "agent-001" }));
      mockClientFindFirst.mockResolvedValue({
        id: "c1",
        assignedAgentId: "agent-999",
      });

      const { PATCH } = await import("@/app/api/v1/clients/[id]/route");
      const req = makeRequest("PATCH", "http://localhost:3000/api/v1/clients/c1", {
        firstName: "Hack",
      });
      const res = await PATCH(req, { params: Promise.resolve({ id: "c1" }) });

      expect(res.status).toBe(403);
    });
  });

  // =========================================================================
  // POST /api/v1/clients/[id]/change-stage
  // =========================================================================
  describe("POST /api/v1/clients/[id]/change-stage", () => {
    it("change l'etape et retourne 200", async () => {
      mockClientFindFirst.mockResolvedValue({
        id: "c1",
        pipelineStage: "NEW",
        assignedAgentId: "user-001",
        firstName: "Test",
        lastName: "Client",
      });
      mockClientUpdate.mockResolvedValue({
        id: "c1",
        pipelineStage: "CONTACTED",
        portalToken: null,
      });
      mockUserFindMany.mockResolvedValue([]);

      const { POST } = await import("@/app/api/v1/clients/[id]/change-stage/route");
      const req = makeRequest("POST", "http://localhost:3000/api/v1/clients/c1/change-stage", {
        stage: "CONTACTED",
      });
      const res = await POST(req, { params: Promise.resolve({ id: "c1" }) });

      expect(res.status).toBe(200);
    });

    it("retourne 422 si stage invalide", async () => {
      const { POST } = await import("@/app/api/v1/clients/[id]/change-stage/route");
      const req = makeRequest("POST", "http://localhost:3000/api/v1/clients/c1/change-stage", {
        stage: "INVALID_STAGE",
      });
      const res = await POST(req, { params: Promise.resolve({ id: "c1" }) });

      expect(res.status).toBe(422);
    });
  });

  // =========================================================================
  // GET /api/v1/tasks
  // =========================================================================
  describe("GET /api/v1/tasks", () => {
    it("retourne 200 avec pagination", async () => {
      mockTaskFindMany.mockResolvedValue([]);
      mockTaskCount.mockResolvedValue(0);

      const { GET } = await import("@/app/api/v1/tasks/route");
      const req = makeRequest("GET", "http://localhost:3000/api/v1/tasks");
      const res = await GET(req);
      const body = await extractJson(res);

      expect(res.status).toBe(200);
      expect(body.success).toBe(true);
      const data = body.data as Record<string, unknown>;
      expect(data.tasks).toBeDefined();
      expect(data.pagination).toBeDefined();
    });

    it("filtre par status", async () => {
      mockTaskFindMany.mockResolvedValue([]);
      mockTaskCount.mockResolvedValue(0);

      const { GET } = await import("@/app/api/v1/tasks/route");
      const req = makeRequest("GET", "http://localhost:3000/api/v1/tasks?status=PENDING");
      await GET(req);

      expect(mockTaskFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ status: "PENDING" }),
        }),
      );
    });

    it("filtre isOverdue=true", async () => {
      mockTaskFindMany.mockResolvedValue([]);
      mockTaskCount.mockResolvedValue(0);

      const { GET } = await import("@/app/api/v1/tasks/route");
      const req = makeRequest("GET", "http://localhost:3000/api/v1/tasks?isOverdue=true");
      await GET(req);

      expect(mockTaskFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            dueAt: expect.objectContaining({ lt: expect.any(Date) }),
          }),
        }),
      );
    });

    it("Agent ne voit que ses taches", async () => {
      mockGetCurrentUser.mockResolvedValue(makeUser({ role: "AGENT", userId: "agent-001" }));
      mockTaskFindMany.mockResolvedValue([]);
      mockTaskCount.mockResolvedValue(0);

      const { GET } = await import("@/app/api/v1/tasks/route");
      const req = makeRequest("GET", "http://localhost:3000/api/v1/tasks");
      await GET(req);

      expect(mockTaskFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ assignedToId: "agent-001" }),
        }),
      );
    });
  });

  // =========================================================================
  // POST /api/v1/tasks
  // =========================================================================
  describe("POST /api/v1/tasks", () => {
    it("cree une tache avec 201", async () => {
      mockTaskCreate.mockResolvedValue({ id: "task-1", title: "Appeler client" });

      const { POST } = await import("@/app/api/v1/tasks/route");
      const req = makeRequest("POST", "http://localhost:3000/api/v1/tasks", {
        title: "Appeler client",
        type: "CALL",
      });
      const res = await POST(req);

      expect(res.status).toBe(201);
    });

    it("retourne 422 si titre manquant", async () => {
      const { POST } = await import("@/app/api/v1/tasks/route");
      const req = makeRequest("POST", "http://localhost:3000/api/v1/tasks", {
        type: "CALL",
        // title missing
      });
      const res = await POST(req);

      expect(res.status).toBe(422);
    });
  });

  // =========================================================================
  // GET/PATCH/PUT /api/v1/tasks/[id]
  // =========================================================================
  describe("GET /api/v1/tasks/[id]", () => {
    it("retourne 200 avec details", async () => {
      mockTaskFindFirst.mockResolvedValue({
        id: "task-1",
        title: "Test",
        assignedToId: "user-001",
        client: null,
        assignedTo: null,
        property: null,
      });

      const { GET } = await import("@/app/api/v1/tasks/[id]/route");
      const req = makeRequest("GET", "http://localhost:3000/api/v1/tasks/task-1");
      const res = await GET(req, { params: Promise.resolve({ id: "task-1" }) });

      expect(res.status).toBe(200);
    });

    it("retourne 404 si tache introuvable", async () => {
      mockTaskFindFirst.mockResolvedValue(null);

      const { GET } = await import("@/app/api/v1/tasks/[id]/route");
      const req = makeRequest("GET", "http://localhost:3000/api/v1/tasks/xxx");
      const res = await GET(req, { params: Promise.resolve({ id: "xxx" }) });

      expect(res.status).toBe(404);
    });

    it("Agent ne peut pas voir tache d'un autre agent (403)", async () => {
      mockGetCurrentUser.mockResolvedValue(makeUser({ role: "AGENT", userId: "agent-001" }));
      mockTaskFindFirst.mockResolvedValue({
        id: "task-1",
        assignedToId: "agent-999",
      });

      const { GET } = await import("@/app/api/v1/tasks/[id]/route");
      const req = makeRequest("GET", "http://localhost:3000/api/v1/tasks/task-1");
      const res = await GET(req, { params: Promise.resolve({ id: "task-1" }) });

      expect(res.status).toBe(403);
    });
  });

  describe("PUT /api/v1/tasks/[id] — complete/postpone", () => {
    it("complete une tache", async () => {
      mockTaskFindFirst.mockResolvedValue({ id: "task-1", status: "PENDING" });
      mockTaskUpdate.mockResolvedValue({ id: "task-1", status: "COMPLETED" });

      const { PUT } = await import("@/app/api/v1/tasks/[id]/route");
      const req = makeRequest("PUT", "http://localhost:3000/api/v1/tasks/task-1", {
        action: "complete",
      });
      const res = await PUT(req, { params: Promise.resolve({ id: "task-1" }) });
      const body = await extractJson(res);

      expect(res.status).toBe(200);
      expect((body.data as Record<string, unknown>).status).toBe("COMPLETED");
    });

    it("retourne 400 pour action invalide", async () => {
      mockTaskFindFirst.mockResolvedValue({ id: "task-1" });

      const { PUT } = await import("@/app/api/v1/tasks/[id]/route");
      const req = makeRequest("PUT", "http://localhost:3000/api/v1/tasks/task-1", {
        action: "invalid",
      });
      const res = await PUT(req, { params: Promise.resolve({ id: "task-1" }) });

      expect(res.status).toBe(400);
    });
  });

  // =========================================================================
  // GET /api/v1/properties
  // =========================================================================
  describe("GET /api/v1/properties", () => {
    it("retourne 200 avec pagination", async () => {
      mockPropertyFindMany.mockResolvedValue([]);
      mockPropertyCount.mockResolvedValue(0);

      const { GET } = await import("@/app/api/v1/properties/route");
      const req = makeRequest("GET", "http://localhost:3000/api/v1/properties");
      const res = await GET(req);

      expect(res.status).toBe(200);
    });

    it("filtre par type et status", async () => {
      mockPropertyFindMany.mockResolvedValue([]);
      mockPropertyCount.mockResolvedValue(0);

      const { GET } = await import("@/app/api/v1/properties/route");
      const req = makeRequest("GET", "http://localhost:3000/api/v1/properties?type=APARTMENT&status=AVAILABLE");
      await GET(req);

      expect(mockPropertyFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            type: "APARTMENT",
            status: "AVAILABLE",
          }),
        }),
      );
    });

    it("filtre par prix min/max", async () => {
      mockPropertyFindMany.mockResolvedValue([]);
      mockPropertyCount.mockResolvedValue(0);

      const { GET } = await import("@/app/api/v1/properties/route");
      const req = makeRequest("GET", "http://localhost:3000/api/v1/properties?minPrice=1000000&maxPrice=5000000");
      await GET(req);

      expect(mockPropertyFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            price: { gte: 1000000, lte: 5000000 },
          }),
        }),
      );
    });
  });

  // =========================================================================
  // GET/PATCH /api/v1/properties/[id]
  // =========================================================================
  describe("GET /api/v1/properties/[id]", () => {
    it("retourne 200 avec details", async () => {
      mockPropertyFindFirst.mockResolvedValue({
        id: "prop-1",
        name: "F3 Les Pins",
        project: null,
        visits: [],
        payments: [],
        mandates: [],
      });

      const { GET } = await import("@/app/api/v1/properties/[id]/route");
      const req = makeRequest("GET", "http://localhost:3000/api/v1/properties/prop-1");
      const res = await GET(req, { params: Promise.resolve({ id: "prop-1" }) });

      expect(res.status).toBe(200);
    });

    it("retourne 404 si bien introuvable", async () => {
      mockPropertyFindFirst.mockResolvedValue(null);

      const { GET } = await import("@/app/api/v1/properties/[id]/route");
      const req = makeRequest("GET", "http://localhost:3000/api/v1/properties/xxx");
      const res = await GET(req, { params: Promise.resolve({ id: "xxx" }) });

      expect(res.status).toBe(404);
    });
  });

  describe("PATCH /api/v1/properties/[id]", () => {
    it("retourne 404 si bien introuvable", async () => {
      mockPropertyFindFirst.mockResolvedValue(null);

      const { PATCH } = await import("@/app/api/v1/properties/[id]/route");
      const req = makeRequest("PATCH", "http://localhost:3000/api/v1/properties/xxx", {
        name: "Updated",
      });
      const res = await PATCH(req, { params: Promise.resolve({ id: "xxx" }) });

      expect(res.status).toBe(404);
    });
  });

  // =========================================================================
  // GET /api/v1/visits
  // =========================================================================
  describe("GET /api/v1/visits", () => {
    it("retourne 200 avec pagination", async () => {
      mockVisitFindMany.mockResolvedValue([]);
      mockVisitCount.mockResolvedValue(0);

      const { GET } = await import("@/app/api/v1/visits/route");
      const req = makeRequest("GET", "http://localhost:3000/api/v1/visits");
      const res = await GET(req);

      expect(res.status).toBe(200);
    });

    it("Agent ne voit que ses visites", async () => {
      mockGetCurrentUser.mockResolvedValue(makeUser({ role: "AGENT", userId: "agent-001" }));
      mockVisitFindMany.mockResolvedValue([]);
      mockVisitCount.mockResolvedValue(0);

      const { GET } = await import("@/app/api/v1/visits/route");
      const req = makeRequest("GET", "http://localhost:3000/api/v1/visits");
      await GET(req);

      expect(mockVisitFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ agentId: "agent-001" }),
        }),
      );
    });
  });

  // =========================================================================
  // GET /api/v1/payments
  // =========================================================================
  describe("GET /api/v1/payments", () => {
    it("retourne 200 avec pagination", async () => {
      mockPaymentFindMany.mockResolvedValue([]);
      mockPaymentCount.mockResolvedValue(0);

      const { GET } = await import("@/app/api/v1/payments/route");
      const req = makeRequest("GET", "http://localhost:3000/api/v1/payments");
      const res = await GET(req);

      expect(res.status).toBe(200);
    });

    it("filtre par clientId", async () => {
      mockPaymentFindMany.mockResolvedValue([]);
      mockPaymentCount.mockResolvedValue(0);

      const { GET } = await import("@/app/api/v1/payments/route");
      const req = makeRequest("GET", "http://localhost:3000/api/v1/payments?clientId=c1");
      await GET(req);

      expect(mockPaymentFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ clientId: "c1" }),
        }),
      );
    });
  });

  // =========================================================================
  // GET /api/v1/notifications
  // =========================================================================
  describe("GET /api/v1/notifications", () => {
    it("retourne 200 avec notifications et unreadCount", async () => {
      mockNotificationServiceGet.mockResolvedValue([
        { id: "n1", title: "Test", isRead: false },
      ]);
      mockNotificationServiceUnread.mockResolvedValue(5);

      const { GET } = await import("@/app/api/v1/notifications/route");
      const req = makeRequest("GET", "http://localhost:3000/api/v1/notifications");
      const res = await GET(req);
      const body = await extractJson(res);

      expect(res.status).toBe(200);
      const data = body.data as Record<string, unknown>;
      expect(data.unreadCount).toBe(5);
    });
  });

  // =========================================================================
  // PATCH /api/v1/notifications/[id]/read
  // =========================================================================
  describe("PATCH /api/v1/notifications/[id]/read", () => {
    it("marque une notification comme lue", async () => {
      const { PATCH } = await import("@/app/api/v1/notifications/[id]/read/route");
      const req = makeRequest("PATCH", "http://localhost:3000/api/v1/notifications/n1/read");
      const res = await PATCH(req, { params: Promise.resolve({ id: "n1" }) });

      expect(res.status).toBe(200);
      expect(mockNotificationServiceMarkRead).toHaveBeenCalledWith("tenant-001", "n1", "user-001");
    });
  });

  // =========================================================================
  // PATCH /api/v1/notifications/read-all
  // =========================================================================
  describe("PATCH /api/v1/notifications/read-all", () => {
    it("marque toutes les notifications comme lues", async () => {
      const { PATCH } = await import("@/app/api/v1/notifications/read-all/route");
      const req = makeRequest("PATCH", "http://localhost:3000/api/v1/notifications/read-all");
      const res = await PATCH(req);
      const body = await extractJson(res);

      expect(res.status).toBe(200);
      expect(mockNotificationServiceMarkAll).toHaveBeenCalledWith("tenant-001", "user-001");
    });
  });

  // =========================================================================
  // GET /api/v1/leads/unassigned
  // =========================================================================
  describe("GET /api/v1/leads/unassigned", () => {
    it("retourne les leads non assignes", async () => {
      mockClientFindMany.mockResolvedValue([]);
      mockClientCount.mockResolvedValue(0);

      const { GET } = await import("@/app/api/v1/leads/unassigned/route");
      const req = makeRequest("GET", "http://localhost:3000/api/v1/leads/unassigned");
      const res = await GET(req);

      expect(res.status).toBe(200);
      expect(mockClientFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ assignedAgentId: null }),
        }),
      );
    });

    it("filtre par source", async () => {
      mockClientFindMany.mockResolvedValue([]);
      mockClientCount.mockResolvedValue(0);

      const { GET } = await import("@/app/api/v1/leads/unassigned/route");
      const req = makeRequest("GET", "http://localhost:3000/api/v1/leads/unassigned?source=FACEBOOK");
      await GET(req);

      expect(mockClientFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ source: "FACEBOOK" }),
        }),
      );
    });
  });

  // =========================================================================
  // POST /api/v1/leads/[id]/assign
  // =========================================================================
  describe("POST /api/v1/leads/[id]/assign", () => {
    it("assigne un lead a un agent", async () => {
      mockClientFindFirst.mockResolvedValue({
        id: "lead-1",
        firstName: "Lead",
        lastName: "FB",
        assignedAgentId: null,
        pipelineStage: "NEW",
        source: "FACEBOOK",
      });
      mockUserFindFirst.mockResolvedValue({
        id: "agent-001",
        firstName: "Ali",
        lastName: "Agent",
      });
      mockClientUpdate.mockResolvedValue({
        id: "lead-1",
        assignedAgentId: "agent-001",
        pipelineStage: "NEW",
      });

      const { POST } = await import("@/app/api/v1/leads/[id]/assign/route");
      const req = makeRequest("POST", "http://localhost:3000/api/v1/leads/lead-1/assign", {
        agentId: "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11", // valid UUID
      });
      const res = await POST(req, { params: Promise.resolve({ id: "lead-1" }) });

      expect(res.status).toBe(200);
    });

    it("retourne 409 si deja assigne", async () => {
      mockClientFindFirst.mockResolvedValue({
        id: "lead-1",
        assignedAgentId: "agent-999", // already assigned
        firstName: "X",
        lastName: "Y",
      });

      const { POST } = await import("@/app/api/v1/leads/[id]/assign/route");
      const req = makeRequest("POST", "http://localhost:3000/api/v1/leads/lead-1/assign", {
        agentId: "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
      });
      const res = await POST(req, { params: Promise.resolve({ id: "lead-1" }) });

      expect(res.status).toBe(409);
    });

    it("retourne 422 si agentId pas un UUID valide", async () => {
      const { POST } = await import("@/app/api/v1/leads/[id]/assign/route");
      const req = makeRequest("POST", "http://localhost:3000/api/v1/leads/lead-1/assign", {
        agentId: "not-a-uuid",
      });
      const res = await POST(req, { params: Promise.resolve({ id: "lead-1" }) });

      expect(res.status).toBe(422);
    });
  });

  // =========================================================================
  // GET /api/v1/automations/config
  // =========================================================================
  describe("GET /api/v1/automations/config", () => {
    it("retourne 200 avec la liste des configs", async () => {
      mockAutomationConfigFindMany.mockResolvedValue([]);

      const { GET } = await import("@/app/api/v1/automations/config/route");
      const req = makeRequest("GET", "http://localhost:3000/api/v1/automations/config");
      const res = await GET(req);

      expect(res.status).toBe(200);
    });
  });

  // =========================================================================
  // POST /api/v1/automations/check-overdue (CRON)
  // =========================================================================
  describe("POST /api/v1/automations/check-overdue", () => {
    it("retourne 200 avec les resultats du check", async () => {
      const { POST } = await import("@/app/api/v1/automations/check-overdue/route");
      const req = new NextRequest("http://localhost:3000/api/v1/automations/check-overdue", {
        method: "POST",
      });
      const res = await POST(req);
      const body = await extractJson(res);

      expect(res.status).toBe(200);
      expect(body.success).toBe(true);
    });

    it("retourne 401 si CRON_SECRET est configure et header manquant", async () => {
      // Temporarily set env
      const originalSecret = process.env.CRON_SECRET;
      process.env.CRON_SECRET = "my-secret-123";

      const { POST } = await import("@/app/api/v1/automations/check-overdue/route");
      const req = new NextRequest("http://localhost:3000/api/v1/automations/check-overdue", {
        method: "POST",
        headers: { authorization: "Bearer wrong-secret" },
      });
      const res = await POST(req);

      expect(res.status).toBe(401);

      process.env.CRON_SECRET = originalSecret;
    });
  });
});
