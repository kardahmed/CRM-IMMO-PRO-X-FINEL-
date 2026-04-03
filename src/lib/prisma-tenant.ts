import { Prisma, PrismaClient } from "@prisma/client";

// Modèles qui n'ont PAS de tenantId
const EXCLUDED_MODELS = new Set(["Tenant"]);

/**
 * Crée un client Prisma scoped à un tenant.
 * Utilise $extends (Prisma v7) pour injecter automatiquement
 * le filtre `tenantId` sur chaque requête.
 *
 * Usage :
 *   const db = prismaForTenant(tenantId);
 *   const clients = await db.client.findMany(); // auto-filtré par tenantId
 */
export function prismaForTenant(tenantId: string) {
  const basePrisma = new PrismaClient();

  return basePrisma.$extends({
    query: {
      $allModels: {
        async findFirst({ model, args, query }) {
          if (EXCLUDED_MODELS.has(model)) return query(args);
          args.where = { ...args.where, tenantId } as typeof args.where;
          return query(args);
        },
        async findFirstOrThrow({ model, args, query }) {
          if (EXCLUDED_MODELS.has(model)) return query(args);
          args.where = { ...args.where, tenantId } as typeof args.where;
          return query(args);
        },
        async findMany({ model, args, query }) {
          if (EXCLUDED_MODELS.has(model)) return query(args);
          args.where = { ...args.where, tenantId } as typeof args.where;
          return query(args);
        },
        async count({ model, args, query }) {
          if (EXCLUDED_MODELS.has(model)) return query(args);
          args.where = { ...args.where, tenantId } as typeof args.where;
          return query(args);
        },
        async aggregate({ model, args, query }) {
          if (EXCLUDED_MODELS.has(model)) return query(args);
          args.where = { ...args.where, tenantId } as typeof args.where;
          return query(args);
        },
        async groupBy({ model, args, query }) {
          if (EXCLUDED_MODELS.has(model)) return query(args);
          args.where = { ...args.where, tenantId } as typeof args.where;
          return query(args);
        },
        async create({ model, args, query }) {
          if (EXCLUDED_MODELS.has(model)) return query(args);
          args.data = {
            ...args.data,
            tenantId,
          } as typeof args.data;
          return query(args);
        },
        async createMany({ model, args, query }) {
          if (EXCLUDED_MODELS.has(model)) return query(args);
          if (Array.isArray(args.data)) {
            args.data = args.data.map((item) => ({
              ...item,
              tenantId,
            })) as typeof args.data;
          } else {
            args.data = {
              ...args.data,
              tenantId,
            } as typeof args.data;
          }
          return query(args);
        },
        async update({ model, args, query }) {
          if (EXCLUDED_MODELS.has(model)) return query(args);
          args.where = { ...args.where, tenantId } as typeof args.where;
          return query(args);
        },
        async updateMany({ model, args, query }) {
          if (EXCLUDED_MODELS.has(model)) return query(args);
          args.where = { ...args.where, tenantId } as typeof args.where;
          return query(args);
        },
        async delete({ model, args, query }) {
          if (EXCLUDED_MODELS.has(model)) return query(args);
          args.where = { ...args.where, tenantId } as typeof args.where;
          return query(args);
        },
        async deleteMany({ model, args, query }) {
          if (EXCLUDED_MODELS.has(model)) return query(args);
          args.where = { ...args.where, tenantId } as typeof args.where;
          return query(args);
        },
        async upsert({ model, args, query }) {
          if (EXCLUDED_MODELS.has(model)) return query(args);
          args.where = { ...args.where, tenantId } as typeof args.where;
          args.create = {
            ...args.create,
            tenantId,
          } as typeof args.create;
          return query(args);
        },
      },
    },
  });
}

// Re-export le type pour usage externe
export type TenantPrismaClient = ReturnType<typeof prismaForTenant>;
