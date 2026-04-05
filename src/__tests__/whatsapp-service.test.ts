import { describe, it, expect, vi, beforeEach } from "vitest";

// ============================================================================
// Mocks (vi.hoisted)
// ============================================================================

const {
  mockTenantFindUnique,
  mockClientFindFirst,
  mockUserFindMany,
  mockUserFindFirst,
  mockInteractionCreate,
  mockActivityLogCreate,
  mockNotificationCreate,
  mockNotificationBulk,
} = vi.hoisted(() => ({
  mockTenantFindUnique: vi.fn(),
  mockClientFindFirst: vi.fn(),
  mockUserFindMany: vi.fn().mockResolvedValue([]),
  mockUserFindFirst: vi.fn(),
  mockInteractionCreate: vi.fn().mockResolvedValue({ id: "int-1" }),
  mockActivityLogCreate: vi.fn().mockResolvedValue({}),
  mockNotificationCreate: vi.fn().mockResolvedValue("notif-id"),
  mockNotificationBulk: vi.fn().mockResolvedValue(0),
}));

vi.mock("@/services/notification.service", () => ({
  createNotification: (...args: unknown[]) => mockNotificationCreate(...args),
  createNotificationBulk: (...args: unknown[]) => mockNotificationBulk(...args),
}));

vi.mock("@/lib/prisma-tenant", () => ({
  createTenantPrisma: vi.fn().mockImplementation(() => ({
    client: { findFirst: mockClientFindFirst },
    user: {
      findMany: mockUserFindMany,
      findFirst: mockUserFindFirst,
    },
  })),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    tenant: { findUnique: mockTenantFindUnique },
    interaction: { create: mockInteractionCreate },
    activityLog: { create: mockActivityLogCreate },
    $extends: vi.fn(),
  },
}));

vi.mock("@/lib/auth", () => ({
  auth: vi.fn(),
  currentUser: vi.fn(),
}));

// Mock fetch
const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

// ============================================================================
// Imports
// ============================================================================

import {
  getWhatsAppConfig,
  sendMessage,
  receiveMessage,
} from "@/services/whatsapp.service";

// ============================================================================
// Tests
// ============================================================================

