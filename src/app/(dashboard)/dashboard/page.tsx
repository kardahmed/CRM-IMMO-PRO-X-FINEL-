"use client";

import { useEffect, useState, useCallback } from "react";
import { DashboardCardsGrid } from "@/components/dashboard/DashboardCards";
import { PipelineChart } from "@/components/dashboard/PipelineChart";
import { TopAgents } from "@/components/dashboard/TopAgents";
import { DailyVisits } from "@/components/dashboard/DailyVisits";
import { AgentOverview } from "@/components/dashboard/AgentOverview";
import { MultiComparisonChart } from "@/components/dashboard/MultiComparisonChart";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  AlertCircle, 
  RefreshCw, 
  Search, 
  PlusCircle, 
  Users, 
  Calendar, 
  ArrowRight,
  Filter,
  CheckCircle2,
  Clock
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface ICeoStats {
  totalClients: number;
  newClients: number;
  todayVisits: number;
  overdueTasks: number;
}

interface IAgentStats {
  activeClients: number;
  monthlyGoal: number;
  todayFollowUps: number;
  todayVisits: number;
  overdueTasks: number;
}

interface IPipelineItem {
  name: string;
  value: number;
}

interface IVisit {
  id: string;
  time: string;
  client: string;
  property: string;
}

interface IAgentTask {
  id: number;
  title: string;
  overdue: boolean;
}

interface IPropertyDistribution {
  name: string;
  value: number;
}

interface IDashboardData {
  role: string;
  stats: ICeoStats | IAgentStats;
  conversionData?: Array<{ date: string; value: number }>;
  comparisonData?: Array<{ date: string; leads: number; visits: number }>;
  pipelineData?: IPipelineItem[];
  topAgents?: Array<{ name: string; sales: number; avatar: string }>;
  todayVisits?: IVisit[];
  propertyDistribution?: IPropertyDistribution[];
  welcomeMessage?: string;
  tasks?: IAgentTask[];
}

function buildCeoCards(stats: ICeoStats, period: string) {
  const periodLabel = period === "7d" ? "7 derniers jours" : period === "90d" ? "90 derniers jours" : "30 derniers jours";
  return [
    { label: "Total Clients", value: String(stats.totalClients), trend: `+${stats.newClients}`, trendDescription: periodLabel, color: "blue" },
    { label: "Visites Aujourd'hui", value: String(stats.todayVisits), trend: "Direct", trendDescription: "Aujourd'hui", color: "green" },
    { label: "Nouveaux Prospects", value: String(stats.newClients), trend: `+${stats.newClients}`, trendDescription: periodLabel, color: "purple" },
    { label: "Tâches en retard", value: String(stats.overdueTasks), trend: stats.overdueTasks > 0 ? `-${stats.overdueTasks}` : "À jour", trendDescription: "Action requise", color: "orange" },
  ];
}

