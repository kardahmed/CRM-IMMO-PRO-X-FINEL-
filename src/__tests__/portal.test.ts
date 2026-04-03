import { describe, it, expect, vi, beforeEach } from "vitest";

// ============================================================================
// Mocks
// ============================================================================

const mockClientFindUnique = vi.fn();
const mockPaymentFindFirst = vi.fn();
const mockTaskFindFirst = vi.fn();
const mockPropertyFindUnique = vi.fn();

vi.mock("@/lib/prisma", () => ({
  prisma: {
    client: {
      findUnique: (...args: unknown[]) => mockClientFindUnique(...args),
    },
    payment: {
      findFirst: (...args: unknown[]) => mockPaymentFindFirst(...args),
    },
    task: {
      findFirst: (...args: unknown[]) => mockTaskFindFirst(...args),
    },
    property: {
      findUnique: (...args: unknown[]) => mockPropertyFindUnique(...args),
    },
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

import { GET } from "@/app/api/v1/portal/[token]/route";
import { NextRequest } from "next/server";

// ============================================================================
// Helpers
// ============================================================================

function createPortalRequest(token: string): [NextRequest, { params: Promise<{ token: string }> }] {
  const req = new NextRequest(`http://localhost:3000/api/v1/portal/${token}`);
  return [req, { params: Promise.resolve({ token }) }];
}

async function extractJson(response: Response): Promise<Record<string, unknown>> {
  return response.json() as Promise<Record<string, unknown>>;
}

// ============================================================================
// Tests
// ============================================================================

describe("Portal API — GET /api/v1/portal/[token]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("retourne 400 pour un token trop court", async () => {
    const [req, ctx] = createPortalRequest("abc");
    const res = await GET(req, ctx);
    const body = await extractJson(res);

    expect(res.status).toBe(400);
    expect(body.error).toContain("Token invalide");
  });

  it("retourne 404 si token introuvable", async () => {
    mockClientFindUnique.mockResolvedValue(null);

    const token = "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee";
    const [req, ctx] = createPortalRequest(token);
    const res = await GET(req, ctx);
    const body = await extractJson(res);

    expect(res.status).toBe(404);
    expect(body.error).toContain("introuvable");
  });

  it("retourne les donnees du client pour un token valide", async () => {
    const token = "valid-portal-token-uuid-1234567890";

    mockClientFindUnique.mockResolvedValue({
      id: "client-001",
      firstName: "Ahmed",
      lastName: "Kard",
      pipelineStage: "RESERVED",
      assignedAgent: {
        firstName: "Ali",
        lastName: "Agent",
        phone: "+213555111111",
        email: "ali@agency.dz",
      },
      payments: [
        {
          id: "pay-1",
          type: "RESERVATION",
          amount: 500000,
          status: "COMPLETED",
          createdAt: new Date("2026-01-15"),
        },
        {
          id: "pay-2",
          type: "INSTALLMENT",
          amount: 2000000,
          status: "PENDING",
          createdAt: new Date("2026-03-01"),
        },
      ],
    });

    mockPaymentFindFirst.mockResolvedValue({ propertyId: "prop-001" });

    mockPropertyFindUnique.mockResolvedValue({
      id: "prop-001",
      name: "F3 Résidence Les Pins",
      type: "APARTMENT",
      floor: 3,
      rooms: 3,
      surface: 85,
      price: 12000000,
      status: "RESERVED",
      images: ["https://example.com/img1.jpg"],
      plans: [],
      documents: [],
      project: {
        id: "proj-001",
        name: "Résidence Les Pins",
        address: "Bab Ezzouar",
        wilaya: "Alger",
        deliveryDate: new Date("2027-06-01"),
        progressPercentage: 45,
        status: "IN_PROGRESS",
      },
    });

    const [req, ctx] = createPortalRequest(token);
    const res = await GET(req, ctx);
    const body = await extractJson(res);

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);

    const data = body.data as Record<string, unknown>;

    // Client
    expect(data.client).toEqual({
      firstName: "Ahmed",
      lastName: "Kard",
      pipelineStage: "RESERVED",
    });

    // Property
    const property = data.property as Record<string, unknown>;
    expect(property.name).toBe("F3 Résidence Les Pins");
    expect(property.price).toBe(12000000);

    // Project with progress
    const project = data.project as Record<string, unknown>;
    expect(project.name).toBe("Résidence Les Pins");
    expect(project.progressPercentage).toBe(45);

    // Payments
    const payments = data.payments as Record<string, unknown>;
    expect(payments.totalAmount).toBe(2500000);
    expect(payments.paidAmount).toBe(500000);
    expect(payments.progressPercent).toBe(20);

    // Agent contact
    const agent = data.agent as Record<string, unknown>;
    expect(agent.name).toBe("Ali Agent");
    expect(agent.phone).toBe("+213555111111");
  });

  it("gere un client sans bien associe", async () => {
    const token = "valid-portal-token-no-property-12345";

    mockClientFindUnique.mockResolvedValue({
      id: "client-002",
      firstName: "Fatima",
      lastName: "Bens",
      pipelineStage: "RESERVED",
      assignedAgent: null,
      payments: [],
    });

    mockPaymentFindFirst.mockResolvedValue(null);
    mockTaskFindFirst.mockResolvedValue(null);

    const [req, ctx] = createPortalRequest(token);
    const res = await GET(req, ctx);
    const body = await extractJson(res);

    expect(res.status).toBe(200);
    const data = body.data as Record<string, unknown>;
    expect(data.property).toBeNull();
    expect(data.project).toBeNull();
    expect(data.agent).toBeNull();
  });

  it("calcule correctement le pourcentage de paiement", async () => {
    const token = "valid-portal-token-payment-calc-123";

    mockClientFindUnique.mockResolvedValue({
      id: "client-003",
      firstName: "X",
      lastName: "Y",
      pipelineStage: "SIGNED",
      assignedAgent: null,
      payments: [
        { id: "p1", type: "RESERVATION", amount: 1000000, status: "COMPLETED", createdAt: new Date() },
        { id: "p2", type: "INSTALLMENT", amount: 3000000, status: "COMPLETED", createdAt: new Date() },
        { id: "p3", type: "FINAL", amount: 6000000, status: "PENDING", createdAt: new Date() },
      ],
    });

    mockPaymentFindFirst.mockResolvedValue(null);
    mockTaskFindFirst.mockResolvedValue(null);

    const [req, ctx] = createPortalRequest(token);
    const res = await GET(req, ctx);
    const body = await extractJson(res);

    const payments = (body.data as Record<string, unknown>).payments as Record<string, unknown>;
    expect(payments.totalAmount).toBe(10000000); // 1M + 3M + 6M
    expect(payments.paidAmount).toBe(4000000);   // 1M + 3M
    expect(payments.progressPercent).toBe(40);    // 4/10 = 40%
  });
});
