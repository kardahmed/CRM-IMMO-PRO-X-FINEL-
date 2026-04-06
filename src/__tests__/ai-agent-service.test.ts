import { describe, it, expect, vi, beforeEach } from "vitest";

// ============================================================================
// Mocks (vi.hoisted)
// ============================================================================

const {
  mockTenantFindUnique,
  mockAIGenerationCount,
  mockAIGenerationCreate,
  mockActivityLogCreate,
  mockTaskFindFirst,
  mockInteractionFindMany,
  mockAnthropicCreate,
} = vi.hoisted(() => ({
  mockTenantFindUnique: vi.fn(),
  mockAIGenerationCount: vi.fn().mockResolvedValue(0),
  mockAIGenerationCreate: vi.fn().mockResolvedValue({ id: "gen-1" }),
  mockActivityLogCreate: vi.fn().mockResolvedValue({}),
  mockTaskFindFirst: vi.fn(),
  mockInteractionFindMany: vi.fn().mockResolvedValue([]),
  mockAnthropicCreate: vi.fn(),
}));

vi.mock("@/lib/prisma-tenant", () => ({
  createTenantPrisma: vi.fn().mockImplementation(() => ({
    task: { findFirst: mockTaskFindFirst },
    interaction: { findMany: mockInteractionFindMany },
  })),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    tenant: { findUnique: mockTenantFindUnique },
    aIGeneration: { count: mockAIGenerationCount, create: mockAIGenerationCreate },
    activityLog: { create: mockActivityLogCreate },
    $extends: vi.fn(),
  },
}));

vi.mock("@anthropic-ai/sdk", () => {
  // Must be a proper constructor (class)
  class MockAnthropic {
    messages = { create: mockAnthropicCreate };
  }
  return { default: MockAnthropic };
});

vi.mock("@/lib/ai-prompts", () => ({
  buildPrompt: vi.fn().mockReturnValue("Generated prompt text"),
}));

vi.mock("@/lib/auth", () => ({
  auth: vi.fn(),
  currentUser: vi.fn(),
}));

// ============================================================================
// Imports
// ============================================================================

import {
  generateMessage,
  LimitExceededError,
} from "@/services/ai-agent.service";
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
    firstName: "Ali",
    lastName: "Agent",
    email: "ali@test.com",
    isSuperAdmin: false,
    ...overrides,
  };
}

// ============================================================================
// Tests
// ============================================================================

