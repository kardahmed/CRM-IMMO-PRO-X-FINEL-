import { describe, it, expect, vi, beforeEach } from "vitest";

// ============================================================================
// Mocks (vi.hoisted)
// ============================================================================

const {
  mockConfigFindFirst,
  mockConfigFindMany,
  mockConfigCreate,
  mockConfigUpdate,
  mockActivityLogCreate,
} = vi.hoisted(() => ({
  mockConfigFindFirst: vi.fn(),
  mockConfigFindMany: vi.fn().mockResolvedValue([]),
  mockConfigCreate: vi.fn(),
  mockConfigUpdate: vi.fn(),
  mockActivityLogCreate: vi.fn().mockResolvedValue({}),
}));

vi.mock("@/lib/prisma-tenant", () => ({
  createTenantPrisma: vi.fn().mockImplementation(() => ({
    automationConfig: {
      findFirst: mockConfigFindFirst,
      findMany: mockConfigFindMany,
      create: mockConfigCreate,
      update: mockConfigUpdate,
    },
  })),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    activityLog: { create: mockActivityLogCreate },
    $extends: vi.fn(),
  },
}));

vi.mock("@/lib/auth", () => ({
  auth: vi.fn(),
  currentUser: vi.fn(),
}));

// ============================================================================
// Imports
// ============================================================================

import {
  getAutomationConfigs,
  getAutomationConfigByStage,
  upsertAutomationConfig,
  toggleAutomationConfig,
} from "@/services/automation-config.service";
import type { ICurrentUser } from "@/lib/auth";

// ============================================================================
// Helpers
// ============================================================================

function makeUser(): ICurrentUser {
  return {
    userId: "user-001",
    tenantId: "tenant-001",
    role: "CEO",
    supabaseId: "sb-001",
    firstName: "CEO",
    lastName: "Test",
    email: "ceo@test.com",
  };
}

// ============================================================================
// Tests
// ============================================================================

describe("Automation Config Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getAutomationConfigs", () => {
    it("retourne toutes les configs du tenant", async () => {
      const configs = [
        { id: "c1", pipelineStage: "NEW", isActive: true },
        { id: "c2", pipelineStage: "CONTACTED", isActive: false },
      ];
      mockConfigFindMany.mockResolvedValue(configs);

      const result = await getAutomationConfigs("tenant-001");

      expect(result).toHaveLength(2);
      expect(mockConfigFindMany).toHaveBeenCalledWith({
        orderBy: { pipelineStage: "asc" },
      });
    });
  });

  describe("getAutomationConfigByStage", () => {
    it("retourne la config pour une etape specifique", async () => {
      mockConfigFindFirst.mockResolvedValue({
        id: "c1",
        pipelineStage: "NEW",
        isActive: true,
      });

      const result = await getAutomationConfigByStage("tenant-001", "NEW");

      expect(result).not.toBeNull();
      expect(result!.pipelineStage).toBe("NEW");
    });

    it("retourne null si aucune config", async () => {
      mockConfigFindFirst.mockResolvedValue(null);

      const result = await getAutomationConfigByStage("tenant-001", "CLOSED");

      expect(result).toBeNull();
    });
  });

  describe("upsertAutomationConfig", () => {
    it("cree une nouvelle config si inexistante", async () => {
      mockConfigFindFirst.mockResolvedValue(null); // not existing
      mockConfigCreate.mockResolvedValue({
        id: "new-config",
        pipelineStage: "NEW",
        isActive: true,
        tasks: [],
      });

      const result = await upsertAutomationConfig(makeUser(), {
        pipelineStage: "NEW",
        isActive: true,
        tasks: [{ title: "Appeler", type: "CALL", delayMinutes: 0 }],
      });

      expect(result.id).toBe("new-config");
      expect(mockConfigCreate).toHaveBeenCalled();
      expect(mockActivityLogCreate).toHaveBeenCalledWith({
        data: expect.objectContaining({
          action: "AUTOMATION_CONFIG_CREATED",
        }),
      });
    });

    it("met a jour une config existante", async () => {
      mockConfigFindFirst.mockResolvedValue({
        id: "existing-config",
        pipelineStage: "NEW",
        isActive: true,
      });
      mockConfigUpdate.mockResolvedValue({
        id: "existing-config",
        pipelineStage: "NEW",
        isActive: true,
        tasks: [{ title: "Updated", type: "EMAIL", delayMinutes: 30 }],
      });

      const result = await upsertAutomationConfig(makeUser(), {
        pipelineStage: "NEW",
        tasks: [{ title: "Updated", type: "EMAIL", delayMinutes: 30 }],
      });

      expect(result.id).toBe("existing-config");
      expect(mockConfigUpdate).toHaveBeenCalled();
      expect(mockActivityLogCreate).toHaveBeenCalledWith({
        data: expect.objectContaining({
          action: "AUTOMATION_CONFIG_UPDATED",
        }),
      });
    });
  });

  describe("toggleAutomationConfig", () => {
    it("active une config", async () => {
      mockConfigFindFirst.mockResolvedValue({ id: "c1", isActive: false });
      mockConfigUpdate.mockResolvedValue({ id: "c1", isActive: true });

      const result = await toggleAutomationConfig(makeUser(), "NEW", true);

      expect(result.isActive).toBe(true);
      expect(mockActivityLogCreate).toHaveBeenCalledWith({
        data: expect.objectContaining({
          action: "AUTOMATION_CONFIG_ENABLED",
        }),
      });
    });

    it("desactive une config", async () => {
      mockConfigFindFirst.mockResolvedValue({ id: "c1", isActive: true });
      mockConfigUpdate.mockResolvedValue({ id: "c1", isActive: false });

      const result = await toggleAutomationConfig(makeUser(), "NEW", false);

      expect(result.isActive).toBe(false);
      expect(mockActivityLogCreate).toHaveBeenCalledWith({
        data: expect.objectContaining({
          action: "AUTOMATION_CONFIG_DISABLED",
        }),
      });
    });

    it("echoue si aucune config pour l'etape", async () => {
      mockConfigFindFirst.mockResolvedValue(null);

      await expect(
        toggleAutomationConfig(makeUser(), "CLOSED", true),
      ).rejects.toThrow("Aucune config trouvée");
    });
  });
});
