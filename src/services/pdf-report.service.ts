import { prisma } from "@/lib/prisma";
import { htmlToPdf } from "@/lib/puppeteer";

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

  // Tenant info
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { name: true },
  });

  // Project name si filtré
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

  // Ventes = paiements de type RESERVATION complétés dans la période
  const paymentWhere = {
    tenantId,
    createdAt: { gte: periodStart, lte: periodEnd },
    status: "COMPLETED" as const,
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

    // Ventes par agent = clients assignés à cet agent avec paiements complétés
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

    const agentSales = agentPayments._count;
    const agentRevenue = Number(agentPayments._sum.amount ?? 0);

    agentStats.push({
      agentId: agent.id,
      agentName: `${agent.firstName} ${agent.lastName}`,
      visits: agentVisits,
      sales: agentSales,
      revenue: agentRevenue,
      conversionRate: agentCompleted > 0
        ? Math.round((agentSales / agentCompleted) * 100)
        : 0,
    });
  }

  // Trier par CA décroissant
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
// Helpers HTML
// ============================================================================

function formatDate(d: Date): string {
  return d.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
}

function formatPrice(n: number): string {
  return new Intl.NumberFormat("fr-DZ", { maximumFractionDigits: 0 }).format(n) + " DA";
}

function renderDelta(current: number, previous: number | null): string {
  if (previous === null || previous === 0) return "";
  const delta = Math.round(((current - previous) / previous) * 100);
  const color = delta >= 0 ? "#16a34a" : "#dc2626";
  const arrow = delta >= 0 ? "&#9650;" : "&#9660;";
  return `<span style="color:${color};font-size:12px;margin-left:8px">${arrow} ${delta > 0 ? "+" : ""}${delta}%</span>`;
}

// ============================================================================
// Génération HTML du rapport
// ============================================================================

function buildReportHtml(data: IReportData): string {
  const { kpis, agentStats } = data;

  const kpiCards = [
    { label: "Visites", value: String(kpis.totalVisits), prev: kpis.prevVisits },
    { label: "Ventes", value: String(kpis.totalSales), prev: kpis.prevSales },
    { label: "Chiffre d'affaires", value: formatPrice(kpis.totalRevenue), prev: kpis.prevRevenue },
    { label: "Taux conversion", value: `${kpis.conversionRate}%`, prev: kpis.prevConversionRate },
  ];

  const kpiHtml = kpiCards
    .map(
      (k) => `
    <div style="flex:1;background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:16px;text-align:center">
      <div style="font-size:12px;color:#64748b;text-transform:uppercase;letter-spacing:0.5px">${k.label}</div>
      <div style="font-size:24px;font-weight:700;margin-top:4px;color:#1e293b">${k.value}${renderDelta(Number(k.value.replace(/[^0-9.-]/g, "")) || 0, k.prev)}</div>
    </div>`,
    )
    .join("");

  const agentRows = agentStats
    .map(
      (a, i) => `
    <tr style="border-bottom:1px solid #f1f5f9">
      <td style="padding:10px 12px;font-weight:600">${i + 1}</td>
      <td style="padding:10px 12px">${a.agentName}</td>
      <td style="padding:10px 12px;text-align:center">${a.visits}</td>
      <td style="padding:10px 12px;text-align:center">${a.sales}</td>
      <td style="padding:10px 12px;text-align:right;font-weight:600">${formatPrice(a.revenue)}</td>
      <td style="padding:10px 12px;text-align:center">${a.conversionRate}%</td>
    </tr>`,
    )
    .join("");

  // Graphique simple en barres CSS
  const maxRevenue = Math.max(...agentStats.map((a) => a.revenue), 1);
  const chartBars = agentStats
    .slice(0, 10)
    .map(
      (a) => `
    <div style="display:flex;align-items:center;margin-bottom:6px">
      <div style="width:120px;font-size:11px;color:#64748b;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${a.agentName}</div>
      <div style="flex:1;background:#e2e8f0;border-radius:4px;height:20px;margin:0 8px">
        <div style="background:#3b82f6;border-radius:4px;height:100%;width:${Math.round((a.revenue / maxRevenue) * 100)}%"></div>
      </div>
      <div style="width:100px;font-size:11px;text-align:right;font-weight:600">${formatPrice(a.revenue)}</div>
    </div>`,
    )
    .join("");

  const comparisonSection = data.comparison
    ? `<p style="font-size:12px;color:#64748b;margin-top:4px">Comparé à : ${formatDate(data.comparison.start)} — ${formatDate(data.comparison.end)}</p>`
    : "";

  const projectFilter = data.projectName
    ? `<p style="font-size:12px;color:#64748b">Projet : ${data.projectName}</p>`
    : "";

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #1e293b; line-height: 1.5; }
    table { width: 100%; border-collapse: collapse; }
    th { background: #f1f5f9; text-align: left; padding: 10px 12px; font-size: 12px; text-transform: uppercase; color: #64748b; letter-spacing: 0.5px; }
  </style>
</head>
<body>
  <!-- Header -->
  <div style="display:flex;justify-content:space-between;align-items:center;border-bottom:2px solid #3b82f6;padding-bottom:16px;margin-bottom:24px">
    <div>
      <h1 style="font-size:22px;font-weight:800;color:#1e293b">${data.tenantName}</h1>
      <p style="font-size:14px;color:#64748b">Rapport de performance</p>
    </div>
    <div style="text-align:right">
      <p style="font-size:13px;font-weight:600">${formatDate(data.period.start)} — ${formatDate(data.period.end)}</p>
      ${comparisonSection}
      ${projectFilter}
      <p style="font-size:11px;color:#94a3b8;margin-top:4px">Généré le ${formatDate(new Date())}</p>
    </div>
  </div>

  <!-- KPI Cards -->
  <div style="display:flex;gap:12px;margin-bottom:24px">
    ${kpiHtml}
  </div>

  <!-- Chart -->
  <div style="margin-bottom:24px">
    <h2 style="font-size:14px;font-weight:700;margin-bottom:12px;color:#1e293b">CA par agent</h2>
    ${chartBars || '<p style="color:#94a3b8;font-size:13px">Aucune donnée</p>'}
  </div>

  <!-- Agent Table -->
  <div>
    <h2 style="font-size:14px;font-weight:700;margin-bottom:12px;color:#1e293b">Détail par agent</h2>
    <table>
      <thead>
        <tr>
          <th>#</th>
          <th>Agent</th>
          <th style="text-align:center">Visites</th>
          <th style="text-align:center">Ventes</th>
          <th style="text-align:right">CA</th>
          <th style="text-align:center">Conversion</th>
        </tr>
      </thead>
      <tbody>
        ${agentRows || '<tr><td colspan="6" style="padding:20px;text-align:center;color:#94a3b8">Aucun agent</td></tr>'}
      </tbody>
    </table>
  </div>

  <!-- Footer -->
  <div style="margin-top:32px;padding-top:12px;border-top:1px solid #e2e8f0;text-align:center;font-size:11px;color:#94a3b8">
    CRM IMMO PRO X — Rapport confidentiel — ${data.tenantName}
  </div>
</body>
</html>`;
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
  const html = buildReportHtml(data);
  return htmlToPdf(html);
}
