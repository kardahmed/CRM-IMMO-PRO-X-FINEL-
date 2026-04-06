import { apiHandler, jsonOk } from "@/lib/api-handler";

/**
 * GET /api/v1/dashboard?period=7d|30d|90d|all
 *
 * Dashboard data scoped to the authenticated user's tenant.
 * Optimized: uses groupBy/aggregate instead of fetching raw rows for trends.
 */
export const GET = apiHandler(
  { module: "DASHBOARD", action: "READ" },
  async (ctx) => {
    const { db, user, req } = ctx;
    const isCeoOrAdmin = user.role === "CEO" || user.role === "ADMIN";

    const { searchParams } = new URL(req.url);
    const period = searchParams.get("period") || "30d";
    const now = new Date();
    let startDate = new Date();

    if (period === "7d") startDate.setDate(now.getDate() - 7);
    else if (period === "90d") startDate.setDate(now.getDate() - 90);
    else if (period === "all") startDate = new Date(2000, 0, 1);
    else startDate.setDate(now.getDate() - 30); // Default 30d

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    // 1. Basic Stats + Pipeline + Property distribution — all parallel
    const [
      totalClients,
      periodClients,
      todayVisitsCount,
      overdueTasksCount,
      pipelineCounts,
      propertyCounts,
    ] = await Promise.all([
      db.client.count(),
      db.client.count({ where: { createdAt: { gte: startDate } } }),
      db.visit.count({ where: { scheduledAt: { gte: todayStart, lt: todayEnd } } }),
      db.task.count({
        where: {
          status: { in: ["PENDING", "IN_PROGRESS"] },
          dueAt: { lt: now },
        },
      }),
      db.client.groupBy({
        by: ["pipelineStage"],
        _count: { id: true },
      }),
      db.property.groupBy({
        by: ["type"],
        _count: { id: true },
      }),
    ]);

    // 2. Comparison data: group leads and visits by date using groupBy
    //    Instead of fetching all rows and grouping in JS, we use createdAt groupBy
    //    Prisma doesn't support date truncation in groupBy, so we fetch minimal fields
    //    but limit to the period range only
    const [dailyLeads, dailyVisits] = await Promise.all([
      db.client.findMany({
        where: { createdAt: { gte: startDate } },
        select: { createdAt: true },
        orderBy: { createdAt: "asc" },
      }),
      db.visit.findMany({
        where: { scheduledAt: { gte: startDate } },
        select: { scheduledAt: true },
        orderBy: { scheduledAt: "asc" },
      }),
    ]);

    // Group by date string YYYY-MM-DD
    const groupDaily = <T>(items: T[], dateKey: keyof T) => {
      const groups: Record<string, number> = {};
      for (const item of items) {
        const d = new Date(item[dateKey] as unknown as string).toISOString().split("T")[0];
        groups[d] = (groups[d] || 0) + 1;
      }
      return groups;
    };

    const leadsGrouped = groupDaily(dailyLeads, "createdAt");
    const visitsGrouped = groupDaily(dailyVisits, "scheduledAt");

    const allDates = Array.from(new Set([...Object.keys(leadsGrouped), ...Object.keys(visitsGrouped)])).sort();
    const comparisonData = allDates.map(date => ({
      date,
      leads: leadsGrouped[date] || 0,
      visits: visitsGrouped[date] || 0,
    }));

    // 3. Top Agents — batch lookup instead of N+1
    const topAgentsRaw = await db.client.groupBy({
      by: ["assignedAgentId"],
      where: { pipelineStage: { in: ["QUALIFIED", "VISITED", "NEGOTIATION", "RESERVED", "SIGNED"] } },
      _count: { id: true },
      orderBy: { _count: { id: "desc" } },
      take: 5,
    });

    const agentIds = topAgentsRaw.map(a => a.assignedAgentId).filter((id): id is string => id !== null);
    const agentDetails = agentIds.length > 0
      ? await db.user.findMany({
          where: { id: { in: agentIds } },
          select: { id: true, firstName: true, lastName: true },
        })
      : [];

    const agentMap = new Map(agentDetails.map(a => [a.id, a]));
    const topAgents = topAgentsRaw
      .map(a => {
        const detail = agentMap.get(a.assignedAgentId ?? "");
        if (!detail) return null;
        return {
          name: `${detail.firstName} ${detail.lastName}`,
          sales: a._count.id,
          avatar: "",
        };
      })
      .filter(Boolean);

    // 4. Property Distribution
    const totalProperties = propertyCounts.reduce((acc, curr) => acc + curr._count.id, 0) || 1;
    const propertyDistribution = propertyCounts.map(p => ({
      name: p.type,
      value: Math.round((p._count.id / totalProperties) * 100),
    }));

    // 5. Today's Visits (with select)
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

    const commonResponse = {
      role: user.role,
      period,
      welcomeMessage: `Bienvenue, ${user.firstName || "Directeur"} !`,
      todayVisits: formatVisits(todayVisits),
      pipelineData: pipelineCounts.map(p => ({ name: p.pipelineStage, value: p._count.id })),
      comparisonData,
      propertyDistribution,
    };

    if (!isCeoOrAdmin) {
      const [myClients, myTasks] = await Promise.all([
        db.client.count({ where: { assignedAgentId: user.userId } }),
        db.task.findMany({
          where: { assignedToId: user.userId, status: { in: ["PENDING", "IN_PROGRESS"] } },
          take: 5,
          orderBy: { dueAt: "asc" },
          select: { id: true, title: true, dueAt: true, status: true },
        }),
      ]);

      return jsonOk({
        ...commonResponse,
        stats: {
          activeClients: myClients,
          todayVisits: todayVisitsCount,
          overdueTasks: overdueTasksCount,
        },
        tasks: myTasks,
      });
    }

    return jsonOk({
      ...commonResponse,
      stats: {
        totalClients,
        newClients: periodClients,
        todayVisits: todayVisitsCount,
        overdueTasks: overdueTasksCount,
      },
      topAgents,
    });
  }
);