export default function DashboardPage() {
  const [data, setData] = useState<IDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [period, setPeriod] = useState("30d");
  const [search, setSearch] = useState("");

  const fetchDashboard = useCallback(async (p: string) => {
    setLoading(true);
    setError(false);
    try {
      const res = await fetch(`/api/v1/dashboard?period=${p}`);
      if (!res.ok) throw new Error("Failed to fetch");
      const json = await res.json();
      setData(json.data ?? json);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard(period);
  }, [period, fetchDashboard]);

  if (loading) {
    return (
      <div className="space-y-8 animate-pulse">
        <Skeleton className="h-10 w-[250px]" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-32 rounded-xl" />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <Skeleton className="h-[400px] lg:col-span-2 rounded-xl" />
          <Skeleton className="h-[400px] rounded-xl" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
        <AlertCircle className="h-12 w-12 text-destructive" />
        <p className="text-xl font-bold">Impossible de charger le tableau de bord</p>
        <Button onClick={() => fetchDashboard(period)} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" /> Reessayer
        </Button>
      </div>
    );
  }

  if (!data) return null;

  if (data.role === "CEO" || data.role === "ADMIN") {
    const ceoStats = data.stats as ICeoStats;
    return (
      <div className="space-y-8 pb-10">
        {/* Superior Header */}
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6">
          <header>
            <h1 className="text-4xl font-black tracking-tight text-neutral-900 dark:text-neutral-100 uppercase flex items-center gap-3">
              Dashboard
              <span className="text-primary italic text-2xl lowercase font-medium tracking-normal opacity-70">executive</span>
            </h1>
            <p className="text-muted-foreground mt-1 font-bold text-sm uppercase tracking-widest opacity-60">
              {data.welcomeMessage || "Analyse des performances immobilières"}
            </p>
          </header>

          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[280px]">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60" />
              <Input 
                placeholder="Rechercher client, agent, projet..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 h-12 bg-white dark:bg-neutral-900 border-none ring-2 ring-neutral-100 dark:ring-neutral-800 focus:ring-primary rounded-2xl transition-all shadow-sm"
              />
            </div>
            
            <Select value={period} onValueChange={(v) => setPeriod(v ?? "30d")}>
              <SelectTrigger className="w-[160px] h-12 bg-white dark:bg-neutral-900 border-none ring-2 ring-neutral-100 dark:ring-neutral-800 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-sm">
                <Filter className="h-3.5 w-3.5 mr-2 text-primary" />
                <SelectValue placeholder="Période" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">7 derniers jours</SelectItem>
                <SelectItem value="30d">30 derniers jours</SelectItem>
                <SelectItem value="90d">90 derniers jours</SelectItem>
                <SelectItem value="all">Tout le temps</SelectItem>
              </SelectContent>
            </Select>

            <Button 
              variant="outline" 
              size="icon" 
              className="h-12 w-12 rounded-2xl border-none ring-2 ring-neutral-100 dark:ring-neutral-800 bg-white dark:bg-neutral-900 text-primary shadow-sm active:scale-95 transition-all"
              onClick={() => fetchDashboard(period)}
            >
              <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
            </Button>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { label: "Nouveau Client", sub: "Ajouter un prospect", icon: Users, href: "/clients/new", color: "text-blue-500 bg-blue-50" },
            { label: "Nouvelle Visite", sub: "Planifier sur le calendrier", icon: Calendar, href: "/visits", color: "text-emerald-500 bg-emerald-50" },
            { label: "Pipeline", sub: "Gérer le tunnel de vente", icon: ArrowRight, href: "/pipeline", color: "text-purple-500 bg-purple-50" },
          ].map((action, i) => (
            <button
              key={i}
              onClick={() => window.location.href = action.href}
              className="group flex items-center justify-between p-5 rounded-3xl bg-white dark:bg-neutral-900 border-2 border-neutral-50 dark:border-neutral-800 hover:border-primary/20 hover:shadow-xl hover:-translate-y-1 transition-all duration-500"
            >
              <div className="flex items-center gap-4">
                <div className={cn("p-3 rounded-2xl transition-transform group-hover:scale-110 duration-500", action.color)}>
                  <action.icon className="h-6 w-6" />
                </div>
                <div className="text-left">
                  <p className="font-black uppercase tracking-tight text-sm">{action.label}</p>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{action.sub}</p>
                </div>
              </div>
              <PlusCircle className="h-5 w-5 text-muted-foreground/30 group-hover:text-primary transition-colors" />
            </button>
          ))}
        </div>

        <DashboardCardsGrid stats={buildCeoCards(ceoStats, period)} />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <MultiComparisonChart data={data.comparisonData ?? []} />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
               <PipelineChart data={data.pipelineData ?? []} />
               <TopAgents agents={data.topAgents ?? []} />
            </div>
          </div>

          <div className="space-y-8">
             <DailyVisits visits={data.todayVisits ?? []} />

             <div className="p-8 rounded-[32px] bg-neutral-900 text-white shadow-2xl relative overflow-hidden group">
               <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 blur-[64px] group-hover:bg-primary/40 transition-all" />
               <h3 className="font-black text-xl uppercase tracking-tighter mb-6 relative z-10 flex items-center gap-2">
                 Répartition Biens
                 <div className="h-1.5 w-1.5 rounded-full bg-primary animate-ping" />
               </h3>
               <div className="space-y-6 relative z-10">
                 {(data.propertyDistribution ?? []).map((p, i) => (
                   <div key={i} className="flex flex-col gap-2">
                     <div className="flex justify-between items-end">
                       <span className="text-[11px] font-black uppercase tracking-widest text-neutral-400">{p.name}</span>
                       <span className="text-lg font-black tabular-nums">{p.value}%</span>
                     </div>
                     <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                       <div className="h-full bg-primary rounded-full group-hover:shadow-[0_0_12px_rgba(var(--primary),0.5)] transition-all" style={{ width: `${p.value}%` }} />
                     </div>
                   </div>
                 ))}
               </div>
               
               <div className="mt-8 pt-6 border-t border-white/5 flex items-center justify-between">
                 <div className="flex items-center gap-2">
                   <CheckCircle2 className="h-4 w-4 text-primary" />
                   <span className="text-[10px] font-black uppercase tracking-widest opacity-60">Inventaire à jour</span>
                 </div>
                 <Clock className="h-4 w-4 text-neutral-500" />
               </div>
             </div>
          </div>
        </div>
      </div>
    );
  }

  // AGENT VIEW
  const agentStats = data.stats as IAgentStats;
  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-10">
      <AgentOverview
        welcomeMessage={data.welcomeMessage ?? ""}
        stats={agentStats}
        tasks={data.tasks ?? []}
      />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
         <DailyVisits visits={data.todayVisits ?? []} />
         <div className="p-8 rounded-2xl bg-neutral-900 text-white flex flex-col justify-between overflow-hidden relative group">
           <RefreshCw className="absolute -right-4 -bottom-4 h-32 w-32 text-white/5 group-hover:rotate-180 transition-transform duration-1000" />
           <div className="relative">
             <h3 className="text-xl font-bold mb-2">Relances du jour</h3>
             <p className="text-neutral-400 text-sm">Vous avez {agentStats.todayFollowUps} clients a recontacter aujourd&apos;hui.</p>
           </div>
           <Button
             className="mt-8 bg-white text-black hover:bg-neutral-200 font-bold relative"
             onClick={() => window.location.href = "/clients"}
           >
             Commencer la session
           </Button>
         </div>
      </div>
    </div>
  );
}
