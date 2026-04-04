import React from "react";
import {
  Document,
  Page,
  View,
  Text,
  StyleSheet,
} from "@react-pdf/renderer";
import { prisma } from "@/lib/prisma";
import { renderDocumentToPdf } from "@/lib/pdf-renderer";

// ============================================================================
// Types
// ============================================================================

export interface IReportFilters {
  periodStart: Date;
  periodEnd: Date;
  compareStart?: Date;
  compareEnd?: Date;
  agentId?: string;
  projectId?: string;
}

interface IAgentStats {
  agentId: string;
  agentName: string;
  visits: number;
  sales: number;
  revenue: number;
  conversionRate: number;
}

interface IReportData {
  tenantName: string;
  period: { start: Date; end: Date };
  comparison: { start: Date; end: Date } | null;
  kpis: {
    totalVisits: number;
    totalSales: number;
    totalRevenue: number;
    conversionRate: number;
    prevVisits: number | null;
    prevSales: number | null;
    prevRevenue: number | null;
    prevConversionRate: number | null;
  };
  agentStats: IAgentStats[];
  projectName: string | null;
}

// ============================================================================
// Chargement des données
// ============================================================================

async function loadReportData(
  tenantId: string,
  filters: IReportFilters,
): Promise<IReportData> {
  const { periodStart, periodEnd, compareStart, compareEnd, agentId, projectId } = filters;

  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { name: true },
  });

  let projectName: string | null = null;
  if (projectId) {
    const project = await prisma.project.findFirst({
      where: { id: projectId, tenantId },
      select: { name: true },
    });
    projectName = project?.name ?? null;
  }

  // --- KPIs période principale ---
  const visitWhere = {
    tenantId,
    scheduledAt: { gte: periodStart, lte: periodEnd },
    ...(agentId ? { agentId } : {}),
    ...(projectId ? { property: { projectId } } : {}),
  };

  const totalVisits = await prisma.visit.count({ where: visitWhere });

  const completedVisits = await prisma.visit.count({
    where: { ...visitWhere, status: "COMPLETED" },
  });

  const paymentWhere = {
    tenantId,
    createdAt: { gte: periodStart, lte: periodEnd },
    status: "COMPLETED" as const,
    ...(agentId ? { client: { assignedAgentId: agentId } } : {}),
    ...(projectId ? { property: { projectId } } : {}),
  };

  const salesData = await prisma.payment.aggregate({
    where: paymentWhere,
    _count: true,
    _sum: { amount: true },
  });

  const totalSales = salesData._count;
  const totalRevenue = Number(salesData._sum.amount ?? 0);
  const conversionRate = completedVisits > 0
    ? Math.round((totalSales / completedVisits) * 100)
    : 0;

  // --- KPIs période de comparaison ---
  let prevVisits: number | null = null;
  let prevSales: number | null = null;
  let prevRevenue: number | null = null;
  let prevConversionRate: number | null = null;

  if (compareStart && compareEnd) {
    const prevVisitWhere = {
      tenantId,
      scheduledAt: { gte: compareStart, lte: compareEnd },
      ...(agentId ? { agentId } : {}),
      ...(projectId ? { property: { projectId } } : {}),
    };

    prevVisits = await prisma.visit.count({ where: prevVisitWhere });

    const prevCompletedVisits = await prisma.visit.count({
      where: { ...prevVisitWhere, status: "COMPLETED" },
    });

    const prevPaymentWhere = {
      tenantId,
      createdAt: { gte: compareStart, lte: compareEnd },
      status: "COMPLETED" as const,
      ...(agentId ? { client: { assignedAgentId: agentId } } : {}),
      ...(projectId ? { property: { projectId } } : {}),
    };

    const prevSalesData = await prisma.payment.aggregate({
      where: prevPaymentWhere,
      _count: true,
      _sum: { amount: true },
    });

    prevSales = prevSalesData._count;
    prevRevenue = Number(prevSalesData._sum.amount ?? 0);
    prevConversionRate = prevCompletedVisits > 0
      ? Math.round((prevSales / prevCompletedVisits) * 100)
      : 0;
  }

  // --- Stats par agent ---
  const agents = await prisma.user.findMany({
    where: {
      tenantId,
      role: { in: ["AGENT", "SUPERVISOR"] },
      isActive: true,
      ...(agentId ? { id: agentId } : {}),
    },
    select: { id: true, firstName: true, lastName: true },
  });

  const agentStats: IAgentStats[] = [];

  for (const agent of agents) {
    const agentVisitWhere = {
      tenantId,
      agentId: agent.id,
      scheduledAt: { gte: periodStart, lte: periodEnd },
      ...(projectId ? { property: { projectId } } : {}),
    };

    const agentVisits = await prisma.visit.count({ where: agentVisitWhere });

    const agentCompleted = await prisma.visit.count({
      where: { ...agentVisitWhere, status: "COMPLETED" },
    });

    const agentPayments = await prisma.payment.aggregate({
      where: {
        tenantId,
        createdAt: { gte: periodStart, lte: periodEnd },
        status: "COMPLETED",
        client: { assignedAgentId: agent.id },
        ...(projectId ? { property: { projectId } } : {}),
      },
      _count: true,
      _sum: { amount: true },
    });

    const agentSalesCount = agentPayments._count;
    const agentRevenue = Number(agentPayments._sum.amount ?? 0);

    agentStats.push({
      agentId: agent.id,
      agentName: `${agent.firstName} ${agent.lastName}`,
      visits: agentVisits,
      sales: agentSalesCount,
      revenue: agentRevenue,
      conversionRate: agentCompleted > 0
        ? Math.round((agentSalesCount / agentCompleted) * 100)
        : 0,
    });
  }

  agentStats.sort((a, b) => b.revenue - a.revenue);

  return {
    tenantName: tenant?.name ?? "CRM IMMO PRO X",
    period: { start: periodStart, end: periodEnd },
    comparison: compareStart && compareEnd
      ? { start: compareStart, end: compareEnd }
      : null,
    kpis: {
      totalVisits,
      totalSales,
      totalRevenue,
      conversionRate,
      prevVisits,
      prevSales,
      prevRevenue,
      prevConversionRate,
    },
    agentStats,
    projectName,
  };
}

