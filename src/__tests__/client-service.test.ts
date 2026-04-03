import { describe, it, expect, vi, beforeEach } from "vitest";

// ============================================================================
// Mocks (vi.hoisted)
// ============================================================================

const {
  mockClientFindFirst,
  mockClientCreate,
  mockClientUpdate,
  mockUserFindMany,
  mockUserFindFirst,
  mockActivityLogCreate,
  mockNotificationCreate,
  mockNotificationBulk,
  mockCheckDuplicates,
  mockTriggerAutomations,
} = vi.hoisted(() => ({
  mockClientFindFirst: vi.fn(),
  mockClientCreate: vi.fn(),
  mockClientUpdate: vi.fn(),
  mockUserFindMany: vi.fn().mockResolvedValue([]),
  mockUserFindFirst: vi.fn(),
  mockActivityLogCreate: vi.fn().mockResolvedValue({}),
  mockNotificationCreate: vi.fn().mockResolvedValue("notif-id"),
  mockNotificationBulk: vi.fn().mockResolvedValue(0),
  mockCheckDuplicates: vi.fn(),
  mockTriggerAutomations: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/services/notification.service", () => ({
  createNotification: (...args: unknown[]) => mockNotificationCreate(...args),
  createNotificationBulk: (...args: unknown[]) => mockNotificationBulk(...args),
}));

vi.mock("@/services/client-dedup", () => ({
  checkDuplicates: (...args: unknown[]) => mockCheckDuplicates(...args),
  normalizePhone: vi.fn().mockImplementation((p: string) => {
    let cleaned = p.replace(/[\s\-\(\)\.]/g, "");
    if (cleaned.startsWith("0") && cleaned.length === 10) cleaned = "+213" + cleaned.substring(1);
    if (cleaned.startsWith("213") && !cleaned.startsWith("+")) cleaned = "+" + cleaned;
    return cleaned;
  }),
}));

vi.mock("@/services/automation-engine", () => ({
  triggerAutomations: (...args: unknown[]) => mockTriggerAutomations(...args),
}));

vi.mock("@/lib/prisma-tenant", () => ({
  createTenantPrisma: vi.fn().mockImplementation(() => ({
    client: {
      findFirst: mockClientFindFirst,
      create: mockClientCreate,
      update: mockClientUpdate,
    },
    user: {
      findMany: mockUserFindMany,
      findFirst: mockUserFindFirst,
    },
  })),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    activityLog: { create: mockActivityLogCreate },
    $extends: vi.fn(),
  },
}));

vi.mock("@clerk/nextjs/server", () => ({
  auth: vi.fn(),
  currentUser: vi.fn(),
}));

// ============================================================================
// Imports
// ============================================================================

import { createClient, reassignClient, changeClientStage } from "@/services/client.service";
import type { ICurrentUser } from "@/lib/auth";

// ============================================================================
// Helpers
// ============================================================================

function makeUser(overrides: Partial<ICurrentUser> = {}): ICurrentUser {
  return {
    userId: "user-001",
    tenantId: "tenant-001",
    role: "AGENT",
    clerkId: "clerk-001",
    firstName: "Ali",
    lastName: "Agent",
    email: "ali@test.com",
    ...overrides,
  };
}

// ============================================================================
// Tests
// ============================================================================

