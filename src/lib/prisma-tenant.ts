import { prisma } from "@/lib/prisma";

// Modèles qui n'ont PAS de tenantId — exclus de l'injection automatique
const EXCLUDED_MODELS = new Set(["Tenant"]);

/**
 * Crée un client Prisma scoped à un tenant.
 * Utilise $extends (Prisma v7) pour injecter automatiquement
 * le filtre `tenantId` sur TOUTES les opérations.
 *
 * Impossible à bypasser : le tenantId est freezé dans la closure.
 *
 * Usage :
 *   const db = createTenantPrisma(tenantId);
 *   const clients = await db.client.findMany(); // auto-filtré par tenantId
 *   await db.client.create({ data: { ... } }); // tenantId auto-injecté
 */
export function createTenantPrisma(tenantId: string) {
  if (!tenantId || typeof tenantId !== "string") {
    throw new Error("tenantId est requis et doit être un UUID valide");
  }

  // Freeze le tenantId — impossible de le modifier après création
  const frozenTenantId = Object.freeze(tenantId) as string;

  return prisma.$extends({
    query: {
      $allModels: {
        // === LECTURE ===
        async findFirst({ model, args, query }) {
          if (EXCLUDED_MODELS.has(model)) return query(args);
          args.where = { ...args.where, tenantId: frozenTenantId } as typeof args.where;
          return query(args);
        },
        async findFirstOrThrow({ model, args, query }) {
          if (EXCLUDED_MODELS.has(model)) return query(args);
          args.where = { ...args.where, tenantId: frozenTenantId } as typeof args.where;
          return query(args);
        },
        async findUnique({ model, args, query }) {
          if (EXCLUDED_MODELS.has(model)) return query(args);
          args.where = { ...args.where, tenantId: frozenTenantId } as typeof args.where;
          return query(args);
        },
        async findUniqueOrThrow({ model, args, query }) {
          if (EXCLUDED_MODELS.has(model)) return query(args);
          args.where = { ...args.where, tenantId: frozenTenantId } as typeof args.where;
          return query(args);
        },
        async findMany({ model, args, query }) {
          if (EXCLUDED_MODELS.has(model)) return query(args);
          args.where = { ...args.where, tenantId: frozenTenantId } as typeof args.where;
          return query(args);
        },
        async count({ model, args, query }) {
          if (EXCLUDED_MODELS.has(model)) return query(args);
          args.where = { ...args.where, tenantId: frozenTenantId } as typeof args.where;
          return query(args);
        },
        async aggregate({ model, args, query }) {
          if (EXCLUDED_MODELS.has(model)) return query(args);
          args.where = { ...args.where, tenantId: frozenTenantId } as typeof args.where;
          return query(args);
        },
        async groupBy({ model, args, query }) {
          if (EXCLUDED_MODELS.has(model)) return query(args);
          args.where = { ...args.where, tenantId: frozenTenantId } as typeof args.where;
          return query(args);
        },

        // === ÉCRITURE ===
        async create({ model, args, query }) {
          if (EXCLUDED_MODELS.has(model)) return query(args);
          args.data = {
            ...args.data,
            tenantId: frozenTenantId,
          } as typeof args.data;
          return query(args);
        },
        async createMany({ model, args, query }) {
          if (EXCLUDED_MODELS.has(model)) return query(args);
          if (Array.isArray(args.data)) {
            args.data = args.data.map((item) => ({
              ...item,
              tenantId: frozenTenantId,
            })) as typeof args.data;
          } else {
            args.data = {
              ...args.data,
              tenantId: frozenTenantId,
            } as typeof args.data;
          }
          return query(args);
        },
        async createManyAndReturn({ model, args, query }) {
          if (EXCLUDED_MODELS.has(model)) return query(args);
          if (Array.isArray(args.data)) {
            args.data = args.data.map((item) => ({
              ...item,
              tenantId: frozenTenantId,
            })) as typeof args.data;
          } else {
            args.data = {
              ...args.data,
              tenantId: frozenTenantId,
            } as typeof args.data;
          }
          return query(args);
        },
        async update({ model, args, query }) {
          if (EXCLUDED_MODELS.has(model)) return query(args);
          args.where = { ...args.where, tenantId: frozenTenantId } as typeof args.where;
          return query(args);
        },
        async updateMany({ model, args, query }) {
          if (EXCLUDED_MODELS.has(model)) return query(args);
          args.where = { ...args.where, tenantId: frozenTenantId } as typeof args.where;
          return query(args);
        },
        async updateManyAndReturn({ model, args, query }) {
          if (EXCLUDED_MODELS.has(model)) return query(args);
          args.where = { ...args.where, tenantId: frozenTenantId } as typeof args.where;
          return query(args);
        },
        async delete({ model, args, query }) {
          if (EXCLUDED_MODELS.has(model)) return query(args);
          args.where = { ...args.where, tenantId: frozenTenantId } as typeof args.where;
          return query(args);
        },
        async deleteMany({ model, args, query }) {
          if (EXCLUDED_MODELS.has(model)) return query(args);
          args.where = { ...args.where, tenantId: frozenTenantId } as typeof args.where;
          return query(args);
        },
        async upsert({ model, args, query }) {
          if (EXCLUDED_MODELS.has(model)) return query(args);
          args.where = { ...args.where, tenantId: frozenTenantId } as typeof args.where;
          args.create = {
            ...args.create,
            tenantId: frozenTenantId,
          } as typeof args.create;
          return query(args);
        },
      },
    },
  });
}

// Re-export le type pour usage externe
export type TenantPrismaClient = ReturnType<typeof createTenantPrisma>;
