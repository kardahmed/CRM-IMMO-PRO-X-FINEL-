"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface ISummary {
  pending: number;
  inProgress: number;
  completed: number;
  cancelled: number;
  overdue: number;
  total: number;
}

interface IByStage {
  stage: string;
  pending: number;
  inProgress: number;
  completed: number;
  cancelled: number;
  overdue: number;
}

interface IByType {
  type: string;
  _count: { _all: number };
}

interface IRecentTask {
  id: string;
  title: string;
  type: string;
  status: string;
  dueAt: string | null;
  pipelineStage: string;
  client: { firstName: string; lastName: string } | null;
  assignedTo: { firstName: string; lastName: string } | null;
}

interface IStatsData {
  summary: ISummary;
  byStage: IByStage[];
  byType: IByType[];
  recentTasks: IRecentTask[];
}

/* ------------------------------------------------------------------ */
/*  Metadata maps                                                      */
/* ------------------------------------------------------------------ */

const STAGE_META: Record<string, { label: string; color: string }> = {
  NEW: { label: "Nouveau", color: "bg-blue-500/15 text-blue-700" },
  CONTACTED: { label: "Contact\u00e9", color: "bg-cyan-500/15 text-cyan-700" },
  QUALIFIED: { label: "Qualifi\u00e9", color: "bg-violet-500/15 text-violet-700" },
  VISIT_SCHEDULED: {
    label: "Visite planifi\u00e9e",
    color: "bg-indigo-500/15 text-indigo-700",
  },
  VISITED: {
    label: "Visite effectu\u00e9e",
    color: "bg-sky-500/15 text-sky-700",
  },
  NEGOTIATION: {
    label: "N\u00e9gociation",
    color: "bg-amber-500/15 text-amber-700",
  },
  RESERVED: {
    label: "R\u00e9serv\u00e9",
    color: "bg-orange-500/15 text-orange-700",
  },
  SIGNED: {
    label: "Sign\u00e9",
    color: "bg-emerald-500/15 text-emerald-700",
  },
  CLOSED: {
    label: "Cl\u00f4tur\u00e9",
    color: "bg-green-500/15 text-green-700",
  },
};

const TYPE_META: Record<string, { label: string; color: string; bg: string }> =
  {
    CALL: {
      label: "Appel",
      color: "text-blue-700",
      bg: "bg-blue-500",
    },
    WHATSAPP: {
      label: "WhatsApp / SMS",
      color: "text-green-700",
      bg: "bg-green-500",
    },
    SMS: {
      label: "WhatsApp / SMS",
      color: "text-green-700",
      bg: "bg-green-500",
    },
    DOCUMENT: {
      label: "Document",
      color: "text-violet-700",
      bg: "bg-violet-500",
    },
    MEETING: {
      label: "R\u00e9union",
      color: "text-amber-700",
      bg: "bg-amber-500",
    },
  };

const STATUS_META: Record<
  string,
  { label: string; className: string }
> = {
  PENDING: {
    label: "En attente",
    className: "bg-yellow-100 text-yellow-800 border-yellow-200",
  },
  IN_PROGRESS: {
    label: "En cours",
    className: "bg-blue-100 text-blue-800 border-blue-200",
  },
  COMPLETED: {
    label: "Termin\u00e9e",
    className: "bg-green-100 text-green-800 border-green-200",
  },
  CANCELLED: {
    label: "Annul\u00e9e",
    className: "bg-red-100 text-red-800 border-red-200",
  },
};

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function isOverdue(task: IRecentTask): boolean {
  if (!task.dueAt) return false;
  if (task.status === "COMPLETED" || task.status === "CANCELLED") return false;
  return new Date(task.dueAt) < new Date();
}

