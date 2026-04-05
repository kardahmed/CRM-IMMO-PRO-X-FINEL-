import { describe, it, expect, vi, beforeEach } from "vitest";

// ============================================================================
// Mocks — Simule Prisma $extends pour capturer les args injectés
// ============================================================================

const capturedCalls: Array<{
  model: string;
  action: string;
  args: Record<string, unknown>;
}> = [];

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
            const handler = extension?.query?.$allModels?.[action as string];
            if (!handler) return null;

            return handler({
              model: capitalizedModel,
              args: args || {},
              query: async (finalArgs: Record<string, unknown>) => {
                capturedCalls.push({
                  model: capitalizedModel,
                  action: action as string,
                  args: finalArgs,
                });
                return {
                  _model: capitalizedModel,
                  _action: action,
                  _args: finalArgs,
                };
              },
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
// Imports (AFTER mocks)
// ============================================================================

import { createTenantPrisma } from "@/lib/prisma-tenant";

// Helper
function getArgs(result: unknown): Record<string, unknown> {
  return (result as Record<string, Record<string, unknown>>)._args;
}

type AnyDb = Record<string, Record<string, (...args: unknown[]) => Promise<unknown>>>;

// ============================================================================
// 1. TESTS ISOLATION MULTI-TENANT (CRITIQUE)
// ============================================================================

describe("Multi-Tenant Isolation — CRITIQUE", () => {
  const TENANT_A = "tenant-aaa-111-uuid";
  const TENANT_B = "tenant-bbb-222-uuid";

  beforeEach(() => {
    capturedCalls.length = 0;
  });

  // -----------------------------------------------------------------------
  // Tenant A GET /clients ne retourne AUCUN client Tenant B
  // -----------------------------------------------------------------------
  describe("Tenant A ne voit PAS les donnees de Tenant B", () => {
    it("findMany client de Tenant A injecte tenantId=A, jamais B", async () => {
      const dbA = createTenantPrisma(TENANT_A);
      const result = await (dbA as unknown as AnyDb).client.findMany({});
      const args = getArgs(result);

      expect(args.where).toEqual(
        expect.objectContaining({ tenantId: TENANT_A }),
      );
      expect((args.where as Record<string, unknown>).tenantId).not.toBe(TENANT_B);
    });

    it("findMany client de Tenant B injecte tenantId=B, jamais A", async () => {
      const dbB = createTenantPrisma(TENANT_B);
      const result = await (dbB as unknown as AnyDb).client.findMany({});
      const args = getArgs(result);

      expect(args.where).toEqual(
        expect.objectContaining({ tenantId: TENANT_B }),
      );
      expect((args.where as Record<string, unknown>).tenantId).not.toBe(TENANT_A);
    });

    it("deux tenants simultanes ont des scopes totalement isoles", async () => {
      const dbA = createTenantPrisma(TENANT_A);
      const dbB = createTenantPrisma(TENANT_B);

      const resultA = await (dbA as unknown as AnyDb).client.findMany({});
      const resultB = await (dbB as unknown as AnyDb).client.findMany({});

      const whereA = getArgs(resultA).where as Record<string, unknown>;
      const whereB = getArgs(resultB).where as Record<string, unknown>;

      expect(whereA.tenantId).toBe(TENANT_A);
      expect(whereB.tenantId).toBe(TENANT_B);
      expect(whereA.tenantId).not.toBe(whereB.tenantId);
    });
  });

  // -----------------------------------------------------------------------
  // Tenant A POST /clients/[idTenantB] retourne 403 (tenantId forcé)
  // -----------------------------------------------------------------------
  describe("Tenant A ne peut PAS ecrire dans Tenant B", () => {
    it("create via Tenant A injecte forcément tenantId=A", async () => {
      const dbA = createTenantPrisma(TENANT_A);
      const result = await (dbA as unknown as AnyDb).client.create({
        data: { firstName: "Hack", lastName: "Attempt", phone: "+213555000000" },
      });
      const args = getArgs(result);

      expect((args.data as Record<string, unknown>).tenantId).toBe(TENANT_A);
      expect((args.data as Record<string, unknown>).tenantId).not.toBe(TENANT_B);
    });

    it("update via Tenant A filtre par tenantId=A (ne peut pas modifier B)", async () => {
      const dbA = createTenantPrisma(TENANT_A);
      const result = await (dbA as unknown as AnyDb).client.update({
        where: { id: "client-from-tenant-B" },
        data: { firstName: "Hacked" },
      });
      const args = getArgs(result);

      expect((args.where as Record<string, unknown>).tenantId).toBe(TENANT_A);
    });
  });

  // -----------------------------------------------------------------------
  // Tenant A PATCH /properties/[idTenantB] retourne 403
  // -----------------------------------------------------------------------
  describe("Tenant A ne peut PAS modifier les properties de Tenant B", () => {
    it("update property via Tenant A injecte tenantId=A dans le where", async () => {
      const dbA = createTenantPrisma(TENANT_A);
      const result = await (dbA as unknown as AnyDb).property.update({
        where: { id: "property-from-B" },
        data: { name: "Hacked property" },
      });
      const args = getArgs(result);

      expect((args.where as Record<string, unknown>).tenantId).toBe(TENANT_A);
    });
  });

  // -----------------------------------------------------------------------
  // Tenant A ne peut pas lire les taches, visites, paiements de Tenant B
  // -----------------------------------------------------------------------
  describe("Isolation sur TOUTES les entites metier", () => {
    const MODELS = ["task", "visit", "payment", "interaction", "notification"] as const;

    for (const model of MODELS) {
      it(`findMany sur ${model} injecte tenantId`, async () => {
        const dbA = createTenantPrisma(TENANT_A);
        const result = await (dbA as unknown as AnyDb)[model].findMany({});
        const args = getArgs(result);

        expect((args.where as Record<string, unknown>).tenantId).toBe(TENANT_A);
      });

      it(`findFirst sur ${model} injecte tenantId`, async () => {
        const dbA = createTenantPrisma(TENANT_A);
        const result = await (dbA as unknown as AnyDb)[model].findFirst({
          where: { id: "some-id" },
        });
        const args = getArgs(result);

        expect((args.where as Record<string, unknown>).tenantId).toBe(TENANT_A);
        expect((args.where as Record<string, unknown>).id).toBe("some-id");
      });
    }
  });

  // -----------------------------------------------------------------------
  // Les requetes Prisma ajoutent TOUJOURS tenantId meme si on oublie
  // -----------------------------------------------------------------------
  describe("tenantId est TOUJOURS injecte meme si oublie dans le code", () => {
    it("findMany sans where injecte quand meme tenantId", async () => {
      const dbA = createTenantPrisma(TENANT_A);
      const result = await (dbA as unknown as AnyDb).client.findMany({});
      const args = getArgs(result);

      expect(args.where).toBeDefined();
      expect((args.where as Record<string, unknown>).tenantId).toBe(TENANT_A);
    });

    it("findFirst sans where injecte quand meme tenantId", async () => {
      const dbA = createTenantPrisma(TENANT_A);
      const result = await (dbA as unknown as AnyDb).client.findFirst({});
      const args = getArgs(result);

      expect(args.where).toBeDefined();
      expect((args.where as Record<string, unknown>).tenantId).toBe(TENANT_A);
    });

    it("count sans where injecte quand meme tenantId", async () => {
      const dbA = createTenantPrisma(TENANT_A);
      const result = await (dbA as unknown as AnyDb).client.count({});
      const args = getArgs(result);

      expect(args.where).toBeDefined();
      expect((args.where as Record<string, unknown>).tenantId).toBe(TENANT_A);
    });

    it("delete sans where specifique injecte quand meme tenantId", async () => {
      const dbA = createTenantPrisma(TENANT_A);
      const result = await (dbA as unknown as AnyDb).client.delete({
        where: { id: "client-x" },
      });
      const args = getArgs(result);

      expect((args.where as Record<string, unknown>).tenantId).toBe(TENANT_A);
    });

    it("updateMany injecte tenantId dans le where", async () => {
      const dbA = createTenantPrisma(TENANT_A);
      const result = await (dbA as unknown as AnyDb).client.updateMany({
        where: { pipelineStage: "NEW" },
        data: { pipelineStage: "CONTACTED" },
      });
      const args = getArgs(result);

      expect((args.where as Record<string, unknown>).tenantId).toBe(TENANT_A);
    });

    it("deleteMany injecte tenantId dans le where", async () => {
      const dbA = createTenantPrisma(TENANT_A);
      const result = await (dbA as unknown as AnyDb).client.deleteMany({
        where: {},
      });
      const args = getArgs(result);

      expect((args.where as Record<string, unknown>).tenantId).toBe(TENANT_A);
    });

    it("aggregate injecte tenantId dans le where", async () => {
      const dbA = createTenantPrisma(TENANT_A);
      const result = await (dbA as unknown as AnyDb).payment.aggregate({
        where: {},
      });
      const args = getArgs(result);

      expect((args.where as Record<string, unknown>).tenantId).toBe(TENANT_A);
    });

    it("groupBy injecte tenantId dans le where", async () => {
      const dbA = createTenantPrisma(TENANT_A);
      const result = await (dbA as unknown as AnyDb).client.groupBy({
        where: {},
        by: ["pipelineStage"],
      });
      const args = getArgs(result);

      expect((args.where as Record<string, unknown>).tenantId).toBe(TENANT_A);
    });
  });

  // -----------------------------------------------------------------------
  // createMany injecte tenantId sur chaque element
  // -----------------------------------------------------------------------
  describe("createMany injecte tenantId sur chaque element du batch", () => {
    it("tous les elements d'un createMany recoivent tenantId=A", async () => {
      const dbA = createTenantPrisma(TENANT_A);
      const result = await (dbA as unknown as AnyDb).task.createMany({
        data: [
          { title: "Task 1", status: "PENDING" },
          { title: "Task 2", status: "PENDING" },
          { title: "Task 3", status: "PENDING" },
        ],
      });
      const args = getArgs(result);

      const data = args.data as Array<Record<string, unknown>>;
      expect(data).toHaveLength(3);
      for (const item of data) {
        expect(item.tenantId).toBe(TENANT_A);
      }
    });
  });

  // -----------------------------------------------------------------------
  // upsert injecte tenantId dans where ET create
  // -----------------------------------------------------------------------
  describe("upsert injecte tenantId dans where ET create", () => {
    it("upsert injecte tenantId dans where et create", async () => {
      const dbA = createTenantPrisma(TENANT_A);
      const result = await (dbA as unknown as AnyDb).client.upsert({
        where: { id: "client-1" },
        create: { firstName: "New", lastName: "User", phone: "+213555000001" },
        update: { firstName: "Existing" },
      });
      const args = getArgs(result);

      expect((args.where as Record<string, unknown>).tenantId).toBe(TENANT_A);
      expect((args.create as Record<string, unknown>).tenantId).toBe(TENANT_A);
    });
  });

  // -----------------------------------------------------------------------
  // Le modele Tenant lui-meme est exclu (pas de filtre tenantId)
  // -----------------------------------------------------------------------
  describe("Le modele Tenant est exclu du filtrage", () => {
    it("findMany sur le modele Tenant ne reçoit PAS tenantId", async () => {
      const dbA = createTenantPrisma(TENANT_A);
      const result = await (dbA as unknown as AnyDb).tenant.findMany({});
      const args = getArgs(result);

      const where = (args.where ?? {}) as Record<string, unknown>;
      expect(where).not.toHaveProperty("tenantId");
    });

    it("create sur le modele Tenant ne reçoit PAS tenantId auto", async () => {
      const dbA = createTenantPrisma(TENANT_A);
      const result = await (dbA as unknown as AnyDb).tenant.create({
        data: { name: "New Workspace" },
      });
      const args = getArgs(result);

      const data = args.data as Record<string, unknown>;
      expect(data).not.toHaveProperty("tenantId");
    });
  });

  // -----------------------------------------------------------------------
  // Validation du tenantId
  // -----------------------------------------------------------------------
  describe("Validation du tenantId", () => {
    it("refuse un tenantId vide", () => {
      expect(() => createTenantPrisma("")).toThrow("tenantId est requis");
    });

    it("refuse null", () => {
      expect(() => createTenantPrisma(null as unknown as string)).toThrow(
        "tenantId est requis",
      );
    });

    it("refuse undefined", () => {
      expect(() => createTenantPrisma(undefined as unknown as string)).toThrow(
        "tenantId est requis",
      );
    });

    it("refuse un nombre", () => {
      expect(() => createTenantPrisma(123 as unknown as string)).toThrow(
        "tenantId est requis",
      );
    });
  });

  // -----------------------------------------------------------------------
  // Le tenantId est freeze et immutable
  // -----------------------------------------------------------------------
  describe("Le tenantId est immutable apres creation", () => {
    it("deux db instances independantes n'interferent pas", async () => {
      const dbA = createTenantPrisma(TENANT_A);
      const dbB = createTenantPrisma(TENANT_B);

      // Utiliser dbA puis dbB ne change pas le scope de dbA
      await (dbB as unknown as AnyDb).client.findMany({});
      const resultA = await (dbA as unknown as AnyDb).client.findMany({});

      const whereA = getArgs(resultA).where as Record<string, unknown>;
      expect(whereA.tenantId).toBe(TENANT_A);
    });
  });
});
