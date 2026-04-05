import { describe, it, expect, vi, beforeEach } from "vitest";

// ============================================================================
// Mocks
// ============================================================================

const mockClientFindFirst = vi.fn();
const mockClientFindMany = vi.fn();

vi.mock("@/lib/prisma-tenant", () => ({
  createTenantPrisma: vi.fn().mockImplementation(() => ({
    client: {
      findFirst: (...args: unknown[]) => mockClientFindFirst(...args),
      findMany: (...args: unknown[]) => mockClientFindMany(...args),
    },
  })),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: { $extends: vi.fn() },
}));

vi.mock("@/lib/auth", () => ({
  auth: vi.fn(),
  currentUser: vi.fn(),
}));

// ============================================================================
// Imports
// ============================================================================

import { checkDuplicates, normalizePhone } from "@/services/client-dedup";

// ============================================================================
// Tests : Normalisation téléphone
// ============================================================================

describe("normalizePhone", () => {
  it("normalise un numero algerien sans prefixe", () => {
    expect(normalizePhone("0555123456")).toBe("+213555123456");
  });

  it("normalise un numero avec +213", () => {
    expect(normalizePhone("+213555123456")).toBe("+213555123456");
  });

  it("normalise un numero avec 213 sans +", () => {
    expect(normalizePhone("213555123456")).toBe("+213555123456");
  });

  it("supprime les espaces et tirets", () => {
    expect(normalizePhone("05 55-12 34 56")).toBe("+213555123456");
  });

  it("gere les numeros avec points", () => {
    expect(normalizePhone("05.55.12.34.56")).toBe("+213555123456");
  });

  it("retourne le numero tel quel si format international non-DZ", () => {
    const result = normalizePhone("+33612345678");
    expect(result).toBe("+33612345678");
  });

  it("gere les numeros courts (< 10 chiffres)", () => {
    // Should still return something, not crash
    const result = normalizePhone("12345");
    expect(typeof result).toBe("string");
  });

  it("gere les numeros vides", () => {
    const result = normalizePhone("");
    expect(typeof result).toBe("string");
  });
});

// ============================================================================
// Tests : Detection doublons
// ============================================================================

describe("checkDuplicates", () => {
  const TENANT_ID = "tenant-dedup-001";

  const makeInput = (phone: string) => ({
    phone,
    firstName: "Test",
    lastName: "User",
    email: null,
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("retourne canCreate=true si pas de doublon", async () => {
    mockClientFindFirst.mockResolvedValue(null);

    const result = await checkDuplicates(TENANT_ID, makeInput("+213555000001"));

    expect(result.canCreate).toBe(true);
    expect(result.duplicates).toHaveLength(0);
  });

  it("retourne canCreate=false avec details si telephone existe", async () => {
    // 1st call: phone match
    mockClientFindFirst.mockResolvedValueOnce({
      id: "existing-client",
      firstName: "Ahmed",
      lastName: "Kard",
      phone: "+213555000001",
      pipelineStage: "NEGOTIATION",
      assignedAgent: { firstName: "Ali", lastName: "Agent" },
      interactions: [{ createdAt: new Date("2026-03-01") }],
    });
    // 2nd call: name match (none)
    mockClientFindFirst.mockResolvedValueOnce(null);

    const result = await checkDuplicates(TENANT_ID, makeInput("+213555000001"));

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

  it("normalise le telephone avant recherche", async () => {
    mockClientFindFirst.mockResolvedValue(null);

    await checkDuplicates(TENANT_ID, makeInput("0555 000 001"));

    // First call should use normalized phone
    expect(mockClientFindFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          phone: "+213555000001",
        }),
      }),
    );
  });

  it("le meme telephone PEUT exister dans des tenants differents", async () => {
    // Tenant A: phone match found
    mockClientFindFirst.mockResolvedValueOnce({
      id: "client-a",
      firstName: "X",
      lastName: "Y",
      phone: "+213555111111",
      pipelineStage: "NEW",
      assignedAgent: null,
      interactions: [],
    });
    // Tenant A: name match (none)
    mockClientFindFirst.mockResolvedValueOnce(null);

    const resultA = await checkDuplicates("tenant-A", makeInput("+213555111111"));
    expect(resultA.canCreate).toBe(false);

    // Tenant B: no match (different tenant scope via createTenantPrisma)
    mockClientFindFirst.mockResolvedValueOnce(null);
    // name match (none)
    mockClientFindFirst.mockResolvedValueOnce(null);

    const resultB = await checkDuplicates("tenant-B", makeInput("+213555111111"));
    expect(resultB.canCreate).toBe(true);
  });
});
