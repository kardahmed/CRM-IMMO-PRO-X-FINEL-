"use client";

import { useEffect, useState } from "react";
import { DashboardCardsGrid } from "@/components/dashboard/DashboardCards";
import { ConversionChart } from "@/components/dashboard/ConversionChart";
import { PipelineChart } from "@/components/dashboard/PipelineChart";
import { TopAgents } from "@/components/dashboard/TopAgents";
import { DailyVisits } from "@/components/dashboard/DailyVisits";
import { AgentOverview } from "@/components/dashboard/AgentOverview";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface IPropertyDistribution {
  name: string;
  value: number;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
interface IDashboardData {
  role: string;
  stats: any;
  conversionData?: any[];
  pipelineData?: any[];
  topAgents?: any[];
  todayVisits?: any[];
  propertyDistribution?: IPropertyDistribution[];
  welcomeMessage?: string;
  tasks?: any[];
}

export default function DashboardPage() {
  const [data, setData] = useState<IDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  async function fetchDashboard() {
    setLoading(true);
    setError(false);
    try {
      const res = await fetch("/api/v1/dashboard");
      if (!res.ok) throw new Error("Failed to fetch");
      const json = await res.json();
      setData(json);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchDashboard();
  }, []);

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
        <Button onClick={fetchDashboard} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" /> Réessayer
        </Button>
      </div>
    );
  }

  if (!data) return null;

  if (data.role === "CEO") {
    return (
      <div className="space-y-8 pb-10">
        <header>
          <h1 className="text-3xl font-black tracking-tight text-neutral-900 dark:text-neutral-100 uppercase">
            Vue d'ensemble <span className="text-primary italic">Executive</span>
          </h1>
          <p className="text-muted-foreground mt-1 font-medium">Analyse des performances immobilières en temps réel.</p>
        </header>

        {/* TOP STATS */}
        <DashboardCardsGrid stats={data.stats} />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Chart */}
          <div className="lg:col-span-2 space-y-6">
            <ConversionChart data={data.conversionData ?? []} />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <PipelineChart data={data.pipelineData ?? []} />
               <TopAgents agents={data.topAgents ?? []} />
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
             {/* Alerts Placeholder if needed, otherwise Today Visits & Distribution */}
             <DailyVisits visits={data.todayVisits ?? []} />

             {/* Simple Distribution Mock */}
             <div className="p-6 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-xl">
               <h3 className="font-black text-lg uppercase tracking-tight mb-4">Répartition Biens</h3>
               <div className="space-y-3">
                 {(data.propertyDistribution ?? []).map((p: IPropertyDistribution, i: number) => (
                   <div key={i} className="flex flex-col gap-1">
                     <div className="flex justify-between text-xs font-bold">
                       <span>{p.name}</span>
                       <span>{p.value}%</span>
                     </div>
                     <div className="h-1.5 w-full bg-white/20 rounded-full overflow-hidden">
                       <div className="h-full bg-white rounded-full" style={{ width: `${p.value}%` }} />
                     </div>
                   </div>
                 ))}
               </div>
             </div>
          </div>
        </div>
      </div>
    );
  }

  // AGENT VIEW
  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-10">
      <AgentOverview
        welcomeMessage={data.welcomeMessage ?? ""}
        stats={data.stats}
        tasks={data.tasks ?? []}
      />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
         <DailyVisits visits={data.todayVisits ?? []} />
         <div className="p-8 rounded-2xl bg-neutral-900 text-white flex flex-col justify-between overflow-hidden relative group">
           <RefreshCw className="absolute -right-4 -bottom-4 h-32 w-32 text-white/5 group-hover:rotate-180 transition-transform duration-1000" />
           <div className="relative">
             <h3 className="text-xl font-bold mb-2">Relances du jour</h3>
             <p className="text-neutral-400 text-sm">Vous avez {data.stats.todayFollowUps} clients à recontacter aujourd'hui.</p>
           </div>
           <Button className="mt-8 bg-white text-black hover:bg-neutral-200 font-bold relative">
             Commencer la session
           </Button>
         </div>
      </div>
    </div>
  );
}
