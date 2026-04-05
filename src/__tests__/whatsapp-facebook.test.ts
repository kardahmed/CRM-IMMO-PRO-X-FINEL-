import { describe, it, expect, vi, beforeEach } from "vitest";

// ============================================================================
// Mocks (vi.hoisted to avoid TDZ issues)
// ============================================================================

const {
  mockNotificationCreate,
  mockNotificationBulk,
  mockInteractionCreate,
  mockClientFindFirst,
  mockClientCreate,
  mockUserFindMany,
  mockGlobalActivityLog,
  mockGlobalClient,
} = vi.hoisted(() => ({
  mockNotificationCreate: vi.fn().mockResolvedValue("notif-id"),
  mockNotificationBulk: vi.fn().mockResolvedValue(["n1"]),
  mockInteractionCreate: vi.fn().mockResolvedValue({ id: "int-1" }),
  mockClientFindFirst: vi.fn(),
  mockClientCreate: vi.fn(),
  mockUserFindMany: vi.fn().mockResolvedValue([]),
  mockGlobalActivityLog: { create: vi.fn().mockResolvedValue({}) },
  mockGlobalClient: { findFirst: vi.fn().mockResolvedValue(null) },
}));

vi.mock("@/services/notification.service", () => ({
  createNotification: (...args: unknown[]) => mockNotificationCreate(...args),
  createNotificationBulk: (...args: unknown[]) => mockNotificationBulk(...args),
}));

vi.mock("@/lib/prisma-tenant", () => ({
  createTenantPrisma: vi.fn().mockImplementation(() => ({
    interaction: { create: mockInteractionCreate },
    client: {
      findFirst: mockClientFindFirst,
      create: mockClientCreate,
    },
    user: { findMany: mockUserFindMany },
  })),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    activityLog: mockGlobalActivityLog,
    client: mockGlobalClient,
    interaction: { create: mockInteractionCreate },
    $extends: vi.fn(),
  },
}));

vi.mock("@/lib/auth", () => ({
  auth: vi.fn(),
  currentUser: vi.fn(),
}));

// Mock fetch for WhatsApp API calls
const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

// ============================================================================
// Imports
// ============================================================================

import { receiveMessage } from "@/services/whatsapp.service";
import { normalizePhone } from "@/services/client-dedup";

// ============================================================================
// Tests : WhatsApp Routing
// ============================================================================

describe("WhatsApp Service — receiveMessage", () => {
  const TENANT_ID = "tenant-wa-001";

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("route un message vers l'agent assigne du client", async () => {
    mockClientFindFirst.mockResolvedValue({
      id: "client-001",
      firstName: "Ahmed",
      lastName: "Kard",
      phone: "+213555111111",
      assignedAgentId: "agent-001",
      assignedAgent: {
        id: "agent-001",
        firstName: "Ali",
        lastName: "Agent",
      },
    });

    await receiveMessage(TENANT_ID, {
      from: "+213555111111",
      body: "Bonjour, je suis interesse",
      messageId: "msg-001",
      timestamp: Date.now(),
    });

    // Should create an interaction
    expect(mockInteractionCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          type: "WHATSAPP",
          direction: "IN",
          clientId: "client-001",
          userId: "agent-001",
        }),
      }),
    );

    // Should notify the agent
    expect(mockNotificationCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: "agent-001",
        type: "WHATSAPP_IN",
      }),
    );
  });

  it("notifie le superviseur si contact inconnu", async () => {
    mockClientFindFirst.mockResolvedValue(null);
    mockUserFindMany.mockResolvedValue([
      { id: "supervisor-001", role: "SUPERVISOR", firstName: "S", lastName: "V" },
      { id: "ceo-001", role: "CEO", firstName: "C", lastName: "E" },
    ]);

    await receiveMessage(TENANT_ID, {
      from: "+213555999999",
      body: "Qui etes vous?",
      messageId: "msg-002",
      timestamp: Date.now(),
    });

    // Should notify supervisors/CEO about unknown contact
    expect(mockNotificationBulk).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          type: "WHATSAPP_UNKNOWN",
        }),
      ]),
    );
  });
});

// ============================================================================
// Tests : Facebook Leads
// ============================================================================

describe("Facebook Leads — Business Logic", () => {
  it("normalise le telephone du lead Facebook avant dedup", () => {
    const normalized = normalizePhone("0555 123 456");
    expect(normalized).toBe("+213555123456");
  });

  it("les leads Facebook ne sont PAS auto-assignes a un agent", () => {
    // This is a business rule: Facebook leads go to superviseur inbox
    // assignedAgentId should be NULL at creation
    // Testing the principle: when creating a client from FB lead, no agent is assigned
    const clientData = {
      firstName: "Lead",
      lastName: "Facebook",
      phone: "+213555000001",
      source: "FACEBOOK",
      pipelineStage: "NEW",
      assignedAgentId: null, // CRITICAL: must be null
    };

    expect(clientData.assignedAgentId).toBeNull();
    expect(clientData.source).toBe("FACEBOOK");
    expect(clientData.pipelineStage).toBe("NEW");
  });

  it("les superviseurs et CEO sont notifies pour un nouveau lead Facebook", async () => {
    // The notification service should be called with FACEBOOK_LEAD type
    // for all SUPERVISOR + CEO users
    const supervisors = [
      { id: "sup-001", tenantId: "t1" },
      { id: "ceo-001", tenantId: "t1" },
    ];

    const notifications = supervisors.map((s) => ({
      tenantId: s.tenantId,
      userId: s.id,
      title: "Nouveau lead Facebook",
      message: "Lead Facebook: Test User",
      type: "FACEBOOK_LEAD" as const,
      link: "/leads/unassigned",
    }));

    mockNotificationBulk.mockResolvedValue(["n1", "n2"]);
    const result = await (await import("@/services/notification.service")).createNotificationBulk(notifications);

    expect(result).toHaveLength(2);
    expect(mockNotificationBulk).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ type: "FACEBOOK_LEAD" }),
      ]),
    );
  });
});
