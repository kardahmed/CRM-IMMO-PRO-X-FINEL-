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
    notification: {
      createMany: vi.fn().mockResolvedValue({ count: 0 }),
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

vi.mock("@clerk/nextjs/server", () => ({
  auth: vi.fn(),
  currentUser: vi.fn(),
}));

// ============================================================================
// Imports
// ============================================================================

import { canDo } from "@/lib/check-permission";
import {
  hasPermission,
  getAllowedActions,
} from "@/lib/permissions-matrix";
import type { ICurrentUser } from "@/lib/auth";
import { reassignClient } from "@/services/client.service";

// ============================================================================
// Helpers
// ============================================================================

function makeUser(overrides: Partial<ICurrentUser> = {}): ICurrentUser {
  return {
    userId: "user-1",
    tenantId: "tenant-1",
    role: "AGENT",
    clerkId: "clerk-1",
    firstName: "Test",
    lastName: "User",
    email: "test@test.com",
    ...overrides,
  };
}

// ============================================================================
// Tests : Matrice de permissions
// ============================================================================

describe("Permissions Matrix", () => {
  describe("CEO", () => {
    it("a toutes les permissions sur CLIENTS", () => {
      expect(hasPermission("CEO", "CLIENTS", "CREATE")).toBe(true);
      expect(hasPermission("CEO", "CLIENTS", "READ")).toBe(true);
      expect(hasPermission("CEO", "CLIENTS", "READ_ALL")).toBe(true);
      expect(hasPermission("CEO", "CLIENTS", "UPDATE")).toBe(true);
      expect(hasPermission("CEO", "CLIENTS", "DELETE")).toBe(true);
      expect(hasPermission("CEO", "CLIENTS", "ASSIGN")).toBe(true);
      expect(hasPermission("CEO", "CLIENTS", "EXPORT")).toBe(true);
    });

    it("a toutes les permissions sur SETTINGS", () => {
      expect(hasPermission("CEO", "SETTINGS", "UPDATE")).toBe(true);
    });
  });

  describe("SUPERVISOR", () => {
    it("peut lire tous les clients", () => {
      expect(hasPermission("SUPERVISOR", "CLIENTS", "READ_ALL")).toBe(true);
    });

    it("peut assigner des clients", () => {
      expect(hasPermission("SUPERVISOR", "CLIENTS", "ASSIGN")).toBe(true);
    });

    it("ne peut pas supprimer", () => {
      expect(hasPermission("SUPERVISOR", "CLIENTS", "DELETE")).toBe(false);
    });

    it("ne peut pas modifier les SETTINGS", () => {
      expect(hasPermission("SUPERVISOR", "SETTINGS", "UPDATE")).toBe(false);
    });
  });

  describe("AGENT", () => {
    it("peut créer et lire ses propres clients", () => {
      expect(hasPermission("AGENT", "CLIENTS", "CREATE")).toBe(true);
      expect(hasPermission("AGENT", "CLIENTS", "READ")).toBe(true);
      expect(hasPermission("AGENT", "CLIENTS", "UPDATE")).toBe(true);
    });

    it("ne peut PAS lire tous les clients (READ_ALL)", () => {
      expect(hasPermission("AGENT", "CLIENTS", "READ_ALL")).toBe(false);
    });

    it("ne peut PAS assigner de clients", () => {
      expect(hasPermission("AGENT", "CLIENTS", "ASSIGN")).toBe(false);
    });

    it("ne peut PAS supprimer", () => {
      expect(hasPermission("AGENT", "CLIENTS", "DELETE")).toBe(false);
    });

    it("ne peut PAS exporter", () => {
      expect(hasPermission("AGENT", "CLIENTS", "EXPORT")).toBe(false);
    });

    it("ne peut PAS accéder aux SETTINGS", () => {
      expect(hasPermission("AGENT", "SETTINGS", "READ")).toBe(false);
    });

    it("ne peut PAS accéder au AUDIT_LOG", () => {
      expect(hasPermission("AGENT", "AUDIT_LOG", "READ")).toBe(false);
    });
  });

  describe("ASSISTANT", () => {
    it("peut lire tous les clients (READ_ALL) mais pas créer", () => {
      expect(hasPermission("ASSISTANT", "CLIENTS", "READ")).toBe(true);
      expect(hasPermission("ASSISTANT", "CLIENTS", "READ_ALL")).toBe(true);
      expect(hasPermission("ASSISTANT", "CLIENTS", "CREATE")).toBe(false);
      expect(hasPermission("ASSISTANT", "CLIENTS", "UPDATE")).toBe(false);
    });

    it("ne peut PAS accéder aux SETTINGS", () => {
      expect(hasPermission("ASSISTANT", "SETTINGS", "READ")).toBe(false);
    });
  });
});

// ============================================================================
// Tests : canDo helper
// ============================================================================

describe("canDo", () => {
  it("CEO peut CREATE CLIENTS", () => {
    expect(canDo("CEO", "CLIENTS", "CREATE")).toBe(true);
  });

  it("AGENT ne peut pas ASSIGN CLIENTS", () => {
    expect(canDo("AGENT", "CLIENTS", "ASSIGN")).toBe(false);
  });

  it("ASSISTANT ne peut pas DELETE", () => {
    expect(canDo("ASSISTANT", "CLIENTS", "DELETE")).toBe(false);
  });
});

// ============================================================================
// Tests : getAllowedActions
// ============================================================================

describe("getAllowedActions", () => {
  it("AGENT sur CLIENTS retourne CREATE, READ, UPDATE", () => {
    const actions = getAllowedActions("AGENT", "CLIENTS");
    expect(actions).toContain("CREATE");
    expect(actions).toContain("READ");
    expect(actions).toContain("UPDATE");
    expect(actions).not.toContain("READ_ALL");
    expect(actions).not.toContain("ASSIGN");
    expect(actions).not.toContain("DELETE");
    expect(actions).not.toContain("EXPORT");
  });
});

// ============================================================================
// Tests : Client Service — Réassignation
// ============================================================================

describe("Client Service - reassignClient", () => {
  it("AGENT ne peut PAS réassigner → 403", async () => {
    const agent = makeUser({ role: "AGENT" });
    await expect(
      reassignClient(agent, "client-1", "new-agent-id"),
    ).rejects.toThrow("seuls CEO, ADMIN et SUPERVISOR");
  });

  it("ASSISTANT ne peut PAS réassigner → 403", async () => {
    const assistant = makeUser({ role: "ASSISTANT" });
    await expect(
      reassignClient(assistant, "client-1", "new-agent-id"),
    ).rejects.toThrow("seuls CEO, ADMIN et SUPERVISOR");
  });

  it("SUPERVISOR peut réassigner (pas d'erreur de rôle)", async () => {
    const supervisor = makeUser({ role: "SUPERVISOR" });
    // Va échouer sur "Client introuvable" car mock, mais PAS sur le rôle
    try {
      await reassignClient(supervisor, "client-1", "new-agent-id");
    } catch (err) {
      // Doit PAS être une erreur de rôle
      expect((err as Error).message).not.toContain("seuls CEO");
    }
  });

  it("CEO peut réassigner (pas d'erreur de rôle)", async () => {
    const ceo = makeUser({ role: "CEO" });
    try {
      await reassignClient(ceo, "client-1", "new-agent-id");
    } catch (err) {
      expect((err as Error).message).not.toContain("seuls CEO");
    }
  });
});

// ============================================================================
// Tests : Isolation agent dans les clients
// ============================================================================

describe("Agent Client Isolation", () => {
  it("Agent READ_ALL = false → ne voit que ses clients dans la matrice", () => {
    expect(hasPermission("AGENT", "CLIENTS", "READ_ALL")).toBe(false);
    expect(hasPermission("AGENT", "CLIENTS", "READ")).toBe(true);
  });

  it("Supervisor READ_ALL = true → voit tous les clients", () => {
    expect(hasPermission("SUPERVISOR", "CLIENTS", "READ_ALL")).toBe(true);
  });

  it("CEO READ_ALL = true → voit tous les clients", () => {
    expect(hasPermission("CEO", "CLIENTS", "READ_ALL")).toBe(true);
  });

  it("Assistant READ_ALL = true → voit tous les clients en lecture seule", () => {
    expect(hasPermission("ASSISTANT", "CLIENTS", "READ_ALL")).toBe(true);
    expect(hasPermission("ASSISTANT", "CLIENTS", "CREATE")).toBe(false);
    expect(hasPermission("ASSISTANT", "CLIENTS", "UPDATE")).toBe(false);
  });
});
