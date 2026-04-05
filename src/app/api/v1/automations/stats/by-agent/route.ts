import { apiHandler, jsonOk } from "@/lib/api-handler";

/**
 * GET /api/v1/automations/stats/by-agent
 *
 * Returns automation task statistics grouped by agent.
 * Supports optional query params: ?from=ISO_DATE&to=ISO_DATE
 * AGENT role users only see their own stats.
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
      usersWhere.clerkId = ctx.user.userId;
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

    // 2. Build date filter for tasks
    const dateFilter: Record<string, unknown> = {};
    if (from) dateFilter.gte = new Date(from);
    if (to) dateFilter.lte = new Date(to);
    const hasDateFilter = from || to;

    // 3. For each user, compute automation task stats
    const agents = await Promise.all(
      users.map(async (user) => {
        const baseWhere: Record<string, unknown> = {
          isAutomated: true,
          assignedToId: user.id,
        };

        if (hasDateFilter) {
          baseWhere.createdAt = dateFilter;
        }

        const [pending, inProgress, completed, cancelled, overdue] =
          await Promise.all([
            ctx.db.task.count({ where: { ...baseWhere, status: "PENDING" } }),
            ctx.db.task.count({
              where: { ...baseWhere, status: "IN_PROGRESS" },
            }),
            ctx.db.task.count({
              where: { ...baseWhere, status: "COMPLETED" },
            }),
            ctx.db.task.count({
              where: { ...baseWhere, status: "CANCELLED" },
            }),
            ctx.db.task.count({
              where: {
                ...baseWhere,
                status: { in: ["PENDING", "IN_PROGRESS"] },
                dueAt: { lt: now },
              },
            }),
          ]);

        const total = pending + inProgress + completed + cancelled;

        // Completion rate: completed / (completed + cancelled + overdue) * 100
        const denominator = completed + cancelled + overdue;
        const completionRate =
          denominator > 0
            ? Math.round((completed / denominator) * 100 * 100) / 100
            : 0;

        // Avg completion time: for COMPLETED tasks, diff between updatedAt and createdAt
        let avgCompletionTimeMinutes: number | null = null;

        const completedTasks = await ctx.db.task.findMany({
          where: { ...baseWhere, status: "COMPLETED" },
          select: { createdAt: true, updatedAt: true },
        });

        if (completedTasks.length > 0) {
          const totalMinutes = completedTasks.reduce(
            (sum: number, task: { createdAt: Date; updatedAt: Date }) => {
              const diffMs =
                new Date(task.updatedAt).getTime() -
                new Date(task.createdAt).getTime();
              return sum + diffMs / 60000;
            },
            0,
          );
          avgCompletionTimeMinutes =
            Math.round((totalMinutes / completedTasks.length) * 100) / 100;
        }

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
      }),
    );

    return jsonOk({ agents });
  },
);