function formatDate(iso: string | null): string {
  if (!iso) return "\u2014";
  const d = new Date(iso);
  return d.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function fullName(
  person: { firstName: string; lastName: string } | null
): string {
  if (!person) return "\u2014";
  return `${person.firstName} ${person.lastName}`;
}

/* ------------------------------------------------------------------ */
/*  Sub-components                                                     */
/* ------------------------------------------------------------------ */

function KpiCard({
  label,
  value,
  icon,
  iconBg,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  iconBg: string;
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 p-5">
        <div
          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${iconBg}`}
        >
          {icon}
        </div>
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="text-2xl font-bold tracking-tight">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function BarChart({ data }: { data: IByStage[] }) {
  const maxTotal = Math.max(
    ...data.map(
      (s) => s.pending + s.inProgress + s.completed + s.cancelled + s.overdue
    ),
    1
  );

  return (
    <div className="space-y-3">
      {data.map((s) => {
        const total =
          s.pending + s.inProgress + s.completed + s.cancelled + s.overdue;
        const pct = Math.round((total / maxTotal) * 100);
        const meta = STAGE_META[s.stage] ?? {
          label: s.stage,
          color: "bg-gray-100 text-gray-700",
        };

        return (
          <div key={s.stage} className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <span
                className={`inline-flex rounded-md px-2 py-0.5 text-xs font-medium ${meta.color}`}
              >
                {meta.label}
              </span>
              <span className="font-semibold tabular-nums text-muted-foreground">
                {total}
              </span>
            </div>
            <div className="h-3 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="flex h-full rounded-full transition-all duration-500"
                style={{ width: `${pct}%` }}
              >
                {s.completed > 0 && (
                  <div
                    className="bg-green-500"
                    style={{
                      width: `${(s.completed / total) * 100}%`,
                    }}
                  />
                )}
                {s.inProgress > 0 && (
                  <div
                    className="bg-blue-500"
                    style={{
                      width: `${(s.inProgress / total) * 100}%`,
                    }}
                  />
                )}
                {s.pending > 0 && (
                  <div
                    className="bg-yellow-500"
                    style={{
                      width: `${(s.pending / total) * 100}%`,
                    }}
                  />
                )}
                {s.cancelled > 0 && (
                  <div
                    className="bg-red-400"
                    style={{
                      width: `${(s.cancelled / total) * 100}%`,
                    }}
                  />
                )}
                {s.overdue > 0 && (
                  <div
                    className="bg-orange-500"
                    style={{
                      width: `${(s.overdue / total) * 100}%`,
                    }}
                  />
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function TypeDistribution({ data }: { data: IByType[] }) {
  const total = data.reduce((acc, d) => acc + d._count._all, 0) || 1;

  return (
    <div className="space-y-4">
      {data.map((d) => {
        const meta = TYPE_META[d.type] ?? {
          label: d.type,
          color: "text-gray-700",
          bg: "bg-gray-500",
        };
        const pct = Math.round((d._count._all / total) * 100);

        return (
          <div key={d.type} className="space-y-1.5">
            <div className="flex items-center justify-between text-sm">
              <span className={`font-medium ${meta.color}`}>{meta.label}</span>
              <span className="text-muted-foreground tabular-nums">
                {d._count._all} ({pct}%)
              </span>
            </div>
            <div className="h-3 w-full overflow-hidden rounded-full bg-muted">
              <div
                className={`h-full rounded-full ${meta.bg} transition-all duration-500`}
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-8">
      {/* KPI row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="flex items-center gap-4 p-5">
              <Skeleton className="h-12 w-12 rounded-xl" />
              <div className="space-y-2">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-6 w-12" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {Array.from({ length: 2 }).map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-5 w-40" />
            </CardHeader>
            <CardContent className="space-y-4">
              {Array.from({ length: 5 }).map((_, j) => (
                <div key={j} className="space-y-2">
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-3/4" />
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-48" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Icons (inline SVGs)                                                */
/* ------------------------------------------------------------------ */

function ClockIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

function CheckCircleIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  );
}

function XCircleIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <circle cx="12" cy="12" r="10" />
      <line x1="15" y1="9" x2="9" y2="15" />
      <line x1="9" y1="9" x2="15" y2="15" />
    </svg>
  );
}

function AlertTriangleIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  );
}

function ArrowLeftIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <line x1="19" y1="12" x2="5" y2="12" />
      <polyline points="12 19 5 12 12 5" />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/*  Page component                                                     */
/* ------------------------------------------------------------------ */

export default function AutomationsDashboardPage() {
  const [data, setData] = useState<IStatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await fetch("/api/v1/automations/stats");
        const json = await res.json();
        if (!json.success) {
          setError(json.error ?? "Erreur lors du chargement des statistiques.");
          return;
        }
        setData(json.data);
      } catch {
        setError("Impossible de charger les statistiques.");
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, []);

  return (
    <div className="mx-auto w-full max-w-7xl space-y-8 p-4 md:p-6 lg:p-8">
      {/* ---- Header ---- */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Tableau de bord des automatisations
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Vue d&apos;ensemble de la performance des t&acirc;ches
            automatis&eacute;es
          </p>
        </div>
        <Link
          href="/dashboard/automations"
          className="inline-flex items-center gap-2 rounded-lg border bg-background px-4 py-2 text-sm font-medium shadow-sm transition-colors hover:bg-muted"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          Configuration
        </Link>
      </div>

      {/* ---- Loading / Error states ---- */}
      {loading && <LoadingSkeleton />}

      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-6 text-center text-red-700">
            {error}
          </CardContent>
        </Card>
      )}

      {/* ---- Dashboard content ---- */}
      {data && !loading && (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <KpiCard
              label="En attente"
              value={data.summary.pending}
              iconBg="bg-yellow-100"
              icon={<ClockIcon className="h-6 w-6 text-yellow-600" />}
            />
            <KpiCard
              label="Ex\u00e9cut\u00e9es"
              value={data.summary.completed}
              iconBg="bg-green-100"
              icon={<CheckCircleIcon className="h-6 w-6 text-green-600" />}
            />
            <KpiCard
              label="Annul\u00e9es"
              value={data.summary.cancelled}
              iconBg="bg-red-100"
              icon={<XCircleIcon className="h-6 w-6 text-red-600" />}
            />
            <KpiCard
              label="En retard"
              value={data.summary.overdue}
              iconBg="bg-orange-100"
              icon={<AlertTriangleIcon className="h-6 w-6 text-orange-600" />}
            />
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  R\u00e9partition par \u00e9tape du pipeline
                </CardTitle>
              </CardHeader>
              <CardContent>
                {data.byStage.length > 0 ? (
                  <>
                    <BarChart data={data.byStage} />
                    {/* Legend */}
                    <div className="mt-5 flex flex-wrap gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1.5">
                        <span className="inline-block h-2.5 w-2.5 rounded-full bg-green-500" />
                        Termin\u00e9es
                      </span>
                      <span className="flex items-center gap-1.5">
                        <span className="inline-block h-2.5 w-2.5 rounded-full bg-blue-500" />
                        En cours
                      </span>
                      <span className="flex items-center gap-1.5">
                        <span className="inline-block h-2.5 w-2.5 rounded-full bg-yellow-500" />
                        En attente
                      </span>
                      <span className="flex items-center gap-1.5">
                        <span className="inline-block h-2.5 w-2.5 rounded-full bg-red-400" />
                        Annul\u00e9es
                      </span>
                      <span className="flex items-center gap-1.5">
                        <span className="inline-block h-2.5 w-2.5 rounded-full bg-orange-500" />
                        En retard
                      </span>
                    </div>
                  </>
                ) : (
                  <p className="py-8 text-center text-sm text-muted-foreground">
                    Aucune donn\u00e9e disponible
                  </p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  R\u00e9partition par type de t\u00e2che
                </CardTitle>
              </CardHeader>
              <CardContent>
                {data.byType.length > 0 ? (
                  <TypeDistribution data={data.byType} />
                ) : (
                  <p className="py-8 text-center text-sm text-muted-foreground">
                    Aucune donn\u00e9e disponible
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Recent tasks table */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                T\u00e2ches r\u00e9centes
              </CardTitle>
            </CardHeader>
            <CardContent>
              {data.recentTasks.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Titre</TableHead>
                      <TableHead>Client</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>\u00c9tape</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead>\u00c9ch\u00e9ance</TableHead>
                      <TableHead>Agent</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.recentTasks.map((task) => {
                      const stageMeta = STAGE_META[task.pipelineStage] ?? {
                        label: task.pipelineStage,
                        color: "bg-gray-100 text-gray-700",
                      };
                      const typeMeta = TYPE_META[task.type] ?? {
                        label: task.type,
                        color: "text-gray-700",
                        bg: "bg-gray-500",
                      };
                      const statusMeta = STATUS_META[task.status] ?? {
                        label: task.status,
                        className: "bg-gray-100 text-gray-700",
                      };
                      const overdue = isOverdue(task);

                      return (
                        <TableRow
                          key={task.id}
                          className="cursor-pointer transition-colors hover:bg-muted/70"
                        >
                          <TableCell className="font-medium">
                            {task.title}
                          </TableCell>
                          <TableCell>{fullName(task.client)}</TableCell>
                          <TableCell>
                            <span
                              className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${typeMeta.color} ${typeMeta.bg}/15`}
                            >
                              {typeMeta.label}
                            </span>
                          </TableCell>
                          <TableCell>
                            <span
                              className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${stageMeta.color}`}
                            >
                              {stageMeta.label}
                            </span>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <span
                                className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium ${statusMeta.className}`}
                              >
                                {statusMeta.label}
                              </span>
                              {overdue && (
                                <Badge
                                  variant="destructive"
                                  className="text-[10px]"
                                >
                                  En retard
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell
                            className={overdue ? "text-red-600 font-medium" : ""}
                          >
                            {formatDate(task.dueAt)}
                          </TableCell>
                          <TableCell>{fullName(task.assignedTo)}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              ) : (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  Aucune t\u00e2che r\u00e9cente
                </p>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
