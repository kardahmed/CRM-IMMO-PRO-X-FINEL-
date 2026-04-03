import { apiHandler, getBody, jsonOk, jsonError } from "@/lib/api-handler";
import { createClientSchema, type CreateClientInput } from "@/lib/validations/clients";
import { createClient } from "@/services/client.service";

/**
 * GET /api/v1/clients — Liste paginée avec filtres stage/agent/search
 */
export const GET = apiHandler(
  { module: "CLIENTS", action: "READ" },
  async (ctx) => {
    const url = new URL(ctx.req.url);
    const page = Math.max(1, parseInt(url.searchParams.get("page") || "1"));
    const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get("limit") || "20")));
    const skip = (page - 1) * limit;

    const stage = url.searchParams.get("stage");
    const agentId = url.searchParams.get("agentId");
    const search = url.searchParams.get("search");
    const source = url.searchParams.get("source");

    const where: Record<string, unknown> = {};

    if (stage) where.pipelineStage = stage;
    if (source) where.source = source;
    if (agentId) where.assignedAgentId = agentId;

    // Agent sees only their own clients
    if (ctx.user.role === "AGENT") {
      where.assignedAgentId = ctx.user.userId;
    }

    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: "insensitive" } },
        { lastName: { contains: search, mode: "insensitive" } },
        { phone: { contains: search } },
        { email: { contains: search, mode: "insensitive" } },
      ];
    }

    const [clients, total] = await Promise.all([
      ctx.db.client.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: { assignedAgent: { select: { id: true, firstName: true, lastName: true } } },
      }),
      ctx.db.client.count({ where }),
    ]);

    return jsonOk({
      clients,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  },
);

/**
 * POST /api/v1/clients — Créer un client avec dedup
 */
export const POST = apiHandler(
  { module: "CLIENTS", action: "CREATE", schema: createClientSchema },
  async (ctx) => {
    const body = getBody<CreateClientInput>(ctx.req);
    const result = await createClient(ctx.user, body);

    if (!result.dedup.canCreate) {
      return jsonError(
        `Doublon détecté : ${result.dedup.duplicates.map((d) => d.type).join(", ")}`,
        409,
      );
    }

    return jsonOk(result.client, 201);
  },
);
