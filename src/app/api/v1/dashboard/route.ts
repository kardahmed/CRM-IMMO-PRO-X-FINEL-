import { apiHandler, jsonOk } from "@/lib/api-handler";

/**
 * GET /api/v1/dashboard
 *
 * Dashboard data scoped to the authenticated user's tenant.
 * Uses apiHandler for auth + tenant isolation.
 */
export const GET = apiHandler(
  { module: "DASHBOARD", action: "READ" },
  async (ctx) => {
    const { db, user } = ctx;
    const isCeoOrAdmin = user.role === "CEO" || user.role === "ADMIN";

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);
    const monthStart = new Date(todayStart.getFullYear(), todayStart.getMonth(), 1);

    // Common queries scoped to tenant via ctx.db
    const [
      clientCount,
      newClientsThisMonth,
      visitCount,
      tasksDue,
      recentClients,
      pipelineCounts,
    ] = await Promise.all([
      db.client.count(),
      db.client.count({
        where: { createdAt: { gte: monthStart } },
      }),
      db.visit.count({
        where: { scheduledAt: { gte: todayStart, lt: todayEnd } },
      }),
      db.task.count({
        where: {
          status: { in: ["PENDING", "IN_PROGRESS"] },
          dueAt: { lt: new Date() },
        },
      }),
      db.client.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          phone: true,
          pipelineStage: true,
          createdAt: true,
        },
      }),
      db.client.groupBy({
        by: ["pipelineStage"],
        _count: { id: true },
      }),
    ]);

    // Build pipeline data
    const pipelineData = pipelineCounts.map((p) => ({
      name: p.pipelineStage,
      value: p._count.id,
    }));

    // Today's visits with relations
    const todayVisits = await db.visit.findMany({
      where: { scheduledAt: { gte: todayStart, lt: todayEnd } },
      take: 10,
      orderBy: { scheduledAt: "asc" },
      select: {
        id: true,
        scheduledAt: true,
        client: { select: { firstName: true, lastName: true } },
        property: { select: { name: true } },
      },
    });

    const formatVisits = (visits: typeof todayVisits) =>
      visits.map((v) => ({
        id: v.id,
        time: v.scheduledAt,
        client: `${v.client.firstName} ${v.client.lastName}`,
        property: v.property?.name || "—",
      }));

    // Agent-specific: filter by assigned agent
    if (!isCeoOrAdmin) {
      const myClients = await db.client.count({
        where: { assignedAgentId: user.userId },
      });
      const myTasks = await db.task.findMany({
        where: {
          assignedToId: user.userId,
          status: { in: ["PENDING", "IN_PROGRESS"] },
        },
        take: 5,
        orderBy: { dueAt: "asc" },
        select: {
          id: true,
          title: true,
          dueAt: true,
          status: true,
        },
      });

      return jsonOk({
        role: user.role,
        welcomeMessage: `Bonjour ${user.firstName || "Agent"} !`,
        stats: {
          activeClients: myClients,
          todayVisits: visitCount,
          overdueTasks: tasksDue,
        },
        todayVisits: formatVisits(todayVisits),
        tasks: myTasks,
      });
    }

    // CEO / Admin view
    return jsonOk({
      role: user.role,
      stats: {
        totalClients: clientCount,
        newClientsThisMonth,
        todayVisits: visitCount,
        overdueTasks: tasksDue,
      },
      pipelineData,
      recentClients,
      todayVisits: formatVisits(todayVisits),
    });
  },
);
