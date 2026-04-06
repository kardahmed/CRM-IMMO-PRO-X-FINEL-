import { apiHandler, getBody, jsonOk, jsonError } from "@/lib/api-handler";
import { updateClientSchema, type UpdateClientInput } from "@/lib/validations/clients";

/**
 * GET /api/v1/clients/[id] — Détail avec relations
 */
export const GET = apiHandler(
  { module: "CLIENTS", action: "READ" },
  async (ctx) => {
    const { id } = ctx.params;

    const client = await ctx.db.client.findFirst({
      where: { id },
      include: {
        assignedAgent: { select: { id: true, firstName: true, lastName: true, email: true } },
        interactions: {
          orderBy: { createdAt: "desc" },
          take: 10,
          select: { id: true, type: true, direction: true, content: true, createdAt: true, user: { select: { id: true, firstName: true, lastName: true } } },
        },
        visits: {
          orderBy: { scheduledAt: "desc" },
          take: 10,
          select: { id: true, scheduledAt: true, status: true, feedback: true, property: { select: { id: true, name: true } } },
        },
        tasks: {
          orderBy: { createdAt: "desc" },
          take: 10,
          select: { id: true, title: true, type: true, status: true, dueAt: true, isAutomated: true, createdAt: true },
        },
      },
    });

    if (!client) return jsonError("Client introuvable", 404);

    // Agent can only see their own clients
    if (ctx.user.role === "AGENT" && client.assignedAgentId !== ctx.user.userId) {
      return jsonError("Accès refusé", 403);
    }

    return jsonOk(client);
  },
);

/**
 * PATCH /api/v1/clients/[id] — Modifier un client
 */
export const PATCH = apiHandler(
  { module: "CLIENTS", action: "UPDATE", schema: updateClientSchema },
  async (ctx) => {
    const { id } = ctx.params;
    const body = getBody<UpdateClientInput>(ctx.req);

    const existing = await ctx.db.client.findFirst({ where: { id } });
    if (!existing) return jsonError("Client introuvable", 404);

    if (ctx.user.role === "AGENT" && existing.assignedAgentId !== ctx.user.userId) {
      return jsonError("Accès refusé", 403);
    }

    const updated = await ctx.db.client.update({
      where: { id },
      data: body,
    });

    return jsonOk(updated);
  },
);
