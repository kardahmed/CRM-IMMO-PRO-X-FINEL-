import { describe, it, expect, vi } from "vitest";

// ============================================================================
// Mocks
// ============================================================================

vi.mock("@/lib/prisma", () => {
  const mockPrisma = {
    $extends: vi.fn().mockImplementation((ext: unknown) => {
      return new Proxy(
        { _extension: ext },
        {
          get(target, prop) {
            if (prop === "_extension")
              return (target as Record<string, unknown>)._extension;
            if (prop === "$extends") return mockPrisma.$extends;
            return createModelProxy(
              prop as string,
              (target as Record<string, unknown>)._extension as {
                query: {
                  $allModels: Record<
                    string,
                    (ctx: {
                      model: string;
                      args: Record<string, unknown>;
                      query: (
                        args: Record<string, unknown>,
                      ) => Promise<unknown>;
                    }) => Promise<unknown>
                  >;
                };
              },
            );
          },
        },
      );
    }),
    activityLog: {
      create: vi.fn().mockResolvedValue({}),
    },
  };

  function createModelProxy(
    modelName: string,
    extension: {
      query: {
        $allModels: Record<
          string,
          (ctx: {
            model: string;
            args: Record<string, unknown>;
            query: (args: Record<string, unknown>) => Promise<unknown>;
          }) => Promise<unknown>
        >;
      };
    },
  ) {
    const capitalizedModel =
      modelName.charAt(0).toUpperCase() + modelName.slice(1);

    return new Proxy(
      {},
      {
        get(_, action) {
          return async (args: Record<string, unknown>) => {
            const handler =
              extension?.query?.$allModels?.[action as string];
            if (!handler) return null;

            return handler({
              model: capitalizedModel,
              args: args || {},
              query: async (finalArgs: Record<string, unknown>) => ({
                _model: capitalizedModel,
                _action: action,
                _args: finalArgs,
              }),
            });
          };
        },
      },
    );
  }

  return { prisma: mockPrisma };
});

vi.mock("@/lib/auth", () => ({
  auth: vi.fn(),
  currentUser: vi.fn(),
}));

// ============================================================================
// Imports (APRÈS les mocks)
// ============================================================================

import { createTenantPrisma } from "@/lib/prisma-tenant";
import { normalizePhone } from "@/services/client-dedup";

// Helper pour extraire les args du résultat mocké
function getArgs(result: unknown): Record<string, unknown> {
  return (result as Record<string, Record<string, unknown>>)._args;
}

// ============================================================================
// Tests : Isolation Tenant via prisma-tenant.ts
// ============================================================================

