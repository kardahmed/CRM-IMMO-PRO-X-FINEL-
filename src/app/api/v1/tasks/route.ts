import { apiHandler, getBody, jsonOk } from "@/lib/api-handler";
import { createTaskSchema, type CreateTaskInput } from "@/lib/validations/tasks";

/**
 * GET /api/v1/tasks — Liste paginée avec filtres status/assignedTo/dueDate/isOverdue
 */
export const GET = apiHandler(
  { module: "PLANNING", action: "READ" },
  async (ctx) => {
    const url = new URL(ctx.req.url);
    const page = Math.max(1, parseInt(url.searchParams.get("page") || "1"));
    const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get("limit") || "20")));
    const skip = (page - 1) * limit;

    const status = url.searchParams.get("status");
    const assignedToId = url.searchParams.get("assignedToId");
    const dueBefore = url.searchParams.get("dueBefore");
    const dueAfter = url.searchParams.get("dueAfter");
    const isOverdue = url.searchParams.get("isOverdue");
    const type = url.searchParams.get("type");

    const where: Record<string, unknown> = {};

    if (status) where.status = status;
    if (type) where.type = type;
    if (assignedToId) where.assignedToId = assignedToId;

    // Agent sees only their tasks
    if (ctx.user.role === "AGENT") {
      where.assignedToId = ctx.user.userId;
    }

    if (dueBefore || dueAfter) {
      where.dueAt = {};
      if (dueAfter) (where.dueAt as Record<string, unknown>).gte = new Date(dueAfter);
      if (dueBefore) (where.dueAt as Record<string, unknown>).lte = new Date(dueBefore);
    }

    if (isOverdue === "true") {
      where.dueAt = { lt: new Date() };
      where.status = { in: ["PENDING", "IN_PROGRESS"] };
    }

    const [tasks, total] = await Promise.all([
      ctx.db.task.findMany({
        where,
        skip,
        take: limit,
        orderBy: { dueAt: "asc" },
        include: {
          client: { select: { id: true, firstName: true, lastName: true } },
          assignedTo: { select: { id: true, firstName: true, lastName: true } },
          property: { select: { id: true, name: true } },
        },
      }),
      ctx.db.task.count({ where }),
    ]);

    return jsonOk({
      tasks,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  },
);

/**
 * POST /api/v1/tasks — Créer une tâche
 */
export const POST = apiHandler(
  { module: "PLANNING", action: "CREATE", schema: createTaskSchema },
  async (ctx) => {
    const body = getBody<CreateTaskInput>(ctx.req);

    const task = await (ctx.db.task.create as unknown as (...a: unknown[]) => Promise<unknown>)({
      data: {
        ...body,
        assignedToId: body.assignedToId ?? ctx.user.userId,
        dueAt: body.dueAt ? new Date(body.dueAt) : null,
      },
    });

    return jsonOk(task, 201);
  },
);
