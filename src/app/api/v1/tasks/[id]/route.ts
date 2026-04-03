import { apiHandler, getBody, jsonOk, jsonError } from "@/lib/api-handler";
import { updateTaskSchema, postponeTaskSchema, type UpdateTaskInput } from "@/lib/validations/tasks";

/**
 * GET /api/v1/tasks/[id] — Détail d'une tâche
 */
export const GET = apiHandler(
  { module: "PLANNING", action: "READ" },
  async (ctx) => {
    const { id } = ctx.params;

    const task = await ctx.db.task.findFirst({
      where: { id },
      include: {
        client: { select: { id: true, firstName: true, lastName: true } },
        assignedTo: { select: { id: true, firstName: true, lastName: true } },
        property: { select: { id: true, name: true } },
      },
    });

    if (!task) return jsonError("Tâche introuvable", 404);

    if (ctx.user.role === "AGENT" && task.assignedToId !== ctx.user.userId) {
      return jsonError("Accès refusé", 403);
    }

    return jsonOk(task);
  },
);

/**
 * PATCH /api/v1/tasks/[id] — Modifier une tâche
 */
export const PATCH = apiHandler(
  { module: "PLANNING", action: "UPDATE", schema: updateTaskSchema },
  async (ctx) => {
    const { id } = ctx.params;
    const body = getBody<UpdateTaskInput>(ctx.req);

    const existing = await ctx.db.task.findFirst({ where: { id } });
    if (!existing) return jsonError("Tâche introuvable", 404);

    if (ctx.user.role === "AGENT" && existing.assignedToId !== ctx.user.userId) {
      return jsonError("Accès refusé", 403);
    }

    const updated = await ctx.db.task.update({
      where: { id },
      data: {
        ...body,
        dueAt: body.dueAt ? new Date(body.dueAt) : undefined,
      },
    });

    return jsonOk(updated);
  },
);

/**
 * PUT /api/v1/tasks/[id] — Complete or postpone a task
 * Body: { action: "complete" } or { action: "postpone", dueAt: "..." }
 */
export const PUT = apiHandler(
  { module: "PLANNING", action: "UPDATE" },
  async (ctx) => {
    const { id } = ctx.params;
    const body = await ctx.req.json().catch(() => ({})) as Record<string, unknown>;

    const existing = await ctx.db.task.findFirst({ where: { id } });
    if (!existing) return jsonError("Tâche introuvable", 404);

    if (body.action === "complete") {
      const updated = await ctx.db.task.update({
        where: { id },
        data: { status: "COMPLETED" },
      });
      return jsonOk(updated);
    }

    if (body.action === "postpone") {
      const parsed = postponeTaskSchema.safeParse(body);
      if (!parsed.success) {
        return jsonError("dueAt requis pour reporter", 422);
      }
      const updated = await ctx.db.task.update({
        where: { id },
        data: { dueAt: new Date(parsed.data.dueAt) },
      });
      return jsonOk(updated);
    }

    return jsonError("Action invalide. Utiliser 'complete' ou 'postpone'", 400);
  },
);
