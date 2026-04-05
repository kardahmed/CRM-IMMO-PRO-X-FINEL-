import { apiHandler, jsonOk } from "@/lib/api-handler";

const PIPELINE_STAGES = [
  "NEW",
  "CONTACTED",
  "QUALIFIED",
  "VISIT_SCHEDULED",
  "VISITED",
  "NEGOTIATION",
  "RESERVED",
  "SIGNED",
  "CLOSED",
] as const;

/**
 * GET /api/v1/automations/stats — Automation task statistics for dashboard
 */
export const GET = apiHandler(
  { module: "AUTOMATIONS", action: "READ" },
  async (ctx) => {
    const url = new URL(ctx.req.url);
    const from = url.searchParams.get("from");
    const to = url.searchParams.get("to");
    const assignedToId = url.searchParams.get("assignedToId");
    const stage = url.searchParams.get("stage");
    const status = url.searchParams.get("status");
    const now = new Date();

    const baseWhere: Record<string, unknown> = {
      isAutomated: true,
    };

    // AGENT role: restrict to own tasks only
    if (ctx.user.role === "AGENT") {
      baseWhere.assignedToId = ctx.user.userId;
    }

    // Optional date range filter on createdAt
    if (from || to) {
      baseWhere.createdAt = {};
      if (from) (baseWhere.createdAt as Record<string, unknown>).gte = new Date(from);
      if (to) (baseWhere.createdAt as Record<string, unknown>).lte = new Date(to);
    }

    // Optional agent filter (only if not already restricted by AGENT role)
    if (assignedToId && ctx.user.role !== "AGENT") {
      baseWhere.assignedToId = assignedToId;
    }

    // Optional pipeline stage filter
    if (stage && PIPELINE_STAGES.includes(stage as (typeof PIPELINE_STAGES)[number])) {
      baseWhere.pipelineStage = stage;
    }

    // Optional task status filter
    const validStatuses = ["PENDING", "IN_PROGRESS", "COMPLETED", "CANCELLED"] as const;
    if (status && validStatuses.includes(status as (typeof validStatuses)[number])) {
      baseWhere.status = status;
    }

    // --- Summary counts ---
    const [pending, inProgress, completed, cancelled, overdue] = await Promise.all([
      ctx.db.task.count({ where: { ...baseWhere, status: "PENDING" } }),
      ctx.db.task.count({ where: { ...baseWhere, status: "IN_PROGRESS" } }),
      ctx.db.task.count({ where: { ...baseWhere, status: "COMPLETED" } }),
      ctx.db.task.count({ where: { ...baseWhere, status: "CANCELLED" } }),
      ctx.db.task.count({
        where: {
          ...baseWhere,
          status: { in: ["PENDING", "IN_PROGRESS"] },
          dueAt: { lt: now },
        },
      }),
    ]);

    const total = pending + inProgress + completed + cancelled;

    // --- By stage ---
    const byStagePromises = PIPELINE_STAGES.map(async (stage) => {
      const stageWhere = { ...baseWhere, pipelineStage: stage };

      const [stagePending, stageInProgress, stageCompleted, stageCancelled, stageOverdue] =
        await Promise.all([
          ctx.db.task.count({ where: { ...stageWhere, status: "PENDING" } }),
          ctx.db.task.count({ where: { ...stageWhere, status: "IN_PROGRESS" } }),
          ctx.db.task.count({ where: { ...stageWhere, status: "COMPLETED" } }),
          ctx.db.task.count({ where: { ...stageWhere, status: "CANCELLED" } }),
          ctx.db.task.count({
            where: {
              ...stageWhere,
              status: { in: ["PENDING", "IN_PROGRESS"] },
              dueAt: { lt: now },
            },
          }),
        ]);

      return {
        stage,
        pending: stagePending,
        inProgress: stageInProgress,
        completed: stageCompleted,
        cancelled: stageCancelled,
        overdue: stageOverdue,
      };
    });

    const byStage = await Promise.all(byStagePromises);

    // --- By type ---
    const byTypeRaw = await ctx.db.task.groupBy({
      by: ["type"],
      where: baseWhere,
      _count: { id: true },
    });

    const byType = byTypeRaw.map((entry: { type: string; _count: { id: number } }) => ({
      type: entry.type,
      count: entry._count.id,
    }));

    // --- Recent tasks ---
    const recentTasks = await ctx.db.task.findMany({
      where: baseWhere,
      orderBy: { createdAt: "desc" },
      take: 10,
      include: {
        client: { select: { firstName: true, lastName: true } },
        assignedTo: { select: { firstName: true, lastName: true } },
      },
    });

    return jsonOk({
      summary: {
        pending,
        inProgress,
        completed,
        cancelled,
        overdue,
        total,
      },
      byStage,
      byType,
      recentTasks,
    });
  },
);