describe("createTenantPrisma", () => {
  const TENANT_A = "tenant-aaa-111";
  const TENANT_B = "tenant-bbb-222";

  it("injecte tenantId dans findMany", async () => {
    const dbA = createTenantPrisma(TENANT_A);
    const result = await (dbA as unknown as Record<string, Record<string, (...args: unknown[]) => Promise<unknown>>>).client.findMany({});
    const args = getArgs(result);

    expect(args.where).toEqual(
      expect.objectContaining({ tenantId: TENANT_A }),
    );
  });

  it("injecte tenantId dans findFirst", async () => {
    const dbA = createTenantPrisma(TENANT_A);
    const result = await (dbA as unknown as Record<string, Record<string, (...args: unknown[]) => Promise<unknown>>>).client.findFirst({
      where: { id: "some-id" },
    });
    const args = getArgs(result);

    expect(args.where).toEqual(
      expect.objectContaining({ tenantId: TENANT_A, id: "some-id" }),
    );
  });

  it("injecte tenantId dans create (data)", async () => {
    const dbA = createTenantPrisma(TENANT_A);
    const result = await (dbA as unknown as Record<string, Record<string, (...args: unknown[]) => Promise<unknown>>>).client.create({
      data: { firstName: "Test", lastName: "User", phone: "+213555000000" },
    });
    const args = getArgs(result);

    expect(args.data).toEqual(
      expect.objectContaining({ tenantId: TENANT_A, firstName: "Test" }),
    );
  });

  it("injecte tenantId dans update (where)", async () => {
    const dbA = createTenantPrisma(TENANT_A);
    const result = await (dbA as unknown as Record<string, Record<string, (...args: unknown[]) => Promise<unknown>>>).client.update({
      where: { id: "client-1" },
      data: { firstName: "Updated" },
    });
    const args = getArgs(result);

    expect(args.where).toEqual(
      expect.objectContaining({ tenantId: TENANT_A, id: "client-1" }),
    );
  });

  it("injecte tenantId dans delete (where)", async () => {
    const dbA = createTenantPrisma(TENANT_A);
    const result = await (dbA as unknown as Record<string, Record<string, (...args: unknown[]) => Promise<unknown>>>).client.delete({
      where: { id: "client-1" },
    });
    const args = getArgs(result);

    expect(args.where).toEqual(
      expect.objectContaining({ tenantId: TENANT_A, id: "client-1" }),
    );
  });

  it("injecte tenantId dans upsert (where + create)", async () => {
    const dbA = createTenantPrisma(TENANT_A);
    const result = await (dbA as unknown as Record<string, Record<string, (...args: unknown[]) => Promise<unknown>>>).client.upsert({
      where: { id: "client-1" },
      create: { firstName: "New", lastName: "User", phone: "+213555000001" },
      update: { firstName: "Existing" },
    });
    const args = getArgs(result);

    expect(args.where).toEqual(
      expect.objectContaining({ tenantId: TENANT_A }),
    );
    expect(args.create).toEqual(
      expect.objectContaining({ tenantId: TENANT_A }),
    );
  });

  it("injecte tenantId dans createMany (array)", async () => {
    const dbA = createTenantPrisma(TENANT_A);
    const result = await (dbA as unknown as Record<string, Record<string, (...args: unknown[]) => Promise<unknown>>>).client.createMany({
      data: [
        { firstName: "A", lastName: "One", phone: "+213555000001" },
        { firstName: "B", lastName: "Two", phone: "+213555000002" },
      ],
    });
    const args = getArgs(result);

    const data = args.data as Array<Record<string, unknown>>;
    expect(data).toHaveLength(2);
    expect(data[0].tenantId).toBe(TENANT_A);
    expect(data[1].tenantId).toBe(TENANT_A);
  });

  it("Tenant A ne peut PAS lire les données de Tenant B", async () => {
    const dbA = createTenantPrisma(TENANT_A);
    const dbB = createTenantPrisma(TENANT_B);

    const resultA = await (dbA as unknown as Record<string, Record<string, (...args: unknown[]) => Promise<unknown>>>).client.findMany({});
    const resultB = await (dbB as unknown as Record<string, Record<string, (...args: unknown[]) => Promise<unknown>>>).client.findMany({});

    const whereA = getArgs(resultA).where as Record<string, unknown>;
    const whereB = getArgs(resultB).where as Record<string, unknown>;

    expect(whereA.tenantId).toBe(TENANT_A);
    expect(whereB.tenantId).toBe(TENANT_B);
    expect(whereA.tenantId).not.toBe(TENANT_B);
  });

  it("Tenant A ne peut PAS modifier les données de Tenant B", async () => {
    const dbA = createTenantPrisma(TENANT_A);

    const result = await (dbA as unknown as Record<string, Record<string, (...args: unknown[]) => Promise<unknown>>>).client.update({
      where: { id: "client-from-b" },
      data: { firstName: "Hacked" },
    });

    const where = getArgs(result).where as Record<string, unknown>;
    expect(where.tenantId).toBe(TENANT_A);
    expect(where.tenantId).not.toBe(TENANT_B);
  });

  it("n'injecte PAS tenantId sur le modèle Tenant", async () => {
    const dbA = createTenantPrisma(TENANT_A);
    const result = await (dbA as unknown as Record<string, Record<string, (...args: unknown[]) => Promise<unknown>>>).tenant.findMany({});
    const args = getArgs(result);

    // Le modèle Tenant est exclu : where ne contient pas tenantId
    const where = (args.where ?? {}) as Record<string, unknown>;
    expect(where).not.toHaveProperty("tenantId");
  });

  it("refuse un tenantId vide", () => {
    expect(() => createTenantPrisma("")).toThrow("tenantId est requis");
  });

  it("refuse un tenantId null/undefined", () => {
    expect(() => createTenantPrisma(null as unknown as string)).toThrow(
      "tenantId est requis",
    );
    expect(() => createTenantPrisma(undefined as unknown as string)).toThrow(
      "tenantId est requis",
    );
  });
});