// ============================================================================
// Helpers
// ============================================================================

function formatDate(d: Date): string {
  return d.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
}

function formatPrice(n: number): string {
  return new Intl.NumberFormat("fr-DZ", { maximumFractionDigits: 0 }).format(n) + " DA";
}

function deltaText(current: number, previous: number | null): string {
  if (previous === null || previous === 0) return "";
  const delta = Math.round(((current - previous) / previous) * 100);
  return ` (${delta >= 0 ? "+" : ""}${delta}%)`;
}

function deltaColor(current: number, previous: number | null): string {
  if (previous === null || previous === 0) return "#1e293b";
  return current >= previous ? "#16a34a" : "#dc2626";
}

// ============================================================================
// Styles
// ============================================================================

const c = {
  dark: "#1e293b",
  gray: "#64748b",
  lightGray: "#94a3b8",
  border: "#e2e8f0",
  bgLight: "#f1f5f9",
  accent: "#3b82f6",
};

const rs = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: "Helvetica",
    fontSize: 11,
    color: c.dark,
    lineHeight: 1.5,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    borderBottomWidth: 2,
    borderBottomColor: c.accent,
    paddingBottom: 12,
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: "Helvetica-Bold",
    color: c.dark,
  },
  headerSub: {
    fontSize: 12,
    color: c.gray,
  },
  headerRight: {
    alignItems: "flex-end",
  },
  headerDate: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
  },
  headerMeta: {
    fontSize: 10,
    color: c.gray,
    marginTop: 2,
  },
  headerSmall: {
    fontSize: 9,
    color: c.lightGray,
    marginTop: 3,
  },
  kpiRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 20,
  },
  kpiCard: {
    flex: 1,
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: c.border,
    borderRadius: 6,
    padding: 12,
    alignItems: "center",
  },
  kpiLabel: {
    fontSize: 9,
    color: c.gray,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  kpiValue: {
    fontSize: 20,
    fontFamily: "Helvetica-Bold",
    color: c.dark,
    marginTop: 3,
  },
  kpiDelta: {
    fontSize: 10,
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: 12,
    fontFamily: "Helvetica-Bold",
    color: c.dark,
    marginBottom: 10,
  },
  chartRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 5,
  },
  chartLabel: {
    width: 110,
    fontSize: 9,
    color: c.gray,
  },
  chartBarBg: {
    flex: 1,
    height: 16,
    backgroundColor: c.border,
    borderRadius: 3,
    marginHorizontal: 6,
  },
  chartBarFill: {
    height: 16,
    backgroundColor: c.accent,
    borderRadius: 3,
  },
  chartAmount: {
    width: 90,
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    textAlign: "right",
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: c.bgLight,
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  tableHeaderCell: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: c.gray,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: c.bgLight,
  },
  tableCell: {
    fontSize: 10,
  },
  tableCellBold: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
  },
  footer: {
    marginTop: 28,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: c.border,
    alignItems: "center",
  },
  footerText: {
    fontSize: 9,
    color: c.lightGray,
  },
  emptyText: {
    fontSize: 11,
    color: c.lightGray,
    textAlign: "center",
    paddingVertical: 16,
  },
});