describe("WhatsApp Service", () => {
  const TENANT_ID = "tenant-wa-001";

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // -----------------------------------------------------------------------
  // getWhatsAppConfig
  // -----------------------------------------------------------------------
  describe("getWhatsAppConfig", () => {
    it("retourne la config si tenant et settings existent", async () => {
      mockTenantFindUnique.mockResolvedValue({
        id: TENANT_ID,
        settings: {
          whatsapp: {
            whatsappApiKey: "key-123",
            whatsappPhoneId: "phone-123",
          },
        },
      });

      const config = await getWhatsAppConfig(TENANT_ID);

      expect(config).not.toBeNull();
      expect(config!.whatsappApiKey).toBe("key-123");
      expect(config!.whatsappPhoneId).toBe("phone-123");
    });

    it("retourne null si tenant inexistant", async () => {
      mockTenantFindUnique.mockResolvedValue(null);

      const config = await getWhatsAppConfig(TENANT_ID);

      expect(config).toBeNull();
    });

    it("retourne null si apiKey manquante", async () => {
      mockTenantFindUnique.mockResolvedValue({
        id: TENANT_ID,
        settings: { whatsapp: { whatsappPhoneId: "phone-123" } },
      });

      const config = await getWhatsAppConfig(TENANT_ID);

      expect(config).toBeNull();
    });

    it("retourne null si phoneId manquant", async () => {
      mockTenantFindUnique.mockResolvedValue({
        id: TENANT_ID,
        settings: { whatsapp: { whatsappApiKey: "key-123" } },
      });

      const config = await getWhatsAppConfig(TENANT_ID);

      expect(config).toBeNull();
    });
  });

  // -----------------------------------------------------------------------
  // sendMessage
  // -----------------------------------------------------------------------
  describe("sendMessage", () => {
    it("retourne erreur si WhatsApp non configure", async () => {
      mockTenantFindUnique.mockResolvedValue(null);

      const result = await sendMessage({
        tenantId: TENANT_ID,
        phone: "+213555111111",
        message: "Hello",
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain("non configuré");
    });

    it("envoie un message avec succes via l'API Meta", async () => {
      mockTenantFindUnique.mockResolvedValue({
        id: TENANT_ID,
        settings: {
          whatsapp: {
            whatsappApiKey: "key-123",
            whatsappPhoneId: "phone-123",
          },
        },
      });

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ messages: [{ id: "wamid.123" }] }),
      });

      const result = await sendMessage({
        tenantId: TENANT_ID,
        phone: "+213555111111",
        message: "Bonjour, votre visite est confirmee",
      });

      expect(result.success).toBe(true);
      expect(result.messageId).toBe("wamid.123");

      // Verify fetch was called with correct params
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("graph.facebook.com"),
        expect.objectContaining({
          method: "POST",
          headers: expect.objectContaining({
            Authorization: "Bearer key-123",
          }),
        }),
      );
    });

    it("gere une erreur API Meta", async () => {
      mockTenantFindUnique.mockResolvedValue({
        id: TENANT_ID,
        settings: {
          whatsapp: {
            whatsappApiKey: "key-123",
            whatsappPhoneId: "phone-123",
          },
        },
      });

      mockFetch.mockResolvedValue({
        ok: false,
        statusText: "Bad Request",
        json: async () => ({ error: { message: "Invalid phone number" } }),
      });

      const result = await sendMessage({
        tenantId: TENANT_ID,
        phone: "+213555111111",
        message: "Hello",
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain("Invalid phone number");
    });

    it("gere une erreur reseau (fetch throw)", async () => {
      mockTenantFindUnique.mockResolvedValue({
        id: TENANT_ID,
        settings: {
          whatsapp: {
            whatsappApiKey: "key-123",
            whatsappPhoneId: "phone-123",
          },
        },
      });

      mockFetch.mockRejectedValue(new Error("Network timeout"));

      const result = await sendMessage({
        tenantId: TENANT_ID,
        phone: "+213555111111",
        message: "Hello",
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain("Network timeout");
    });
  });

  // -----------------------------------------------------------------------
  // receiveMessage
  // -----------------------------------------------------------------------
  describe("receiveMessage", () => {
    it("route vers l'agent assigne quand client connu", async () => {
      mockClientFindFirst.mockResolvedValue({
        id: "client-001",
        firstName: "Ahmed",
        lastName: "Kard",
        assignedAgentId: "agent-001",
      });

      const result = await receiveMessage(TENANT_ID, {
        from: "+213555111111",
        body: "Je suis interesse par le F3",
        messageId: "msg-001",
        timestamp: Date.now(),
      });

      expect(result.clientId).toBe("client-001");
      expect(result.routedToAgentId).toBe("agent-001");
      expect(result.isNewContact).toBe(false);
    });

    it("cree une interaction WHATSAPP IN", async () => {
      mockClientFindFirst.mockResolvedValue({
        id: "client-001",
        firstName: "Ahmed",
        lastName: "Kard",
        assignedAgentId: "agent-001",
      });

      await receiveMessage(TENANT_ID, {
        from: "+213555111111",
        body: "Bonjour",
        messageId: "msg-001",
        timestamp: Date.now(),
      });

      expect(mockInteractionCreate).toHaveBeenCalledWith({
        data: expect.objectContaining({
          type: "WHATSAPP",
          direction: "IN",
          clientId: "client-001",
          userId: "agent-001",
        }),
      });
    });

    it("contact inconnu = isNewContact true, notifie superviseurs", async () => {
      mockClientFindFirst.mockResolvedValue(null);
      mockUserFindMany.mockResolvedValue([
        { id: "sup-001" },
        { id: "ceo-001" },
      ]);

      const result = await receiveMessage(TENANT_ID, {
        from: "+213555999999",
        body: "Qui etes vous?",
        messageId: "msg-002",
        timestamp: Date.now(),
      });

      expect(result.isNewContact).toBe(true);
      expect(result.clientId).toBeNull();
      expect(result.routedToAgentId).toBeNull();

      expect(mockNotificationBulk).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ type: "WHATSAPP_UNKNOWN" }),
        ]),
      );
    });

    it("client sans agent assigne cherche un superviseur", async () => {
      mockClientFindFirst.mockResolvedValue({
        id: "client-002",
        firstName: "Fatima",
        lastName: "Ben",
        assignedAgentId: null,
      });
      mockUserFindFirst.mockResolvedValue({ id: "sup-001" });

      const result = await receiveMessage(TENANT_ID, {
        from: "+213555222222",
        body: "Info",
        messageId: "msg-003",
        timestamp: Date.now(),
      });

      expect(result.routedToAgentId).toBeNull();
      // Interaction created with supervisor as userId
      expect(mockInteractionCreate).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: "sup-001",
        }),
      });
    });
  });
});
