import { apiHandler, jsonOk } from "@/lib/api-handler";

/**
 * GET /api/v1/performance
 *
 * Performance analytics data scoped to the authenticated user's tenant.
 * Returns stats, top agents, and monthly trend (last 6 months).
 */
export const GET = apiHandler(
  { module: "PERFORMANCE", action: "READ" },
  async (ctx) => {
    const { db } = ctx;

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    // Compute 6 months ago start
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);

    const [
      totalClients,
      newClientsThisMonth,
      visitsThisMonth,
      closedClients,
      revenueAgg,
      agentGroups,
      monthlyClients,
      pipelineCounts,
    ] = await Promise.all([
      // Total clients
      db.client.count(),

      // New clients this month
      db.client.count({
        where: { createdAt: { gte: monthStart } },
      }),

      // Visits this month
      db.visit.count({
        where: { scheduledAt: { gte: monthStart } },
      }),

      // Closed clients (for conversion rate)
      db.client.count({
        where: { pipelineStage: "CLOSED" },
      }),

      // Revenue: sum of completed payments
      db.payment.aggregate({
        _sum: { amount: true },
        where: { status: "COMPLETED" },
      }),

      // Top agents: group clients by assignedAgentId
      db.client.groupBy({
        by: ["assignedAgentId"],
        _count: { id: true },
        where: { assignedAgentId: { not: null } },
        orderBy: { _count: { id: "desc" } },
        take: 10,
      }),

      // Monthly trend: clients created last 6 months
      db.client.findMany({
        where: { createdAt: { gte: sixMonthsAgo } },
        select: { createdAt: true },
      }),

      // Pipeline funnel counts
      db.client.groupBy({
        by: ["pipelineStage"],
        _count: { id: true },
      }),
    ]);

    // Conversion rate
    const conversionRate =
      totalClients > 0
        ? parseFloat(((closedClients / totalClients) * 100).toFixed(2))
        : 0;

    // Revenue total
    const revenue = revenueAgg._sum.amount
      ? Number(revenueAgg._sum.amount)
      : 0;

    // Resolve agent names
    const agentIds = agentGroups
      .map((g) => g.assignedAgentId)
      .filter((id): id is string => id !== null);

    const agents =
      agentIds.length > 0
        ? await db.user.findMany({
            where: { id: { in: agentIds } },
            select: { id: true, firstName: true, lastName: true, role: true },
          })
        : [];

    const agentMap = new Map(agents.map((a) => [a.id, a]));

    const topAgents = agentGroups.map((g) => {
      const agent = agentMap.get(g.assignedAgentId ?? "");
      return {
        agentId: g.assignedAgentId,
        name: agent
          ? `${agent.firstName} ${agent.lastName}`
          : "Non assigné",
        role: agent?.role ?? "AGENT",
        clientCount: g._count.id,
      };
    });

    // Monthly trend: group by year-month
    const trendMap = new Map<string, number>();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      trendMap.set(key, 0);
    }

    for (const client of monthlyClients) {
      const d = new Date(client.createdAt);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      if (trendMap.has(key)) {
        trendMap.set(key, (trendMap.get(key) ?? 0) + 1);
      }
    }

    const monthNames = [
      "Jan", "Fév", "Mar", "Avr", "Mai", "Juin",
      "Juil", "Août", "Sep", "Oct", "Nov", "Déc",
    ];

    const monthlyTrend = Array.from(trendMap.entries()).map(([key, count]) => {
      const [, monthStr] = key.split("-");
      const monthIndex = parseInt(monthStr, 10) - 1;
      return {
        month: key,
        label: monthNames[monthIndex] ?? key,
        clients: count,
      };
    });

    // Pipeline funnel
    const pipelineData = pipelineCounts.map((p) => ({
      stage: p.pipelineStage,
      count: p._count.id,
    }));

    const stats = {
      totalClients,
      newClientsThisMonth,
      visitsThisMonth,
      conversionRate,
      revenue,
    };

    return jsonOk({ stats, topAgents, monthlyTrend, pipelineData });
  },
);
