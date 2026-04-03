import { describe, it, expect, vi, beforeEach } from "vitest";

// ============================================================================
// Mocks (vi.hoisted to avoid TDZ issues with vi.mock hoisting)
// ============================================================================

const {
  mockNotificationCreate,
  mockNotificationBulk,
  mockAutomationConfig,
  mockClient,
  mockTask,
  mockVisit,
  mockPayment,
  mockUser,
  mockGlobalTask,
  mockGlobalVisit,
  mockGlobalPayment,
  mockGlobalActivityLog,
} = vi.hoisted(() => ({
  mockNotificationCreate: vi.fn().mockResolvedValue("notif-id"),
  mockNotificationBulk: vi.fn().mockResolvedValue(["n1", "n2"]),
  mockAutomationConfig: { findFirst: vi.fn() },
  mockClient: { findFirst: vi.fn() },
  mockTask: { create: vi.fn().mockResolvedValue({ id: "task-1" }) },
  mockVisit: { findMany: vi.fn().mockResolvedValue([]) },
  mockPayment: { findMany: vi.fn().mockResolvedValue([]) },
  mockUser: { findMany: vi.fn().mockResolvedValue([]) },
  mockGlobalTask: {
    findMany: vi.fn().mockResolvedValue([]),
    update: vi.fn().mockResolvedValue({}),
    createMany: vi.fn().mockResolvedValue({ count: 0 }),
  },
  mockGlobalVisit: {
    findMany: vi.fn().mockResolvedValue([]),
    update: vi.fn().mockResolvedValue({}),
  },
  mockGlobalPayment: { findMany: vi.fn().mockResolvedValue([]) },
  mockGlobalActivityLog: {
    create: vi.fn().mockResolvedValue({}),
    findFirst: vi.fn().mockResolvedValue(null),
  },
}));

vi.mock("@/services/notification.service", () => ({
  createNotification: (...args: unknown[]) => mockNotificationCreate(...args),
  createNotificationBulk: (...args: unknown[]) => mockNotificationBulk(...args),
}));

vi.mock("@/lib/prisma-tenant", () => ({
  createTenantPrisma: vi.fn().mockImplementation(() => ({
    automationConfig: mockAutomationConfig,
    client: mockClient,
    task: mockTask,
    visit: mockVisit,
    payment: mockPayment,
    user: mockUser,
  })),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    task: {
      ...mockGlobalTask,
      updateMany: vi.fn().mockResolvedValue({ count: 0 }),
      createMany: mockGlobalTask.createMany,
    },
    visit: mockGlobalVisit,
    payment: mockGlobalPayment,
    activityLog: mockGlobalActivityLog,
    user: { findMany: vi.fn().mockResolvedValue([{ id: "supervisor-001" }]) },
    notification: { createMany: vi.fn().mockResolvedValue({ count: 0 }) },
    $extends: vi.fn(),
  },
}));

vi.mock("@clerk/nextjs/server", () => ({
  auth: vi.fn(),
  currentUser: vi.fn(),
}));

// ============================================================================
// Imports (AFTER mocks)
// ============================================================================

import { triggerAutomations, checkOverdueTasks } from "@/services/automation-engine";

// ============================================================================
// Tests
// ============================================================================

