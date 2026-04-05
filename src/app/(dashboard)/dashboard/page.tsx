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
  Clock,
  Zap
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
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
      <div className="space-y-10 animate-pulse pb-20">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-8">
          <div className="space-y-4">
            <Skeleton className="h-12 w-[300px] rounded-2xl" />
            <Skeleton className="h-4 w-[200px] rounded-full" />
          </div>
          <div className="flex gap-4">
            <Skeleton className="h-14 w-[320px] rounded-2xl" />
            <Skeleton className="h-14 w-[180px] rounded-2xl" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-24 rounded-[28px]" />)}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-40 rounded-[20px]" />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <Skeleton className="h-[500px] lg:col-span-2 rounded-[32px]" />
          <Skeleton className="h-[500px] rounded-[32px]" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh] gap-6 text-center">
        <div className="p-6 rounded-[32px] bg-rose-50 border border-rose-100 shadow-stripe">
          <AlertCircle className="h-12 w-12 text-rose-500 mx-auto mb-4" />
          <h2 className="text-2xl font-black text-foreground tracking-tight uppercase italic mb-2">Erreur Système</h2>
          <p className="text-muted-foreground font-medium max-w-sm">Le moteur PRO-X n&apos;a pas pu synchroniser les données du dashboard.</p>
        </div>
        <Button onClick={() => fetchDashboard(period)} variant="outline" className="h-14 px-10 rounded-full font-black uppercase tracking-widest border-border shadow-stripe hover:bg-accent">
          <RefreshCw className="h-4 w-4 mr-3" /> Forcer la Synchronisation
        </Button>
      </div>
    );
  }

  if (!data) return null;

  if (data.role === "CEO" || data.role === "ADMIN") {
    const ceoStats = data.stats as ICeoStats;
    return (
      <div className="space-y-10 pb-20 animate-in fade-in duration-700">
        {/* Superior Header */}
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-8">
          <header className="space-y-1">
            <h1 className="text-5xl font-black tracking-tighter text-foreground flex items-center gap-3">
              Tableau de bord
              <span className="text-primary italic text-3xl font-medium tracking-normal opacity-40">pro-x</span>
            </h1>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-[0.3em] opacity-60">
              {data.welcomeMessage || "Intelligence Immobilière & Flux de Performance"}
            </p>
          </header>

          <div className="flex flex-wrap items-center gap-4">
            <div className="relative flex-1 min-w-[320px] group">
              <div className="absolute inset-0 bg-primary/5 blur-xl opacity-0 group-focus-within:opacity-100 transition-opacity" />
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-primary/40 group-focus-within:text-primary transition-colors" />
              <Input 
                placeholder="Rechercher dossiers, agents ou projets..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-11 h-14 bg-card border-border shadow-stripe focus:border-primary/30 focus:ring-4 focus:ring-primary/5 rounded-2xl transition-all font-medium text-foreground"
              />
            </div>
            
            <Select value={period} onValueChange={(v) => setPeriod(v ?? "30d")}>
              <SelectTrigger className="w-[180px] h-14 bg-card border-border shadow-stripe rounded-2xl font-black uppercase text-xs tracking-widest text-muted-foreground hover:bg-accent transition-all">
                <Filter className="h-3.5 w-3.5 mr-2 text-primary" />
                <SelectValue placeholder="Période" />
              </SelectTrigger>
              <SelectContent className="rounded-2xl border-border shadow-stripe-lg">
                <SelectGroup>
                  <SelectItem value="7d" className="text-xs font-black uppercase tracking-widest">7 derniers jours</SelectItem>
                  <SelectItem value="30d" className="text-xs font-black uppercase tracking-widest">30 derniers jours</SelectItem>
                  <SelectItem value="90d" className="text-xs font-black uppercase tracking-widest">90 derniers jours</SelectItem>
                  <SelectItem value="all" className="text-xs font-black uppercase tracking-widest">Tout le temps</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              size="icon"
              aria-label="Actualiser les données"
              className={cn(
                "h-14 w-14 rounded-2xl border-border bg-card text-primary shadow-stripe hover:shadow-stripe-lg active:scale-95 transition-all outline-none",
                loading && "animate-pulse"
              )}
              onClick={() => fetchDashboard(period)}
            >
              <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
            </Button>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { label: "Nouveau Client", sub: "Propulser un prospect", icon: Users, href: "/clients/new", color: "text-primary bg-primary/5 border-primary/10" },
            { label: "Nouvelle Visite", sub: "Planifier le succès", icon: Calendar, href: "/visits", color: "text-emerald-600 bg-emerald-500/5 border-emerald-500/10" },
            { label: "Pipeline 360°", sub: "Gérer le tunnel", icon: ArrowRight, href: "/pipeline", color: "text-emerald-700 bg-emerald-700/5 border-emerald-700/10" },
          ].map((action, i) => (
            <button
              key={i}
              onClick={() => window.location.href = action.href}
              className="group flex items-center justify-between p-6 rounded-[28px] bg-card border border-border shadow-stripe hover:shadow-stripe-lg hover:-translate-y-1 transition-all duration-500 text-left"
            >
              <div className="flex items-center gap-5">
                <div className={cn("p-4 rounded-2xl border transition-all duration-500 group-hover:scale-110 group-hover:rotate-3", action.color)}>
                  <action.icon className="h-6 w-6" />
                </div>
                <div>
                  <p className="font-black italic uppercase tracking-tighter text-base text-foreground">{action.label}</p>
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-[0.2em] opacity-60">{action.sub}</p>
                </div>
              </div>
              <PlusCircle className="h-5 w-5 text-neutral-200 group-hover:text-primary transition-colors" />
            </button>
          ))}
        </div>

        <DashboardCardsGrid stats={buildCeoCards(ceoStats, period)} />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-10">
            {/* Health & Inventory Control (REPOSITIONED & IMPROVED) */}
            <div className="p-8 md:p-10 rounded-[40px] bg-card border border-border shadow-stripe-lg relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 blur-[100px] -translate-y-1/2 translate-x-1/2" />
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-10">
                <div className="space-y-1">
                  <h3 className="font-black text-3xl uppercase tracking-tighter italic flex items-center gap-3 text-foreground">
                    Santé de l&apos;Inventaire
                    <div className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                  </h3>
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-[0.3em]">Répartition des stocks & Disponibilité PRO-X</p>
                </div>
                <div className="px-6 py-2 rounded-full bg-emerald-500/5 border border-emerald-500/10 flex items-center gap-3">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  <span className="text-xs font-bold uppercase tracking-widest text-emerald-700">Stock Optimal</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                {(data.propertyDistribution ?? []).map((p, i) => (
                  <div key={i} className="space-y-4">
                    <div className="flex justify-between items-end">
                      <span className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">{p.name}</span>
                      <span className="text-3xl font-black tabular-nums tracking-tighter text-foreground">{p.value}%</span>
                    </div>
                    <div className="h-3 w-full bg-accent rounded-full overflow-hidden p-0.5 border border-border/50">
                      <div 
                        className="h-full bg-primary rounded-full shadow-[0_0_15px_rgba(25,185,129,0.2)] transition-all duration-1000 ease-out" 
                        style={{ width: `${p.value}%` }} 
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <MultiComparisonChart data={data.comparisonData ?? []} />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
               <PipelineChart data={data.pipelineData ?? []} />
               <TopAgents agents={data.topAgents ?? []} />
            </div>
          </div>

          <div className="space-y-10">
             <DailyVisits visits={data.todayVisits ?? []} />
          </div>
        </div>
      </div>
    );
  }

  // AGENT VIEW
  const agentStats = data.stats as IAgentStats;
  return (
    <div className="max-w-6xl mx-auto space-y-10 pb-20 animate-in fade-in duration-700">
      <AgentOverview
        welcomeMessage={data.welcomeMessage ?? ""}
        stats={agentStats}
        tasks={data.tasks ?? []}
      />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
         <DailyVisits visits={data.todayVisits ?? []} />
         <div className="p-10 rounded-[40px] bg-neutral-900 border border-neutral-800 text-white flex flex-col justify-between overflow-hidden relative shadow-stripe-lg group">
           <RefreshCw className="absolute -right-6 -bottom-6 h-48 w-48 text-white/5 group-hover:rotate-180 transition-transform duration-1000" />
           <div className="relative space-y-4">
             <div className="h-14 w-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
               <RefreshCw className="h-6 w-6 text-primary" />
             </div>
             <h3 className="text-3xl font-black tracking-tighter italic uppercase text-white">Relances du jour</h3>
             <p className="text-neutral-400 text-lg font-medium leading-relaxed">
               Optimisez votre flux client. Vous avez <span className="text-primary font-black underline decoration-primary/30 underline-offset-4">{agentStats.todayFollowUps} prospects</span> prioritaires à recontacter.
             </p>
           </div>
           <Button
             className="mt-10 h-16 bg-primary text-white hover:opacity-90 font-black text-xl rounded-full shadow-stripe transition-all active:scale-95 relative z-10 uppercase tracking-tight italic"
             onClick={() => window.location.href = "/clients"}
           >
             Activez la Session Client
           </Button>
         </div>
      </div>
    </div>
  );
}