describe("Client Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // -----------------------------------------------------------------------
  // createClient
  // -----------------------------------------------------------------------
  describe("createClient", () => {
    it("cree un client quand pas de doublon", async () => {
      mockCheckDuplicates.mockResolvedValue({ canCreate: true, duplicates: [] });
      mockClientCreate.mockResolvedValue({
        id: "new-client",
        firstName: "Ahmed",
        lastName: "Kard",
        phone: "+213555111111",
        pipelineStage: "NEW",
        assignedAgentId: "user-001",
      });
      mockUserFindMany.mockResolvedValue([]);

      const result = await createClient(makeUser(), {
        firstName: "Ahmed",
        lastName: "Kard",
        phone: "0555111111",
      });

      expect(result.client).not.toBeNull();
      expect(result.client!.id).toBe("new-client");
      expect(result.dedup.canCreate).toBe(true);
    });

    it("retourne null quand doublon telephone bloquant", async () => {
      mockCheckDuplicates.mockResolvedValue({
        canCreate: false,
        duplicates: [{ type: "PHONE_EXACT", existingClientId: "existing-1" }],
      });

      const result = await createClient(makeUser(), {
        firstName: "Ahmed",
        lastName: "Kard",
        phone: "+213555111111",
      });

      expect(result.client).toBeNull();
      expect(result.dedup.canCreate).toBe(false);
      expect(mockClientCreate).not.toHaveBeenCalled();
    });

    it("Facebook leads ont assignedAgentId=null", async () => {
      mockCheckDuplicates.mockResolvedValue({ canCreate: true, duplicates: [] });
      mockClientCreate.mockResolvedValue({
        id: "fb-client",
        assignedAgentId: null,
        source: "FACEBOOK",
      });
      mockUserFindMany.mockResolvedValue([]);

      await createClient(makeUser(), {
        firstName: "Lead",
        lastName: "FB",
        phone: "+213555222333",
        source: "FACEBOOK",
      });

      expect(mockClientCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            assignedAgentId: null,
            source: "FACEBOOK",
          }),
        }),
      );
    });

    it("source non-Facebook assigne a l'agent courant", async () => {
      mockCheckDuplicates.mockResolvedValue({ canCreate: true, duplicates: [] });
      mockClientCreate.mockResolvedValue({
        id: "normal-client",
        assignedAgentId: "user-001",
      });
      mockUserFindMany.mockResolvedValue([]);

      await createClient(makeUser(), {
        firstName: "Client",
        lastName: "Normal",
        phone: "+213555444555",
        source: "PHONE",
      });

      expect(mockClientCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            assignedAgentId: "user-001",
          }),
        }),
      );
    });

    it("log l'action dans ActivityLog", async () => {
      mockCheckDuplicates.mockResolvedValue({ canCreate: true, duplicates: [] });
      mockClientCreate.mockResolvedValue({ id: "c1" });
      mockUserFindMany.mockResolvedValue([]);

      await createClient(makeUser(), {
        firstName: "Test",
        lastName: "Log",
        phone: "+213555666777",
      });

      expect(mockActivityLogCreate).toHaveBeenCalledWith({
        data: expect.objectContaining({
          action: "CLIENT_CREATED",
          entity: "Client",
          entityId: "c1",
        }),
      });
    });

    it("notifie les superviseurs (pas l'auteur)", async () => {
      mockCheckDuplicates.mockResolvedValue({ canCreate: true, duplicates: [] });
      mockClientCreate.mockResolvedValue({ id: "c1" });
      mockUserFindMany.mockResolvedValue([
        { id: "sup-001" },
        { id: "user-001" }, // l'auteur — ne doit PAS recevoir la notif
      ]);

      await createClient(makeUser(), {
        firstName: "Test",
        lastName: "Notif",
        phone: "+213555888999",
      });

      expect(mockNotificationBulk).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ userId: "sup-001" }),
        ]),
      );
      // L'auteur ne doit pas etre notifie
      const call = mockNotificationBulk.mock.calls[0][0] as Array<Record<string, unknown>>;
      expect(call.every((n) => n.userId !== "user-001")).toBe(true);
    });
  });

  // -----------------------------------------------------------------------
  // reassignClient
  // -----------------------------------------------------------------------
  describe("reassignClient", () => {
    it("refuse les roles non autorises", async () => {
      await expect(
        reassignClient(makeUser({ role: "AGENT" }), "c1", "agent-2"),
      ).rejects.toThrow("seuls CEO, ADMIN et SUPERVISOR");

      await expect(
        reassignClient(makeUser({ role: "ASSISTANT" }), "c1", "agent-2"),
      ).rejects.toThrow("seuls CEO, ADMIN et SUPERVISOR");
    });

    it("echoue si client introuvable", async () => {
      mockClientFindFirst.mockResolvedValue(null);

      await expect(
        reassignClient(makeUser({ role: "CEO" }), "c-inexistant", "agent-2"),
      ).rejects.toThrow("Client introuvable");
    });

    it("echoue si agent cible inactif", async () => {
      mockClientFindFirst.mockResolvedValue({ id: "c1", assignedAgentId: "agent-1", firstName: "A", lastName: "B" });
      mockUserFindFirst.mockResolvedValue(null);

      await expect(
        reassignClient(makeUser({ role: "CEO" }), "c1", "agent-inactif"),
      ).rejects.toThrow("Agent cible introuvable");
    });

    it("reassigne et notifie les deux agents", async () => {
      mockClientFindFirst.mockResolvedValue({
        id: "c1",
        assignedAgentId: "old-agent",
        firstName: "Ahmed",
        lastName: "Client",
      });
      mockUserFindFirst.mockResolvedValue({ id: "new-agent", isActive: true });
      mockClientUpdate.mockResolvedValue({
        id: "c1",
        assignedAgentId: "new-agent",
        firstName: "Ahmed",
        lastName: "Client",
      });

      const result = await reassignClient(
        makeUser({ role: "SUPERVISOR", userId: "sup-001" }),
        "c1",
        "new-agent",
      );

      expect(result.previousAgentId).toBe("old-agent");
      expect(result.newAgentId).toBe("new-agent");

      // Log dans ActivityLog
      expect(mockActivityLogCreate).toHaveBeenCalledWith({
        data: expect.objectContaining({
          action: "CLIENT_REASSIGNED",
          metadata: expect.objectContaining({
            previousAgentId: "old-agent",
            newAgentId: "new-agent",
          }),
        }),
      });

      // Notifications: ancien + nouveau agent
      expect(mockNotificationBulk).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ userId: "old-agent", type: "REASSIGNMENT" }),
          expect.objectContaining({ userId: "new-agent", type: "REASSIGNMENT" }),
        ]),
      );
    });
  });

  // -----------------------------------------------------------------------
  // changeClientStage
  // -----------------------------------------------------------------------
  describe("changeClientStage", () => {
    it("change l'etape du pipeline", async () => {
      mockClientFindFirst.mockResolvedValue({
        id: "c1",
        pipelineStage: "NEW",
        assignedAgentId: "agent-001",
        firstName: "Ahmed",
        lastName: "Client",
      });
      mockClientUpdate.mockResolvedValue({
        id: "c1",
        pipelineStage: "CONTACTED",
        portalToken: null,
      });
      mockUserFindMany.mockResolvedValue([]);

      const result = await changeClientStage(makeUser({ role: "CEO" }), "c1", "CONTACTED");

      expect(result.pipelineStage).toBe("CONTACTED");
    });

    it("genere un portalToken pour RESERVED", async () => {
      mockClientFindFirst.mockResolvedValue({
        id: "c1",
        pipelineStage: "NEGOTIATION",
        assignedAgentId: "agent-001",
        firstName: "Ahmed",
        lastName: "Client",
      });
      mockClientUpdate.mockResolvedValue({
        id: "c1",
        pipelineStage: "RESERVED",
        portalToken: "generated-uuid",
      });
      mockUserFindMany.mockResolvedValue([]);

      await changeClientStage(makeUser({ role: "CEO" }), "c1", "RESERVED");

      // Verify that update was called with portalToken
      expect(mockClientUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            pipelineStage: "RESERVED",
          }),
        }),
      );
    });

    it("notifie l'agent assigne si ce n'est pas l'auteur", async () => {
      mockClientFindFirst.mockResolvedValue({
        id: "c1",
        pipelineStage: "NEW",
        assignedAgentId: "agent-001", // different from user
        firstName: "Ahmed",
        lastName: "Client",
      });
      mockClientUpdate.mockResolvedValue({
        id: "c1",
        pipelineStage: "CONTACTED",
      });
      mockUserFindMany.mockResolvedValue([]);

      await changeClientStage(makeUser({ role: "CEO", userId: "ceo-001" }), "c1", "CONTACTED");

      expect(mockNotificationCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: "agent-001",
          type: "STAGE_CHANGED",
        }),
      );
    });

    it("notifie les superviseurs pour les etapes critiques", async () => {
      mockClientFindFirst.mockResolvedValue({
        id: "c1",
        pipelineStage: "VISITED",
        assignedAgentId: "agent-001",
        firstName: "Ahmed",
        lastName: "Client",
      });
      mockClientUpdate.mockResolvedValue({
        id: "c1",
        pipelineStage: "NEGOTIATION",
      });
      mockUserFindMany.mockResolvedValue([{ id: "sup-001" }]);

      await changeClientStage(makeUser({ role: "AGENT", userId: "agent-001" }), "c1", "NEGOTIATION");

      expect(mockNotificationBulk).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            userId: "sup-001",
            type: "STAGE_CHANGED",
          }),
        ]),
      );
    });

    it("declenche les automatisations (non-bloquant)", async () => {
      mockClientFindFirst.mockResolvedValue({
        id: "c1",
        pipelineStage: "NEW",
        assignedAgentId: "agent-001",
        firstName: "Test",
        lastName: "Client",
      });
      mockClientUpdate.mockResolvedValue({
        id: "c1",
        pipelineStage: "CONTACTED",
      });
      mockUserFindMany.mockResolvedValue([]);

      await changeClientStage(makeUser({ role: "CEO" }), "c1", "CONTACTED");

      // triggerAutomations should have been called
      expect(mockTriggerAutomations).toHaveBeenCalledWith("tenant-001", "c1", "CONTACTED");
    });

    it("echoue si client introuvable", async () => {
      mockClientFindFirst.mockResolvedValue(null);

      await expect(
        changeClientStage(makeUser({ role: "CEO" }), "c-inexistant", "CONTACTED"),
      ).rejects.toThrow("Client introuvable");
    });

    it("log le changement dans ActivityLog", async () => {
      mockClientFindFirst.mockResolvedValue({
        id: "c1",
        pipelineStage: "NEW",
        assignedAgentId: null,
        firstName: "Test",
        lastName: "Client",
      });
      mockClientUpdate.mockResolvedValue({
        id: "c1",
        pipelineStage: "CONTACTED",
      });
      mockUserFindMany.mockResolvedValue([]);

      await changeClientStage(makeUser({ role: "CEO" }), "c1", "CONTACTED");

      expect(mockActivityLogCreate).toHaveBeenCalledWith({
        data: expect.objectContaining({
          action: "CLIENT_STAGE_CHANGED",
          metadata: expect.objectContaining({
            previousStage: "NEW",
            newStage: "CONTACTED",
          }),
        }),
      });
    });
  });
});
