import { describe, it, expect, vi, beforeEach } from "vitest";

// ============================================================================
// Mocks (vi.hoisted)
// ============================================================================

const {
  mockClientFindFirst,
  mockClientCreate,
  mockUserFindMany,
  mockUserFindFirst,
  mockActivityLogCreate,
  mockActivityLogFindFirst,
  mockNotificationCreate,
  mockNotificationBulk,
  mockAutomationConfigFindFirst,
  mockGlobalTaskCreateMany,
  mockGlobalTaskFindMany,
  mockGlobalTaskUpdate,
  mockGlobalTaskUpdateMany,
  mockGlobalVisitFindMany,
  mockGlobalVisitUpdate,
  mockGlobalPaymentFindMany,
  mockInteractionCreate,
  mockTenantFindUnique,
  mockAIGenerationCount,
  mockAIGenerationCreate,
} = vi.hoisted(() => ({
  mockClientFindFirst: vi.fn(),
  mockClientCreate: vi.fn(),
  mockUserFindMany: vi.fn().mockResolvedValue([]),
  mockUserFindFirst: vi.fn(),
  mockActivityLogCreate: vi.fn().mockResolvedValue({}),
  mockActivityLogFindFirst: vi.fn().mockResolvedValue(null),
  mockNotificationCreate: vi.fn().mockResolvedValue("notif-id"),
  mockNotificationBulk: vi.fn().mockResolvedValue(0),
  mockAutomationConfigFindFirst: vi.fn(),
  mockGlobalTaskCreateMany: vi.fn().mockResolvedValue({ count: 0 }),
  mockGlobalTaskFindMany: vi.fn().mockResolvedValue([]),
  mockGlobalTaskUpdate: vi.fn().mockResolvedValue({}),
  mockGlobalTaskUpdateMany: vi.fn().mockResolvedValue({ count: 0 }),
  mockGlobalVisitFindMany: vi.fn().mockResolvedValue([]),
  mockGlobalVisitUpdate: vi.fn().mockResolvedValue({}),
  mockGlobalPaymentFindMany: vi.fn().mockResolvedValue([]),
  mockInteractionCreate: vi.fn().mockResolvedValue({ id: "int-1" }),
  mockTenantFindUnique: vi.fn(),
  mockAIGenerationCount: vi.fn().mockResolvedValue(0),
  mockAIGenerationCreate: vi.fn().mockResolvedValue({ id: "gen-1" }),
}));

vi.mock("@/services/notification.service", () => ({
  createNotification: (...args: unknown[]) => mockNotificationCreate(...args),
  createNotificationBulk: (...args: unknown[]) => mockNotificationBulk(...args),
}));

vi.mock("@/lib/prisma-tenant", () => ({
  createTenantPrisma: vi.fn().mockImplementation(() => ({
    automationConfig: { findFirst: mockAutomationConfigFindFirst },
    client: {
      findFirst: mockClientFindFirst,
      create: mockClientCreate,
      update: vi.fn().mockResolvedValue({}),
    },
    task: {
      create: vi.fn().mockResolvedValue({ id: "task-1" }),
      findFirst: vi.fn(),
    },
    visit: { findMany: vi.fn().mockResolvedValue([]) },
    payment: { findMany: vi.fn().mockResolvedValue([]) },
    user: {
      findMany: mockUserFindMany,
      findFirst: mockUserFindFirst,
    },
    interaction: { create: mockInteractionCreate, findMany: vi.fn().mockResolvedValue([]) },
  })),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    task: {
      createMany: mockGlobalTaskCreateMany,
      findMany: mockGlobalTaskFindMany,
      update: mockGlobalTaskUpdate,
      updateMany: mockGlobalTaskUpdateMany,
    },
    visit: {
      findMany: mockGlobalVisitFindMany,
      update: mockGlobalVisitUpdate,
    },
    payment: { findMany: mockGlobalPaymentFindMany },
    activityLog: {
      create: mockActivityLogCreate,
      findFirst: mockActivityLogFindFirst,
    },
    user: { findMany: mockUserFindMany, findFirst: mockUserFindFirst },
    notification: { createMany: vi.fn().mockResolvedValue({ count: 0 }) },
    client: { findFirst: mockClientFindFirst },
    interaction: { create: mockInteractionCreate },
    tenant: { findUnique: mockTenantFindUnique },
    aIGeneration: { count: mockAIGenerationCount, create: mockAIGenerationCreate },
    $extends: vi.fn(),
  },
}));