// ============================================================================
// Tests : Normalisation téléphone
// ============================================================================

describe("normalizePhone", () => {
  it("supprime espaces et tirets", () => {
    expect(normalizePhone("05 55 12 34 56")).toBe("+213555123456");
  });

  it("convertit un numéro local algérien en international", () => {
    expect(normalizePhone("0555123456")).toBe("+213555123456");
  });

  it("ajoute + si indicatif sans +", () => {
    expect(normalizePhone("213555123456")).toBe("+213555123456");
  });

  it("garde un numéro déjà formaté", () => {
    expect(normalizePhone("+213555123456")).toBe("+213555123456");
  });

  it("supprime parenthèses et points", () => {
    expect(normalizePhone("(0)5.55.12.34.56")).toBe("+213555123456");
  });
});

// ============================================================================
// Tests : Agent Isolation (logique de rôle)
// ============================================================================

describe("Agent Isolation Logic", () => {
  it("un AGENT ne peut pas réassigner de client", async () => {
    const { reassignClient } = await import("@/lib/agent-isolation");

    const agentUser = {
      userId: "agent-1",
      tenantId: "tenant-1",
      role: "AGENT" as const,
      supabaseId: "sb-1",
      firstName: "Agent",
      lastName: "Test",
      email: "agent@test.com",
    };

    await expect(
      reassignClient(agentUser, "client-1", "agent-2"),
    ).rejects.toThrow("seuls CEO, ADMIN et SUPERVISOR");
  });

  it("un ASSISTANT ne peut pas réassigner de client", async () => {
    const { reassignClient } = await import("@/lib/agent-isolation");

    const assistantUser = {
      userId: "assistant-1",
      tenantId: "tenant-1",
      role: "ASSISTANT" as const,
      supabaseId: "sb-2",
      firstName: "Assistant",
      lastName: "Test",
      email: "assistant@test.com",
    };

    await expect(
      reassignClient(assistantUser, "client-1", "agent-2"),
    ).rejects.toThrow("seuls CEO, ADMIN et SUPERVISOR");
  });

  it("un ASSISTANT ne peut pas modifier de client", async () => {
    const { canModifyClient } = await import("@/lib/agent-isolation");

    const assistantUser = {
      userId: "assistant-1",
      tenantId: "tenant-1",
      role: "ASSISTANT" as const,
      supabaseId: "sb-2",
      firstName: "Assistant",
      lastName: "Test",
      email: "assistant@test.com",
    };

    expect(canModifyClient(assistantUser)).toBe(false);
  });

  it("un CEO peut modifier un client", async () => {
    const { canModifyClient } = await import("@/lib/agent-isolation");

    const ceoUser = {
      userId: "ceo-1",
      tenantId: "tenant-1",
      role: "CEO" as const,
      supabaseId: "sb-3",
      firstName: "CEO",
      lastName: "Test",
      email: "ceo@test.com",
    };

    expect(canModifyClient(ceoUser)).toBe(true);
  });
});
