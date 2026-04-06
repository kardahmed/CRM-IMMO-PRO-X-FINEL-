import { apiHandler, jsonOk } from "@/lib/api-handler";

/**
 * GET /api/v1/automations/stats/by-agent
 *
 * Returns automation task statistics grouped by agent.
 * Supports optional query params: ?from=ISO_DATE&to=ISO_DATE
 * AGENT role users only see their own stats.
 *
 * Optimized: uses groupBy instead of N+1 per-agent queries.
 */
export const GET = apiHandler(
  { module: "AUTOMATIONS", action: "READ" },
  async (ctx) => {
    const url = new URL(ctx.req.url);
    const from = url.searchParams.get("from");
    const to = url.searchParams.get("to");
    const now = new Date();

    // 1. Get users with role AGENT or SUPERVISOR in the tenant
    const usersWhere: Record<string, unknown> = {
      role: { in: ["AGENT", "SUPERVISOR"] },
      isActive: true,
    };

    // If the current user is an AGENT, only return their own stats
    if (ctx.user.role === "AGENT") {
      usersWhere.id = ctx.user.userId;
    }

    const users = await ctx.db.user.findMany({
      where: usersWhere,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        role: true,
      },
      orderBy: { firstName: "asc" },
    });

    const userIds = users.map((u) => u.id);
    if (userIds.length === 0) {
      return jsonOk({ agents: [] });
    }

    // 2. Build date filter for tasks
    const dateFilter: Record<string, unknown> = {};
    if (from) dateFilter.gte = new Date(from);
    if (to) dateFilter.lte = new Date(to);
    const hasDateFilter = from || to;

    const baseWhere: Record<string, unknown> = {
      isAutomated: true,
      assignedToId: { in: userIds },
    };
    if (hasDateFilter) {
      baseWhere.createdAt = dateFilter;
    }

    // 3. Single groupBy query for all agents + statuses (replaces N+1)
    const statusGroups = await ctx.db.task.groupBy({
      by: ["assignedToId", "status"],
      where: baseWhere,
      _count: { id: true },
    });

    // 4. Single query for overdue count per agent
    const overdueGroups = await ctx.db.task.groupBy({
      by: ["assignedToId"],
      where: {
        ...baseWhere,
        status: { in: ["PENDING", "IN_PROGRESS"] },
        dueAt: { lt: now },
      },
      _count: { id: true },
    });

    // 5. Single query for avg completion time: fetch completed tasks with timestamps
    const completedTasks = await ctx.db.task.findMany({
      where: { ...baseWhere, status: "COMPLETED" },
      select: { assignedToId: true, createdAt: true, updatedAt: true },
    });

    // 6. Build lookup maps
    const statusMap = new Map<string, Record<string, number>>();
    for (const g of statusGroups) {
      const agentId = g.assignedToId ?? "";
      if (!statusMap.has(agentId)) statusMap.set(agentId, {});
      statusMap.get(agentId)![g.status] = g._count.id;
    }

    const overdueMap = new Map<string, number>();
    for (const g of overdueGroups) {
      overdueMap.set(g.assignedToId ?? "", g._count.id);
    }

    // Avg completion time per agent
    const completionTimeMap = new Map<string, { totalMinutes: number; count: number }>();
    for (const task of completedTasks) {
      const agentId = task.assignedToId ?? "";
      const diffMs = new Date(task.updatedAt).getTime() - new Date(task.createdAt).getTime();
      const entry = completionTimeMap.get(agentId) ?? { totalMinutes: 0, count: 0 };
      entry.totalMinutes += diffMs / 60000;
      entry.count += 1;
      completionTimeMap.set(agentId, entry);
    }

    // 7. Assemble results
    const agents = users.map((user) => {
      const counts = statusMap.get(user.id) ?? {};
      const pending = counts["PENDING"] ?? 0;
      const inProgress = counts["IN_PROGRESS"] ?? 0;
      const completed = counts["COMPLETED"] ?? 0;
      const cancelled = counts["CANCELLED"] ?? 0;
      const overdue = overdueMap.get(user.id) ?? 0;
      const total = pending + inProgress + completed + cancelled;

      const denominator = completed + cancelled + overdue;
      const completionRate =
        denominator > 0
          ? Math.round((completed / denominator) * 100 * 100) / 100
          : 0;

      const avgEntry = completionTimeMap.get(user.id);
      const avgCompletionTimeMinutes = avgEntry
        ? Math.round((avgEntry.totalMinutes / avgEntry.count) * 100) / 100
        : null;

      return {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        stats: {
          total,
          pending,
          inProgress,
          completed,
          cancelled,
          overdue,
          completionRate,
          avgCompletionTimeMinutes,
        },
      };
    });

    return jsonOk({ agents });
  },
);
