"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { ArrowLeft, Users, Clock, AlertTriangle, CheckCircle2, XCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface IAgentStats {
  total: number;
  pending: number;
  inProgress: number;
  completed: number;
  cancelled: number;
  overdue: number;
  completionRate: number;
  avgCompletionTimeMinutes: number | null;
}

interface IAgentData {
  id: string;
  firstName: string;
  lastName: string;
  role: string;
  stats: IAgentStats;
}

// ---------------------------------------------------------------------------
// Role labels & colors
// ---------------------------------------------------------------------------
const ROLE_META: Record<string, { label: string; className: string }> = {
  AGENT: { label: "Agent", className: "bg-blue-500/15 text-blue-700" },
  SUPERVISOR: { label: "Superviseur", className: "bg-violet-500/15 text-violet-700" },
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function formatDuration(minutes: number | null): string {
  if (minutes === null) return "--";
  if (minutes < 60) return `${Math.round(minutes)} min`;
  if (minutes < 1440) {
    const h = Math.floor(minutes / 60);
    const m = Math.round(minutes % 60);
    return m > 0 ? `${h}h ${m}min` : `${h}h`;
  }
  const days = Math.round(minutes / 1440);
  return `${days} jour${days > 1 ? "s" : ""}`;
}

function getCompletionColor(rate: number): string {
  if (rate >= 80) return "bg-green-500";
  if (rate >= 50) return "bg-amber-500";
  return "bg-red-500";
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
export default function AutomationAgentsPage() {
  const [agents, setAgents] = useState<IAgentData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const fetchData = useCallback(async (from?: string, to?: string) => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (from) params.set("from", from);
      if (to) params.set("to", to);

      const qs = params.toString();
      const url = `/api/v1/automations/stats/by-agent${qs ? `?${qs}` : ""}`;

      const res = await fetch(url);
      const json = await res.json();

      if (json.success) {
        // Sort by completion rate descending
        const sorted = [...(json.data.agents as IAgentData[])].sort(
          (a, b) => b.stats.completionRate - a.stats.completionRate,
        );
        setAgents(sorted);
      } else {
        setError(json.error ?? "Erreur lors du chargement");
      }
    } catch {
      setError("Impossible de contacter le serveur");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleFilter = () => {
    fetchData(fromDate || undefined, toDate || undefined);
  };

  const handleReset = () => {
    setFromDate("");
    setToDate("");
    fetchData();
  };

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------
  return (
    <div className="flex flex-col gap-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-primary/10 text-primary">
            <Users className="h-7 w-7" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight uppercase">
              Performance des agents
            </h1>
            <p className="text-sm text-muted-foreground font-medium mt-0.5">
              Statistiques des automatisations par agent
            </p>
          </div>
        </div>
        <Link href="/dashboard/automations">
          <Button variant="outline" className="gap-2 font-bold">
            <ArrowLeft className="h-4 w-4" />
            Automatisations
          </Button>
        </Link>
      </div>

      {/* Period filter */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap items-end gap-4">
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="from-date"
                className="text-sm font-medium text-muted-foreground"
              >
                Du
              </label>
              <Input
                id="from-date"
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="w-44"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="to-date"
                className="text-sm font-medium text-muted-foreground"
              >
                Au
              </label>
              <Input
                id="to-date"
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="w-44"
              />
            </div>
            <Button onClick={handleFilter} className="font-semibold">
              Filtrer
            </Button>
            {(fromDate || toDate) && (
              <Button variant="ghost" onClick={handleReset} className="font-semibold">
                Reinitialiser
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Loading state */}
      {loading && (
        <div className="grid gap-4 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="flex flex-col gap-1.5">
                    <Skeleton className="h-5 w-36" />
                    <Skeleton className="h-4 w-20 rounded-full" />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Skeleton className="h-3 w-full rounded-full mb-4" />
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {Array.from({ length: 4 }).map((_, j) => (
                    <Skeleton key={j} className="h-14 rounded-lg" />
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Error state */}
      {!loading && error && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 gap-3 text-muted-foreground">
            <XCircle className="h-10 w-10 text-red-400" />
            <p>{error}</p>
            <Button variant="outline" size="sm" onClick={() => fetchData()}>
              Reessayer
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Empty state */}
      {!loading && !error && agents.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 gap-3 text-muted-foreground">
            <Users className="h-10 w-10" />
            <p>Aucun agent trouve pour cette periode</p>
          </CardContent>
        </Card>
      )}

      {/* Agent cards */}
      {!loading && !error && agents.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2">
          {agents.map((agent) => {
            const roleMeta = ROLE_META[agent.role] ?? {
              label: agent.role,
              className: "bg-muted text-muted-foreground",
            };
            const { stats } = agent;
            const barColor = getCompletionColor(stats.completionRate);

            return (
              <Card key={agent.id} className="transition-shadow hover:shadow-md">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {/* Avatar placeholder */}
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-sm">
                        {agent.firstName.charAt(0)}
                        {agent.lastName.charAt(0)}
                      </div>
                      <div>
                        <CardTitle className="text-base font-bold">
                          {agent.firstName} {agent.lastName}
                        </CardTitle>
                        <Badge
                          variant="secondary"
                          className={`${roleMeta.className} text-xs mt-0.5`}
                        >
                          {roleMeta.label}
                        </Badge>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-2xl font-black text-primary">
                        {stats.completionRate}%
                      </span>
                      <p className="text-xs text-muted-foreground font-medium">
                        Taux d&apos;execution
                      </p>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="flex flex-col gap-4">
                  {/* Progress bar */}
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>Progression</span>
                      <span>{stats.completionRate}%</span>
                    </div>
                    <div className="relative h-2.5 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${barColor}`}
                        style={{ width: `${Math.min(stats.completionRate, 100)}%` }}
                      />
                    </div>
                  </div>

                  {/* Stats grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    <div className="flex flex-col items-center rounded-lg bg-muted/50 p-2.5">
                      <span className="text-lg font-bold">{stats.total}</span>
                      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        Total
                      </span>
                    </div>
                    <div className="flex flex-col items-center rounded-lg bg-green-500/10 p-2.5">
                      <span className="text-lg font-bold text-green-700">
                        {stats.completed}
                      </span>
                      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        Terminees
                      </span>
                    </div>
                    <div className="flex flex-col items-center rounded-lg bg-amber-500/10 p-2.5">
                      <span className="text-lg font-bold text-amber-700">
                        {stats.pending}
                      </span>
                      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        En attente
                      </span>
                    </div>
                    <div className="flex flex-col items-center rounded-lg bg-red-500/10 p-2.5">
                      <span className="text-lg font-bold text-red-700">
                        {stats.overdue}
                      </span>
                      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        En retard
                      </span>
                    </div>
                  </div>

                  {/* Footer stats */}
                  <div className="flex items-center justify-between border-t pt-3 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5" />
                      <span>
                        Temps moyen :{" "}
                        <span className="font-semibold text-foreground">
                          {formatDuration(stats.avgCompletionTimeMinutes)}
                        </span>
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1">
                        <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
                        <span>{stats.completed}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <XCircle className="h-3.5 w-3.5 text-gray-400" />
                        <span>{stats.cancelled}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <AlertTriangle className="h-3.5 w-3.5 text-red-500" />
                        <span>{stats.overdue}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
