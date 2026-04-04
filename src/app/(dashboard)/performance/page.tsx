"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BarChart3, Download, Users, TrendingUp, DollarSign, Home, Clock, Loader2 } from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
} from "recharts";

interface IPerformanceStats {
  totalClients: number;
  newClientsThisMonth: number;
  visitsThisMonth: number;
  conversionRate: number;
  revenue: number;
}

interface ITopAgent {
  agentId: string | null;
  name: string;
  role: string;
  clientCount: number;
}

interface IMonthlyTrend {
  month: string;
  label: string;
  clients: number;
}

interface IPipelineData {
  stage: string;
  count: number;
}

interface IPerformanceResponse {
  stats: IPerformanceStats;
  topAgents: ITopAgent[];
  monthlyTrend: IMonthlyTrend[];
  pipelineData: IPipelineData[];
}

const STAGE_LABELS: Record<string, string> = {
  NEW: "Nouveau",
  CONTACTED: "Contacté",
  QUALIFIED: "Qualifié",
  VISIT_SCHEDULED: "Visite programmée",
  VISITED: "Visite terminée",
  NEGOTIATION: "Négociation",
  RESERVED: "Réservation",
  SIGNED: "Signé",
  CLOSED: "Clôturé",
};

const FUNNEL_COLORS = [
  "#3b82f6", "#6366f1", "#8b5cf6", "#a855f7",
  "#d946ef", "#f59e0b", "#ef4444", "#10b981", "#14b8a6",
];

function formatCurrency(value: number): string {
  if (value >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(1)}B`;
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(0)}K`;
  return String(value);
}

export default function PerformancePage() {
  const [data, setData] = useState<IPerformanceResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch("/api/v1/performance");
        const json = await res.json();
        if (!json.success) {
          setError(json.error ?? "Erreur lors du chargement");
          return;
        }
        setData(json.data);
      } catch {
        setError("Impossible de contacter le serveur");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <p className="text-destructive font-bold">{error ?? "Données indisponibles"}</p>
        <Button variant="outline" onClick={() => window.location.reload()}>
          Réessayer
        </Button>
      </div>
    );
  }

  const { stats, topAgents, monthlyTrend, pipelineData } = data;

  const kpiGlobals = [
    { title: "Visites ce mois", value: String(stats.visitsThisMonth), icon: Home },
    { title: "Nouveaux clients", value: String(stats.newClientsThisMonth), icon: TrendingUp },
    { title: "Taux de Conversion", value: `${stats.conversionRate}%`, icon: Users },
    { title: "CA Généré (DA)", value: formatCurrency(stats.revenue), icon: DollarSign },
  ];

  const funnelData = pipelineData.map((p, i) => ({
    name: STAGE_LABELS[p.stage] ?? p.stage,
    value: p.count,
    fill: FUNNEL_COLORS[i % FUNNEL_COLORS.length],
  }));

  return (
    <div className="space-y-6 pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-600">
            <BarChart3 className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black uppercase tracking-tight">Performance & Analytics</h1>
            <p className="text-sm text-muted-foreground font-medium">Vue globale sur les KPIs de l&apos;agence</p>
          </div>
        </div>

        <Button variant="outline" className="gap-2 font-bold bg-white dark:bg-black">
          <Download className="h-4 w-4" /> Générer Rapport PDF
        </Button>
      </div>

      {/* 4 KPIs Globaux */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiGlobals.map((kpi, i) => (
          <Card key={i} className="shadow-sm">
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <p className="text-xs font-black uppercase text-muted-foreground mb-1">{kpi.title}</p>
                <p className="text-2xl font-black">{kpi.value}</p>
              </div>
              <div className={`p-3 rounded-full ${i === 0 ? 'bg-primary/10 text-primary' : i === 1 ? 'bg-green-100 text-green-600' : i === 2 ? 'bg-orange-100 text-orange-600' : 'bg-purple-100 text-purple-600'}`}>
                <kpi.icon className="h-6 w-6" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Area Chart — Monthly Trend */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-black">Tendance Clients (6 derniers mois)</CardTitle>
            <CardDescription>Nombre de nouveaux clients par mois</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorClients" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12 }} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  labelStyle={{ fontWeight: 'bold', marginBottom: '4px' }}
                />
                <Area type="monotone" dataKey="clients" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorClients)" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Funnel Chart Pipeline */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-black">Entonnoir de Conversion</CardTitle>
            <CardDescription>Répartition des clients par étape du pipeline</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={funnelData}
                layout="vertical"
                margin={{ top: 10, right: 30, left: 40, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} opacity={0.3} />
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 'bold' }} width={100} />
                <Tooltip
                  cursor={{ fill: 'transparent' }}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={24}>
                  {funnelData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Agents Table */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-base font-black">Performance par Agent</CardTitle>
          <CardDescription>Classement des agents par nombre de clients</CardDescription>
        </CardHeader>
        <CardContent>
          {topAgents.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">Aucun agent avec des clients assignés</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs uppercase bg-accent/50 text-muted-foreground border-b rounded-t-xl">
                  <tr>
                    <th className="px-4 py-3 font-bold rounded-tl-xl text-foreground">Agent</th>
                    <th className="px-4 py-3 font-bold text-center"><Users className="inline w-3.5 h-3.5 mr-1" />Clients</th>
                    <th className="px-4 py-3 font-bold text-center rounded-tr-xl"><Clock className="inline w-3.5 h-3.5 mr-1" />Rôle</th>
                  </tr>
                </thead>
                <tbody>
                  {topAgents.map((agent, i) => (
                    <tr key={agent.agentId ?? i} className="border-b last:border-0 hover:bg-accent/20 transition-colors">
                      <td className="px-4 py-3">
                        <p className="font-bold">{agent.name}</p>
                      </td>
                      <td className="px-4 py-3 text-center font-bold text-primary">{agent.clientCount}</td>
                      <td className="px-4 py-3 text-center">
                        <Badge variant="outline" className="text-[10px] uppercase font-black">{agent.role}</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