// ============================================================================
// Build report React-PDF element
// ============================================================================

function buildReportDocument(data: IReportData): React.ReactElement {
  const { kpis, agentStats } = data;

  const kpiItems: Array<{
    label: string;
    display: string;
    raw: number;
    prev: number | null;
  }> = [
    { label: "Visites", display: String(kpis.totalVisits), raw: kpis.totalVisits, prev: kpis.prevVisits },
    { label: "Ventes", display: String(kpis.totalSales), raw: kpis.totalSales, prev: kpis.prevSales },
    { label: "Chiffre d'affaires", display: formatPrice(kpis.totalRevenue), raw: kpis.totalRevenue, prev: kpis.prevRevenue },
    { label: "Taux conversion", display: `${kpis.conversionRate}%`, raw: kpis.conversionRate, prev: kpis.prevConversionRate },
  ];

  const maxRevenue = Math.max(...agentStats.map((a) => a.revenue), 1);

  const kpiCards = kpiItems.map((k, i) =>
    React.createElement(
      View,
      { key: `kpi-${i}`, style: rs.kpiCard },
      React.createElement(Text, { style: rs.kpiLabel }, k.label),
      React.createElement(Text, { style: rs.kpiValue }, k.display),
      k.prev !== null && k.prev !== 0
        ? React.createElement(
            Text,
            { style: [rs.kpiDelta, { color: deltaColor(k.raw, k.prev) }] },
            deltaText(k.raw, k.prev),
          )
        : null,
    ),
  );

  const chartBars = agentStats.slice(0, 10).map((a, i) => {
    const pct = Math.round((a.revenue / maxRevenue) * 100);
    return React.createElement(
      View,
      { key: `bar-${i}`, style: rs.chartRow },
      React.createElement(Text, { style: rs.chartLabel }, a.agentName),
      React.createElement(
        View,
        { style: rs.chartBarBg },
        React.createElement(View, { style: [rs.chartBarFill, { width: `${pct}%` }] }),
      ),
      React.createElement(Text, { style: rs.chartAmount }, formatPrice(a.revenue)),
    );
  });

  const agentRows = agentStats.map((a, i) =>
    React.createElement(
      View,
      { key: `agent-${i}`, style: rs.tableRow },
      React.createElement(Text, { style: [rs.tableCellBold, { width: "8%" }] }, String(i + 1)),
      React.createElement(Text, { style: [rs.tableCell, { width: "27%" }] }, a.agentName),
      React.createElement(Text, { style: [rs.tableCell, { width: "13%", textAlign: "center" }] }, String(a.visits)),
      React.createElement(Text, { style: [rs.tableCell, { width: "13%", textAlign: "center" }] }, String(a.sales)),
      React.createElement(Text, { style: [rs.tableCellBold, { width: "24%", textAlign: "right" }] }, formatPrice(a.revenue)),
      React.createElement(Text, { style: [rs.tableCell, { width: "15%", textAlign: "center" }] }, `${a.conversionRate}%`),
    ),
  );

  return React.createElement(
    Document,
    null,
    React.createElement(
      Page,
      { size: "A4", style: rs.page },
      // Header
      React.createElement(
        View,
        { style: rs.header },
        React.createElement(
          View,
          null,
          React.createElement(Text, { style: rs.headerTitle }, data.tenantName),
          React.createElement(Text, { style: rs.headerSub }, "Rapport de performance"),
        ),
        React.createElement(
          View,
          { style: rs.headerRight },
          React.createElement(
            Text,
            { style: rs.headerDate },
            `${formatDate(data.period.start)} — ${formatDate(data.period.end)}`,
          ),
          data.comparison
            ? React.createElement(
                Text,
                { style: rs.headerMeta },
                `Comparé à : ${formatDate(data.comparison.start)} — ${formatDate(data.comparison.end)}`,
              )
            : null,
          data.projectName
            ? React.createElement(Text, { style: rs.headerMeta }, `Projet : ${data.projectName}`)
            : null,
          React.createElement(
            Text,
            { style: rs.headerSmall },
            `Généré le ${formatDate(new Date())}`,
          ),
        ),
      ),
      // KPI cards
      React.createElement(View, { style: rs.kpiRow }, ...kpiCards),
      // Chart section
      React.createElement(
        View,
        { style: { marginBottom: 20 } },
        React.createElement(Text, { style: rs.sectionTitle }, "CA par agent"),
        chartBars.length > 0
          ? React.createElement(View, null, ...chartBars)
          : React.createElement(Text, { style: rs.emptyText }, "Aucune donnée"),
      ),
      // Agent table
      React.createElement(
        View,
        null,
        React.createElement(Text, { style: rs.sectionTitle }, "Détail par agent"),
        React.createElement(
          View,
          { style: rs.tableHeader },
          React.createElement(Text, { style: [rs.tableHeaderCell, { width: "8%" }] }, "#"),
          React.createElement(Text, { style: [rs.tableHeaderCell, { width: "27%" }] }, "Agent"),
          React.createElement(Text, { style: [rs.tableHeaderCell, { width: "13%", textAlign: "center" }] }, "Visites"),
          React.createElement(Text, { style: [rs.tableHeaderCell, { width: "13%", textAlign: "center" }] }, "Ventes"),
          React.createElement(Text, { style: [rs.tableHeaderCell, { width: "24%", textAlign: "right" }] }, "CA"),
          React.createElement(Text, { style: [rs.tableHeaderCell, { width: "15%", textAlign: "center" }] }, "Conversion"),
        ),
        agentRows.length > 0
          ? React.createElement(View, null, ...agentRows)
          : React.createElement(Text, { style: rs.emptyText }, "Aucun agent"),
      ),
      // Footer
      React.createElement(
        View,
        { style: rs.footer },
        React.createElement(
          Text,
          { style: rs.footerText },
          `CRM IMMO PRO X — Rapport confidentiel — ${data.tenantName}`,
        ),
      ),
    ),
  );
}

// ============================================================================
// API publique
// ============================================================================

/**
 * Génère un rapport PDF de performance.
 * Retourne un Buffer PDF.
 */
export async function generateReport(
  tenantId: string,
  filters: IReportFilters,
): Promise<Buffer> {
  const data = await loadReportData(tenantId, filters);
  const element = buildReportDocument(data);
  return renderDocumentToPdf(element);
}