describe("AI Agent Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Set API key for tests
    process.env.ANTHROPIC_API_KEY = "test-key";
  });

  describe("generateMessage — limite mensuelle", () => {
    it("rejette les plans STARTER (limit = 0)", async () => {
      mockTenantFindUnique.mockResolvedValue({ id: "t1", plan: "STARTER" });

      await expect(
        generateMessage(makeUser(), {
          taskId: "task-1",
          channel: "EMAIL",
          language: "FR",
        }),
      ).rejects.toThrow(LimitExceededError);
    });

    it("rejette les plans PRO (limit = 0)", async () => {
      mockTenantFindUnique.mockResolvedValue({ id: "t1", plan: "PRO" });

      await expect(
        generateMessage(makeUser(), {
          taskId: "task-1",
          channel: "EMAIL",
          language: "FR",
        }),
      ).rejects.toThrow(LimitExceededError);
    });

    it("rejette si limite BUSINESS atteinte (500/mois)", async () => {
      mockTenantFindUnique.mockResolvedValue({ id: "t1", plan: "BUSINESS" });
      mockAIGenerationCount.mockResolvedValue(500); // at limit

      await expect(
        generateMessage(makeUser(), {
          taskId: "task-1",
          channel: "EMAIL",
          language: "FR",
        }),
      ).rejects.toThrow(LimitExceededError);
    });

    it("rejette si tenant introuvable", async () => {
      mockTenantFindUnique.mockResolvedValue(null);

      await expect(
        generateMessage(makeUser(), {
          taskId: "task-1",
          channel: "EMAIL",
          language: "FR",
        }),
      ).rejects.toThrow("Tenant introuvable");
    });
  });

  describe("generateMessage — generation", () => {
    it("genere un message avec succes pour plan BUSINESS", async () => {
      mockTenantFindUnique.mockResolvedValue({ id: "t1", plan: "BUSINESS" });
      mockAIGenerationCount.mockResolvedValue(10); // under limit

      mockTaskFindFirst.mockResolvedValue({
        id: "task-1",
        title: "Appeler client",
        type: "CALL",
        notes: "Client interesse",
        client: {
          id: "c1",
          firstName: "Ahmed",
          lastName: "Kard",
          pipelineStage: "QUALIFIED",
          budgetMin: 5000000,
          budgetMax: 10000000,
          desiredType: "APARTMENT",
          desiredWilaya: "Alger",
          desiredRooms: 3,
          desiredSurface: 85,
        },
        property: null,
      });
      mockInteractionFindMany.mockResolvedValue([]);

      mockAnthropicCreate.mockResolvedValue({
        content: [
          { type: "text", text: "Bonjour Ahmed, suite a notre discussion..." },
        ],
      });

      const result = await generateMessage(makeUser(), {
        taskId: "task-1",
        channel: "EMAIL",
        language: "FR",
      });

      expect(result.message).toContain("Bonjour Ahmed");
      expect(result.channel).toBe("EMAIL");
      expect(result.language).toBe("FR");
      expect(result.clientName).toBe("Ahmed Kard");
      expect(result.warning).toContain("valider avant envoi");

      // Should log in AIGeneration
      expect(mockAIGenerationCreate).toHaveBeenCalled();
      // Should log in ActivityLog
      expect(mockActivityLogCreate).toHaveBeenCalledWith({
        data: expect.objectContaining({
          action: "AI_MESSAGE_GENERATED",
        }),
      });
    });

    it("rejette si tache introuvable", async () => {
      mockTenantFindUnique.mockResolvedValue({ id: "t1", plan: "BUSINESS" });
      mockAIGenerationCount.mockResolvedValue(0);
      mockTaskFindFirst.mockResolvedValue(null);

      await expect(
        generateMessage(makeUser(), {
          taskId: "task-inexistant",
          channel: "EMAIL",
          language: "FR",
        }),
      ).rejects.toThrow("Tâche introuvable");
    });

    it("rejette si tache sans client", async () => {
      mockTenantFindUnique.mockResolvedValue({ id: "t1", plan: "BUSINESS" });
      mockAIGenerationCount.mockResolvedValue(0);
      mockTaskFindFirst.mockResolvedValue({
        id: "task-1",
        title: "Tache sans client",
        type: "OTHER",
        client: null,
        property: null,
      });

      await expect(
        generateMessage(makeUser(), {
          taskId: "task-1",
          channel: "EMAIL",
          language: "FR",
        }),
      ).rejects.toThrow("pas liée à un client");
    });

    it("rejette si l'IA ne genere pas de reponse", async () => {
      mockTenantFindUnique.mockResolvedValue({ id: "t1", plan: "BUSINESS" });
      mockAIGenerationCount.mockResolvedValue(0);
      mockTaskFindFirst.mockResolvedValue({
        id: "task-1",
        title: "Appeler",
        type: "CALL",
        notes: null,
        client: {
          id: "c1",
          firstName: "Test",
          lastName: "Client",
          pipelineStage: "NEW",
          budgetMin: null,
          budgetMax: null,
          desiredType: null,
          desiredWilaya: null,
          desiredRooms: null,
          desiredSurface: null,
        },
        property: null,
      });
      mockInteractionFindMany.mockResolvedValue([]);

      mockAnthropicCreate.mockResolvedValue({
        content: [], // empty response
      });

      await expect(
        generateMessage(makeUser(), {
          taskId: "task-1",
          channel: "SMS",
          language: "FR",
        }),
      ).rejects.toThrow("pas généré de réponse");
    });

    it("inclut les interactions recentes dans le contexte", async () => {
      mockTenantFindUnique.mockResolvedValue({ id: "t1", plan: "ENTERPRISE" });
      mockAIGenerationCount.mockResolvedValue(0);
      mockTaskFindFirst.mockResolvedValue({
        id: "task-1",
        title: "Suivi",
        type: "FOLLOW_UP",
        notes: null,
        client: {
          id: "c1",
          firstName: "Ahmed",
          lastName: "K",
          pipelineStage: "CONTACTED",
          budgetMin: null,
          budgetMax: null,
          desiredType: null,
          desiredWilaya: null,
          desiredRooms: null,
          desiredSurface: null,
        },
        property: null,
      });
      mockInteractionFindMany.mockResolvedValue([
        { type: "WHATSAPP", direction: "IN", content: "Info sur le F3?", createdAt: new Date() },
        { type: "WHATSAPP", direction: "OUT", content: "F3 dispo a 12M DA", createdAt: new Date() },
      ]);

      mockAnthropicCreate.mockResolvedValue({
        content: [{ type: "text", text: "Suite a nos echanges WhatsApp..." }],
      });

      const result = await generateMessage(makeUser(), {
        taskId: "task-1",
        channel: "WHATSAPP",
        language: "FR",
      });

      expect(result.message).toContain("Suite a nos echanges");
    });

    it("inclut les infos du bien si present dans la tache", async () => {
      mockTenantFindUnique.mockResolvedValue({ id: "t1", plan: "BUSINESS" });
      mockAIGenerationCount.mockResolvedValue(0);
      mockTaskFindFirst.mockResolvedValue({
        id: "task-1",
        title: "Presentation bien",
        type: "EMAIL",
        notes: null,
        client: {
          id: "c1",
          firstName: "Ahmed",
          lastName: "K",
          pipelineStage: "VISIT_SCHEDULED",
          budgetMin: 8000000,
          budgetMax: 15000000,
          desiredType: "APARTMENT",
          desiredWilaya: "Alger",
          desiredRooms: 3,
          desiredSurface: 85,
        },
        property: {
          id: "p1",
          name: "F3 Les Pins",
          type: "APARTMENT",
          price: 12000000,
          surface: 85,
          rooms: 3,
          status: "AVAILABLE",
          projectId: "proj-1",
          project: { name: "Residence Les Pins" },
        },
      });
      mockInteractionFindMany.mockResolvedValue([]);

      mockAnthropicCreate.mockResolvedValue({
        content: [{ type: "text", text: "Le F3 Les Pins est parfait pour vous" }],
      });

      const result = await generateMessage(makeUser(), {
        taskId: "task-1",
        channel: "EMAIL",
        language: "FR",
      });

      expect(result.message).toContain("F3 Les Pins");
      expect(result.pipelineStage).toBe("VISIT_SCHEDULED");
    });
  });

  describe("LimitExceededError", () => {
    it("est une instance de Error", () => {
      const err = new LimitExceededError("Limite atteinte");
      expect(err).toBeInstanceOf(Error);
      expect(err.name).toBe("LimitExceededError");
      expect(err.message).toBe("Limite atteinte");
    });
  });
});