vi.mock("@/lib/auth", () => ({
  auth: vi.fn(),
  currentUser: vi.fn(),
}));

// Mock fetch for WhatsApp
const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

// ============================================================================
// Imports (AFTER mocks)
// ============================================================================

import { checkDuplicates, normalizePhone } from "@/services/client-dedup";
import { triggerAutomations, checkOverdueTasks, checkUpcomingVisits, checkOverduePayments } from "@/services/automation-engine";
import { processFacebookLead } from "@/services/facebook-leads.service";
import { receiveMessage } from "@/services/whatsapp.service";
import { LimitExceededError } from "@/services/ai-agent.service";
import type { ICurrentUser } from "@/lib/auth";

// ============================================================================
// Helpers
// ============================================================================

function makeUser(overrides: Partial<ICurrentUser> = {}): ICurrentUser {
  return {
    userId: "user-001",
    tenantId: "tenant-001",
    role: "AGENT",
    supabaseId: "sb-001",
    firstName: "Test",
    lastName: "User",
    email: "test@test.com",
    ...overrides,
  };
}

// ============================================================================
// 3. TESTS BUSINESS LOGIC
// ============================================================================

describe("Business Logic", () => {
  const TENANT_ID = "tenant-biz-001";

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // -----------------------------------------------------------------------
  // Doublons telephone = erreur detaillee
  // -----------------------------------------------------------------------
  describe("Detection doublons telephone", () => {
    it("telephone existant retourne canCreate=false avec details complets", async () => {
      mockClientFindFirst
        .mockResolvedValueOnce({
          id: "existing-client",
          firstName: "Ahmed",
          lastName: "Kard",
          phone: "+213555123456",
          pipelineStage: "NEGOTIATION",
          assignedAgent: { firstName: "Ali", lastName: "Agent" },
          interactions: [{ createdAt: new Date("2026-03-01") }],
        })
        .mockResolvedValueOnce(null); // name match

      const result = await checkDuplicates(TENANT_ID, {
        phone: "0555123456",
        firstName: "Ahmed",
        lastName: "Other",
      });

      expect(result.canCreate).toBe(false);
      expect(result.duplicates).toHaveLength(1);
      expect(result.duplicates[0]).toEqual(
        expect.objectContaining({
          type: "PHONE_EXACT",
          existingClientId: "existing-client",
          existingClientName: "Ahmed Kard",
          assignedAgentName: "Ali Agent",
          pipelineStage: "NEGOTIATION",
        }),
      );
    });

    it("telephone normalise avant recherche (espaces, tirets)", async () => {
      mockClientFindFirst.mockResolvedValue(null);

      await checkDuplicates(TENANT_ID, {
        phone: "05 55-12 34 56",
        firstName: "Test",
        lastName: "User",
      });

      expect(mockClientFindFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            phone: "+213555123456",
          }),
        }),
      );
    });

    it("pas de doublon = canCreate true", async () => {
      mockClientFindFirst.mockResolvedValue(null);

      const result = await checkDuplicates(TENANT_ID, {
        phone: "+213555000001",
        firstName: "New",
        lastName: "Client",
      });

      expect(result.canCreate).toBe(true);
      expect(result.duplicates).toHaveLength(0);
    });

    it("email doublon = alerte mais canCreate true", async () => {
      // checkDuplicates calls findFirst 3 times: phone, email, name
      // First mockResolvedValueOnce already consumed above, so reset
      mockClientFindFirst
        .mockResolvedValueOnce(null) // 1. phone match: none
        .mockResolvedValueOnce({ id: "email-dup", firstName: "Dup", lastName: "Email" }) // 2. email match: found
        .mockResolvedValueOnce(null); // 3. name match: none

      const result = await checkDuplicates(TENANT_ID, {
        phone: "+213555000099",
        email: "dup@test.com",
        firstName: "New",
        lastName: "Client",
      });

      expect(result.canCreate).toBe(true); // email is non-blocking
      expect(result.duplicates.length).toBeGreaterThanOrEqual(1);
      const hasEmailDup = result.duplicates.some((d) => d.type === "EMAIL_EXACT");
      expect(hasEmailDup).toBe(true);
    });
  });

  // -----------------------------------------------------------------------
  // Changement etape pipeline declenche automatisations
  // -----------------------------------------------------------------------
  describe("triggerAutomations — changement etape", () => {
    it("config active cree les taches automatisees", async () => {
      mockAutomationConfigFindFirst.mockResolvedValue({
        id: "config-1",
        isActive: true,
        tasks: [
          { title: "Appeler {clientName}", type: "CALL", delayMinutes: 0 },
          { title: "Email de bienvenue", type: "EMAIL", delayMinutes: 60 },
        ],
      });
      mockClientFindFirst.mockResolvedValue({
        id: "client-001",
        assignedAgentId: "agent-001",
        firstName: "Ahmed",
        lastName: "Kard",
      });

      await triggerAutomations(TENANT_ID, "client-001", "NEW");

      expect(mockGlobalTaskCreateMany).toHaveBeenCalledWith({
        data: expect.arrayContaining([
          expect.objectContaining({
            title: "Appeler Ahmed Kard",
            type: "CALL",
            clientId: "client-001",
            assignedToId: "agent-001",
            status: "PENDING",
            isAutomated: true,
            pipelineStage: "NEW",
          }),
          expect.objectContaining({
            title: "Email de bienvenue",
            type: "EMAIL",
          }),
        ]),
      });
    });

    it("config inactive ne cree rien", async () => {
      mockAutomationConfigFindFirst.mockResolvedValue({
        id: "config-1",
        isActive: false,
        tasks: [],
      });

      await triggerAutomations(TENANT_ID, "client-001", "NEW");

      expect(mockGlobalTaskCreateMany).not.toHaveBeenCalled();
    });

    it("erreur DB ne bloque pas le flow (non-bloquant)", async () => {
      mockAutomationConfigFindFirst.mockRejectedValue(new Error("DB down"));

      await expect(
        triggerAutomations(TENANT_ID, "client-001", "NEW"),
      ).resolves.toBeUndefined();
    });
  });

  // -----------------------------------------------------------------------
  // Tache overdue declenche escalade
  // -----------------------------------------------------------------------
  describe("checkOverdueTasks — escalade", () => {
    it("marque les taches PENDING en retard comme IN_PROGRESS", async () => {
      mockGlobalTaskFindMany
        .mockResolvedValueOnce([
          {
            id: "task-1",
            tenantId: TENANT_ID,
            assignedToId: "agent-001",
            title: "Appeler",
            status: "PENDING",
            dueAt: new Date(Date.now() - 3600_000),
            assignedTo: { id: "agent-001", firstName: "Ali", lastName: "A" },
            client: { id: "c1", firstName: "Ahmed", lastName: "K" },
          },
        ])
        .mockResolvedValueOnce([]); // escalation

      const result = await checkOverdueTasks();

      expect(result.markedOverdue).toBe(1);
      expect(mockGlobalTaskUpdateMany).toHaveBeenCalledWith({
        where: { id: { in: ["task-1"] } },
        data: { status: "IN_PROGRESS" },
      });
    });

    it("escalade au superviseur les taches >24h en retard", async () => {
      mockGlobalTaskFindMany
        .mockResolvedValueOnce([]) // no newly overdue
        .mockResolvedValueOnce([
          {
            id: "task-esc-1",
            tenantId: TENANT_ID,
            assignedToId: "agent-001",
            title: "Relancer client",
            status: "IN_PROGRESS",
            isAutomated: true,
            notes: null,
            dueAt: new Date(Date.now() - 48 * 3600_000),
            assignedTo: {
              id: "agent-001",
              firstName: "Ali",
              lastName: "A",
              tenantId: TENANT_ID,
            },
            client: { id: "c1", firstName: "Ahmed", lastName: "K" },
          },
        ]);
      mockUserFindMany.mockResolvedValue([{ id: "sup-001" }]);

      const result = await checkOverdueTasks();

      expect(result.escalated).toBe(1);
      expect(mockGlobalTaskUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "task-esc-1" },
          data: expect.objectContaining({
            notes: expect.stringContaining("[ESCALATED]"),
          }),
        }),
      );
    });
  });

  // -----------------------------------------------------------------------
  // Rappel visites imminentes
  // -----------------------------------------------------------------------
  describe("checkUpcomingVisits — rappel 1h avant", () => {
    it("notifie l'agent 1h avant la visite", async () => {
      const inOneHour = new Date(Date.now() + 30 * 60_000); // 30 min from now
      mockGlobalVisitFindMany.mockResolvedValue([
        {
          id: "visit-1",
          status: "SCHEDULED",
          scheduledAt: inOneHour,
          feedback: null,
          clientId: "c1",
          agent: { id: "agent-001", firstName: "Ali", lastName: "A", tenantId: TENANT_ID },
          client: { id: "c1", firstName: "Ahmed", lastName: "K" },
          property: { name: "F3 Les Pins" },
        },
      ]);

      const result = await checkUpcomingVisits();

      expect(result).toBe(1);
      expect(mockNotificationCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: "agent-001",
          type: "VISIT_REMINDER",
        }),
      );
    });

    it("ne re-notifie pas une visite deja [REMINDED]", async () => {
      mockGlobalVisitFindMany.mockResolvedValue([]);

      const result = await checkUpcomingVisits();

      expect(result).toBe(0);
      expect(mockNotificationCreate).not.toHaveBeenCalled();
    });
  });

  // -----------------------------------------------------------------------
  // Paiements en retard
  // -----------------------------------------------------------------------
  describe("checkOverduePayments — paiements >30j", () => {
    it("notifie agent et superviseur pour paiement en retard", async () => {
      mockGlobalPaymentFindMany.mockResolvedValue([
        {
          id: "pay-1",
          amount: 5000000,
          type: "INSTALLMENT",
          clientId: "c1",
          tenantId: TENANT_ID,
          status: "PENDING",
          createdAt: new Date(Date.now() - 40 * 24 * 3600_000),
        },
      ]);
      mockActivityLogFindFirst.mockResolvedValue(null); // not yet notified
      mockClientFindFirst.mockResolvedValue({
        id: "c1",
        firstName: "Ahmed",
        lastName: "K",
        assignedAgentId: "agent-001",
      });
      mockUserFindMany.mockResolvedValue([{ id: "sup-001" }]);

      const result = await checkOverduePayments();

      expect(result).toBe(1);
      expect(mockNotificationCreate).toHaveBeenCalled();
    });

    it("ne re-notifie pas un paiement deja notifie", async () => {
      mockGlobalPaymentFindMany.mockResolvedValue([
        {
          id: "pay-1",
          amount: 5000000,
          type: "INSTALLMENT",
          clientId: "c1",
          tenantId: TENANT_ID,
        },
      ]);
      mockActivityLogFindFirst.mockResolvedValue({ id: "already-notified" });

      const result = await checkOverduePayments();

      expect(result).toBe(0);
    });
  });

  // -----------------------------------------------------------------------
  // Facebook lead cree sans agent assigne
  // -----------------------------------------------------------------------
  describe("Facebook Leads", () => {
    it("cree un client avec assignedAgentId=null", async () => {
      // No duplicate
      mockClientFindFirst.mockResolvedValue(null);
      mockClientCreate.mockResolvedValue({
        id: "new-fb-client",
        firstName: "Lead",
        lastName: "Facebook",
        source: "FACEBOOK",
        assignedAgentId: null,
      });
      mockUserFindMany.mockResolvedValue([{ id: "sup-001" }]);

      const result = await processFacebookLead(TENANT_ID, {
        leadId: "fb-lead-001",
        formId: "form-001",
        firstName: "Lead",
        lastName: "Facebook",
        phone: "0555111222",
        createdTime: new Date().toISOString(),
      });

      expect(result.action).toBe("CREATED");
      expect(result.clientId).toBe("new-fb-client");

      // Verify client created with null agent
      expect(mockClientCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            source: "FACEBOOK",
            pipelineStage: "NEW",
            assignedAgentId: null,
          }),
        }),
      );
    });

    it("doublon telephone retourne DUPLICATE", async () => {
      mockClientFindFirst.mockResolvedValueOnce({
        id: "existing",
        firstName: "Existing",
        lastName: "Client",
        phone: "+213555111222",
        pipelineStage: "CONTACTED",
        assignedAgent: { firstName: "A", lastName: "B" },
        interactions: [],
      });
      // name check (second call)
      mockClientFindFirst.mockResolvedValueOnce(null);

      const result = await processFacebookLead(TENANT_ID, {
        leadId: "fb-lead-002",
        formId: "form-001",
        firstName: "Dup",
        lastName: "Lead",
        phone: "0555111222",
        createdTime: new Date().toISOString(),
      });

      expect(result.action).toBe("DUPLICATE");
      expect(result.clientId).toBeNull();
      expect(result.duplicateClientId).toBe("existing");
    });

    it("notifie les superviseurs et CEO", async () => {
      mockClientFindFirst.mockResolvedValue(null);
      mockClientCreate.mockResolvedValue({
        id: "new-client",
        firstName: "Lead",
        lastName: "FB",
      });
      mockUserFindMany.mockResolvedValue([
        { id: "sup-001" },
        { id: "ceo-001" },
      ]);

      await processFacebookLead(TENANT_ID, {
        leadId: "fb-lead-003",
        formId: "form-001",
        firstName: "Lead",
        lastName: "FB",
        phone: "0555333444",
        createdTime: new Date().toISOString(),
      });

      expect(mockNotificationBulk).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            type: "FACEBOOK_LEAD",
            userId: "sup-001",
          }),
          expect.objectContaining({
            type: "FACEBOOK_LEAD",
            userId: "ceo-001",
          }),
        ]),
      );
    });
  });

  // -----------------------------------------------------------------------
  // WhatsApp message route vers bon agent
  // -----------------------------------------------------------------------
  describe("WhatsApp — routage messages", () => {
    it("route vers l'agent assigne du client", async () => {
      mockClientFindFirst.mockResolvedValue({
        id: "client-001",
        firstName: "Ahmed",
        lastName: "Kard",
        assignedAgentId: "agent-001",
      });

      const result = await receiveMessage(TENANT_ID, {
        from: "+213555111111",
        body: "Bonjour, infos sur le F3?",
        messageId: "msg-001",
        timestamp: Date.now(),
      });

      expect(result.clientId).toBe("client-001");
      expect(result.routedToAgentId).toBe("agent-001");
      expect(result.isNewContact).toBe(false);

      // Notify the agent
      expect(mockNotificationCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: "agent-001",
          type: "WHATSAPP_IN",
        }),
      );
    });

    it("contact inconnu notifie les superviseurs", async () => {
      mockClientFindFirst.mockResolvedValue(null);
      mockUserFindMany.mockResolvedValue([
        { id: "sup-001" },
        { id: "ceo-001" },
      ]);

      const result = await receiveMessage(TENANT_ID, {
        from: "+213555999999",
        body: "Bonjour",
        messageId: "msg-002",
        timestamp: Date.now(),
      });

      expect(result.isNewContact).toBe(true);
      expect(result.clientId).toBeNull();

      expect(mockNotificationBulk).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ type: "WHATSAPP_UNKNOWN" }),
        ]),
      );
    });
  });

  // -----------------------------------------------------------------------
  // Limite AI par plan respectee
  // -----------------------------------------------------------------------
  describe("AI — Limites par plan", () => {
    it("LimitExceededError existe et a le bon name", () => {
      const err = new LimitExceededError("test");
      expect(err.name).toBe("LimitExceededError");
      expect(err.message).toBe("test");
      expect(err).toBeInstanceOf(Error);
    });

    it("les plans STARTER et PRO n'ont pas acces a l'IA (limit = 0)", async () => {
      const { hasModule } = await import("@/lib/modules");
      expect(hasModule("AI_AGENT", "PROMOTION", "STARTER")).toBe(false);
      expect(hasModule("AI_AGENT", "PROMOTION", "PRO")).toBe(false);
    });

    it("le plan BUSINESS a acces a l'IA", async () => {
      const { hasModule } = await import("@/lib/modules");
      expect(hasModule("AI_AGENT", "PROMOTION", "BUSINESS")).toBe(true);
    });

    it("le plan ENTERPRISE a acces a l'IA", async () => {
      const { hasModule } = await import("@/lib/modules");
      expect(hasModule("AI_AGENT", "PROMOTION", "ENTERPRISE")).toBe(true);
    });
  });

  // -----------------------------------------------------------------------
  // Normalisation telephone — exhaustive
  // -----------------------------------------------------------------------
  describe("normalizePhone — cas exhaustifs", () => {
    const cases: [string, string][] = [
      ["0555123456", "+213555123456"],
      ["+213555123456", "+213555123456"],
      ["213555123456", "+213555123456"],
      ["05 55-12 34 56", "+213555123456"],
      ["05.55.12.34.56", "+213555123456"],
      ["(0)555123456", "+213555123456"],
    ];

    for (const [input, expected] of cases) {
      it(`normalise "${input}" → "${expected}"`, () => {
        expect(normalizePhone(input)).toBe(expected);
      });
    }

    it("garde un numero international non-DZ tel quel", () => {
      expect(normalizePhone("+33612345678")).toBe("+33612345678");
    });

    it("gere les entrees vides sans crash", () => {
      expect(typeof normalizePhone("")).toBe("string");
    });
  });
});