describe("Automation Engine", () => {
  const TENANT_ID = "tenant-test-001";
  const CLIENT_ID = "client-001";

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("triggerAutomations", () => {
    it("ne fait rien si aucune config pour cette etape", async () => {
      mockAutomationConfig.findFirst.mockResolvedValue(null);

      await triggerAutomations(TENANT_ID, CLIENT_ID, "NEW");

      expect(mockTask.create).not.toHaveBeenCalled();
    });

    it("ne fait rien si la config est desactivee", async () => {
      mockAutomationConfig.findFirst.mockResolvedValue({
        id: "config-1",
        isActive: false,
        tasks: [],
      });

      await triggerAutomations(TENANT_ID, CLIENT_ID, "NEW");

      expect(mockTask.create).not.toHaveBeenCalled();
    });

    it("cree les taches automatisees quand config active", async () => {
      mockAutomationConfig.findFirst.mockResolvedValue({
        id: "config-1",
        isActive: true,
        tasks: [
          { title: "Appeler le client", type: "CALL", delayMinutes: 0 },
          { title: "Envoyer WhatsApp", type: "WHATSAPP", delayMinutes: 240 },
        ],
      });
      mockClient.findFirst.mockResolvedValue({
        id: CLIENT_ID,
        assignedAgentId: "agent-001",
        firstName: "Ahmed",
        lastName: "Kard",
      });

      await triggerAutomations(TENANT_ID, CLIENT_ID, "NEW");

      // Service uses global prisma.task.createMany (not tenant db.task.create)
      expect(mockGlobalTask.createMany).toHaveBeenCalledWith({
        data: expect.arrayContaining([
          expect.objectContaining({
            clientId: CLIENT_ID,
            assignedToId: "agent-001",
            isAutomated: true,
            pipelineStage: "NEW",
            status: "PENDING",
          }),
        ]),
      });
      // Should have 2 tasks in the data array
      const callData = mockGlobalTask.createMany.mock.calls[0][0].data;
      expect(callData).toHaveLength(2);
    });

    it("cree les taches meme si le client n'a pas d'agent", async () => {
      mockAutomationConfig.findFirst.mockResolvedValue({
        id: "config-1",
        isActive: true,
        tasks: [{ title: "Appeler", type: "CALL", delayMinutes: 0 }],
      });
      mockClient.findFirst.mockResolvedValue({
        id: CLIENT_ID,
        assignedAgentId: null,
        firstName: "Test",
        lastName: "Client",
      });

      await triggerAutomations(TENANT_ID, CLIENT_ID, "NEW");

      // Tasks are created with assignedToId: null
      expect(mockGlobalTask.createMany).toHaveBeenCalledWith({
        data: expect.arrayContaining([
          expect.objectContaining({
            clientId: CLIENT_ID,
            assignedToId: null,
          }),
        ]),
      });
    });

    it("est non-bloquant en cas d'erreur", async () => {
      mockAutomationConfig.findFirst.mockRejectedValue(
        new Error("DB connection lost"),
      );

      // Should not throw
      await expect(
        triggerAutomations(TENANT_ID, CLIENT_ID, "NEW"),
      ).resolves.toBeUndefined();
    });
  });

  describe("checkOverdueTasks", () => {
    it("marque les taches PENDING en retard et retourne le count", async () => {
      const overdueTasks = [
        {
          id: "task-overdue-1",
          tenantId: TENANT_ID,
          assignedToId: "agent-001",
          clientId: CLIENT_ID,
          title: "Appeler client",
          status: "PENDING",
          dueAt: new Date(Date.now() - 3600_000),
          assignedTo: { id: "agent-001", firstName: "Ali", lastName: "Agent" },
          client: { id: CLIENT_ID, firstName: "Ahmed", lastName: "Client" },
        },
      ];
      mockGlobalTask.findMany.mockResolvedValueOnce(overdueTasks);
      // 2nd call for escalation
      mockGlobalTask.findMany.mockResolvedValueOnce([]);

      const result = await checkOverdueTasks();

      expect(result.markedOverdue).toBe(1);
    });

    it("escalade au superviseur les taches en retard de +24h", async () => {
      // No newly overdue
      mockGlobalTask.findMany.mockResolvedValueOnce([]);
      // Escalation tasks
      mockGlobalTask.findMany.mockResolvedValueOnce([
        {
          id: "task-esc-1",
          tenantId: TENANT_ID,
          assignedToId: "agent-001",
          clientId: CLIENT_ID,
          title: "Relancer",
          status: "IN_PROGRESS",
          notes: null,
          dueAt: new Date(Date.now() - 48 * 3600_000),
          assignedTo: {
            id: "agent-001",
            firstName: "Ali",
            lastName: "Agent",
            tenantId: TENANT_ID,
          },
          client: { id: CLIENT_ID, firstName: "Ahmed", lastName: "Client" },
        },
      ]);

      const result = await checkOverdueTasks();

      expect(result.escalated).toBe(1);
      // Should mark as [ESCALATED]
      expect(mockGlobalTask.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "task-esc-1" },
          data: expect.objectContaining({
            notes: expect.stringContaining("[ESCALATED]"),
          }),
        }),
      );
    });
  });
});
