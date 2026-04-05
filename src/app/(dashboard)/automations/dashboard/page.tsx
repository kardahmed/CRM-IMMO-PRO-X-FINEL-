"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  Zap,
  XCircle,
  ChevronDown,
  ChevronRight,
  Phone,
  MessageCircle,
  FileText,
  Calendar,
  Clock,
  Users,
  Settings2,
  BarChart3,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Clock8,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/*  Filter / export constants                                          */
/* ------------------------------------------------------------------ */

const STAGE_OPTIONS = [
  { value: "NEW", label: "Nouveau" },
  { value: "CONTACTED", label: "Contact\u00e9" },
  { value: "QUALIFIED", label: "Qualifi\u00e9" },
  { value: "VISIT_SCHEDULED", label: "Visite planifi\u00e9e" },
  { value: "VISITED", label: "Visite effectu\u00e9e" },
  { value: "NEGOTIATION", label: "N\u00e9gociation" },
  { value: "RESERVED", label: "R\u00e9serv\u00e9" },
  { value: "SIGNED", label: "Sign\u00e9" },
  { value: "CLOSED", label: "Cl\u00f4tur\u00e9" },
] as const;

const STATUS_OPTIONS = [
  { value: "PENDING", label: "En attente" },
  { value: "IN_PROGRESS", label: "En cours" },
  { value: "COMPLETED", label: "Termin\u00e9es" },
  { value: "CANCELLED", label: "Annul\u00e9es" },
] as const;

interface ITeamMember {
  id: string;
  firstName: string;
  lastName: string;
}

interface IFilters {
  from: string;
  to: string;
  assignedToId: string;
  stage: string;
  status: string;
}

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
  createdAt: string | null;
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
  NEW: { label: "Nouveau", color: "bg-blue-500/10 text-blue-600 border-blue-500/20" },
  CONTACTED: { label: "Contacté", color: "bg-cyan-500/10 text-cyan-600 border-cyan-500/20" },
  QUALIFIED: { label: "Qualifié", color: "bg-violet-500/10 text-violet-600 border-violet-500/20" },
  VISIT_SCHEDULED: { label: "Visite planifiée", color: "bg-indigo-500/10 text-indigo-600 border-indigo-500/20" },
  VISITED: { label: "Visite effectuée", color: "bg-sky-500/10 text-sky-600 border-sky-500/20" },
  NEGOTIATION: { label: "Négociation", color: "bg-amber-500/10 text-amber-600 border-amber-500/20" },
  RESERVED: { label: "Réservé", color: "bg-orange-500/10 text-orange-600 border-orange-500/20" },
  SIGNED: { label: "Signé", color: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" },
  CLOSED: { label: "Clôturé", color: "bg-green-500/10 text-green-600 border-green-500/20" },
};

const TYPE_META: Record<string, { label: string; color: string; bg: string }> = {
  CALL: { label: "Appel", color: "text-emerald-600", bg: "bg-emerald-500" },
  WHATSAPP: { label: "WhatsApp / SMS", color: "text-emerald-600", bg: "bg-emerald-500" },
  SMS: { label: "WhatsApp / SMS", color: "text-emerald-600", bg: "bg-emerald-500" },
  DOCUMENT: { label: "Document", color: "text-blue-600", bg: "bg-blue-500" },
  MEETING: { label: "Réunion", color: "text-purple-600", bg: "bg-purple-500" },
};

const STATUS_META: Record<string, { label: string; className: string }> = {
  PENDING: { label: "En attente", className: "bg-amber-50 text-amber-700 border-amber-200" },
  IN_PROGRESS: { label: "En cours", className: "bg-blue-50 text-blue-700 border-blue-200" },
  COMPLETED: { label: "Terminée", className: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  CANCELLED: { label: "Annulée", className: "bg-rose-50 text-rose-700 border-rose-200" },
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
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });
}

function fullName(person: { firstName: string; lastName: string } | null): string {
  if (!person) return "—";
  return `${person.firstName} ${person.lastName}`;
}

/* ------------------------------------------------------------------ */
/*  Sub-components                                                     */
/* ------------------------------------------------------------------ */

function KpiCard({ label, value, icon: Icon, iconBg }: { label: string; value: number; icon: any; iconBg: string }) {
  return (
    <Card className="border-none shadow-stripe hover:shadow-stripe-lg transition-all duration-500 rounded-[28px] bg-white group overflow-hidden">
      <CardContent className="flex items-center gap-5 p-7">
        <div className={cn("flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl shadow-sm transition-transform group-hover:scale-110 group-hover:rotate-3", iconBg)}>
          <Icon className="h-7 w-7" />
        </div>
        <div className="space-y-0.5">
          <p className="text-[10px] font-black uppercase tracking-[0.25em] text-muted-foreground/60 italic">{label}</p>
          <p className="text-4xl font-black tracking-tighter tabular-nums text-neutral-900">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function BarChart({ data }: { data: IByStage[] }) {
  const maxTotal = Math.max(...data.map(s => s.pending + s.inProgress + s.completed + s.cancelled + s.overdue), 1);
  return (
    <div className="space-y-8">
      {data.map((s) => {
        const total = s.pending + s.inProgress + s.completed + s.cancelled + s.overdue;
        const pct = Math.round((total / maxTotal) * 100);
        const meta = STAGE_META[s.stage] ?? { label: s.stage, color: "bg-muted text-muted-foreground" };
        return (
          <div key={s.stage} className="group/bar space-y-3">
            <div className="flex items-center justify-between">
              <Badge variant="outline" className={cn("rounded-full px-4 py-1 text-[10px] font-black uppercase border italic", meta.color)}>
                {meta.label}
              </Badge>
              <span className="font-black tabular-nums text-neutral-900 text-lg tracking-tight">{total}</span>
            </div>
            <div className="h-3 w-full overflow-hidden rounded-full bg-neutral-50 p-0.5 border border-neutral-100/50">
              <div className="flex h-full rounded-full transition-all duration-700" style={{ width: `${pct}%` }}>
                {s.completed > 0 && <div className="bg-emerald-500" style={{ width: `${(s.completed / total) * 100}%` }} />}
                {s.inProgress > 0 && <div className="bg-blue-500" style={{ width: `${(s.inProgress / total) * 100}%` }} />}
                {s.pending > 0 && <div className="bg-amber-400" style={{ width: `${(s.pending / total) * 100}%` }} />}
                {s.cancelled > 0 && <div className="bg-rose-400" style={{ width: `${(s.cancelled / total) * 100}%` }} />}
                {s.overdue > 0 && <div className="bg-orange-500" style={{ width: `${(s.overdue / total) * 100}%` }} />}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-12">
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-32 rounded-[28px]" />)}
      </div>
      <div className="grid grid-cols-1 gap-10 lg:grid-cols-2">
        {[...Array(2)].map((_, i) => <Skeleton key={i} className="h-[400px] rounded-[32px]" />)}
      </div>
      <Skeleton className="h-[500px] rounded-[40px]" />
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

function DownloadIcon({ className }: { className?: string }) {
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
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
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
/*  Page component                                                     */
/* ------------------------------------------------------------------ */

export default function AutomationsDashboardPage() {
  const [data, setData] = useState<IStatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [teamMembers, setTeamMembers] = useState<ITeamMember[]>([]);
  const [filters, setFilters] = useState<IFilters>({
    from: "",
    to: "",
    assignedToId: "",
    stage: "",
    status: "",
  });

  const buildQueryString = useCallback((f: IFilters): string => {
    const params = new URLSearchParams();
    if (f.from) params.set("from", f.from);
    if (f.to) params.set("to", f.to);
    if (f.assignedToId) params.set("assignedToId", f.assignedToId);
    if (f.stage) params.set("stage", f.stage);
    if (f.status) params.set("status", f.status);
    const qs = params.toString();
    return qs ? `?${qs}` : "";
  }, []);

  const fetchStats = useCallback(
    async (f: IFilters) => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(
          `/api/v1/automations/stats${buildQueryString(f)}`
        );
        const json = await res.json();
        if (!json.success) throw new Error(json.error);
        setData(json.data);
      } catch (e: any) {
        setError(e.message ?? "Erreur de synchronisation");
      } finally {
        setLoading(false);
      }
    },
    [buildQueryString]
  );

  /* Load team members once */
  useEffect(() => {
    async function loadTeam() {
      try {
        const res = await fetch("/api/v1/settings/team");
        const json = await res.json();
        if (json.success && json.data?.members) {
          setTeamMembers(json.data.members);
        }
      } catch {
        /* silently ignore — agent dropdown will just be empty */
      }
    }
    loadTeam();
  }, []);

  /* Fetch stats on mount and whenever filters change */
  useEffect(() => {
    fetchStats(filters);
  }, [filters, fetchStats]);

  const updateFilter = (key: keyof IFilters, value: string | null) => {
    setFilters((prev) => ({ ...prev, [key]: value ?? "" }));
  };

  const resetFilters = () => {
    setFilters({ from: "", to: "", assignedToId: "", stage: "", status: "" });
  };

  const hasActiveFilters =
    filters.from !== "" ||
    filters.to !== "" ||
    filters.assignedToId !== "" ||
    filters.stage !== "" ||
    filters.status !== "";

  /* ---- CSV export ---- */
  const exportCsv = useCallback(() => {
    if (!data) return;

    const csvHeader = [
      "Titre",
      "Client",
      "Type",
      "\u00c9tape",
      "Statut",
      "\u00c9ch\u00e9ance",
      "Agent",
      "Cr\u00e9\u00e9 le",
    ];

    const escapeField = (value: string): string => {
      if (value.includes(",") || value.includes('"') || value.includes("\n")) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value;
    };

    const csvRows = data.recentTasks.map((task) => {
      const stageMeta = STAGE_META[task.pipelineStage];
      const typeMeta = TYPE_META[task.type];
      const statusMeta = STATUS_META[task.status];

      return [
        escapeField(task.title),
        escapeField(fullName(task.client)),
        escapeField(typeMeta?.label ?? task.type),
        escapeField(stageMeta?.label ?? task.pipelineStage),
        escapeField(statusMeta?.label ?? task.status),
        escapeField(formatDate(task.dueAt)),
        escapeField(fullName(task.assignedTo)),
        escapeField(formatDate(task.createdAt)),
      ].join(",");
    });

    const bom = "\uFEFF";
    const csvContent = bom + [csvHeader.join(","), ...csvRows].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const today = new Date().toISOString().slice(0, 10);
    const a = document.createElement("a");
    a.href = url;
    a.download = `automations-export-${today}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [data]);

  return (
    <div className="mx-auto w-full max-w-7xl space-y-12 p-4 md:p-8 lg:p-10 animate-page-enter bg-[#F6F9FC]">
      {/* Executive Header */}
      <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between bg-white p-8 rounded-[32px] shadow-stripe border border-neutral-100">
        <div className="flex items-center gap-6">
          <div className="h-16 w-16 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 border border-emerald-500/20 shadow-sm">
            <BarChart3 className="h-8 w-8" />
          </div>
          <div>
            <h1 className="text-4xl font-black tracking-tighter text-neutral-900 flex items-center gap-2">
              Performance
              <span className="text-primary italic text-xl font-medium tracking-normal opacity-40 lowercase">hub</span>
            </h1>
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em] opacity-60 mt-1">
              Analytics & Flux d'Execution en Temps Réel
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            className="h-14 px-8 rounded-full font-black uppercase text-[10px] tracking-[0.2em] shadow-stripe border-neutral-100 hover:bg-neutral-50 gap-3 group transition-all"
            onClick={exportCsv}
            disabled={!data || data.recentTasks.length === 0}
          >
            <DownloadIcon className="h-4 w-4 text-emerald-500" />
            Exporter CSV
          </Button>
          <Link href="/dashboard/automations">
            <Button variant="outline" className="h-14 px-8 rounded-full font-black uppercase text-[10px] tracking-[0.2em] shadow-stripe border-neutral-100 hover:bg-neutral-50 gap-3 group transition-all">
              <ArrowLeft className="h-4 w-4 text-primary transition-transform group-hover:-translate-x-1" />
              Architecture Flux
            </Button>
          </Link>
        </div>
      </div>

      {/* ---- Filter bar ---- */}
      <Card className="rounded-[32px] border-none shadow-stripe bg-white overflow-visible">
        <CardContent className="p-8">
          <div className="flex flex-wrap items-end gap-6">
            {/* Date range group */}
            <div className="flex items-center gap-3 bg-neutral-50/50 p-2 rounded-2xl border border-neutral-100">
              <div className="flex flex-col gap-1 px-2">
                <label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/60">Date Début</label>
                <Input
                  type="date"
                  value={filters.from}
                  onChange={(e) => updateFilter("from", e.target.value)}
                  className="h-8 w-36 border-none bg-transparent shadow-none p-0 text-xs font-bold"
                />
              </div>
              <div className="h-8 w-px bg-neutral-200" />
              <div className="flex flex-col gap-1 px-2">
                <label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/60">Date Fin</label>
                <Input
                  type="date"
                  value={filters.to}
                  onChange={(e) => updateFilter("to", e.target.value)}
                  className="h-8 w-36 border-none bg-transparent shadow-none p-0 text-xs font-bold"
                />
              </div>
            </div>

            {/* Agent Select */}
            <div className="flex flex-col gap-2 flex-1 min-w-[200px]">
              <label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/60 px-2">Propulseur Assigné</label>
              <Select
                value={filters.assignedToId}
                onValueChange={(v) => updateFilter("assignedToId", v === "__all__" ? "" : v)}
              >
                <SelectTrigger className="h-12 rounded-2xl border-neutral-100 bg-neutral-50/50 px-4 text-xs font-bold uppercase tracking-tight">
                  <SelectValue placeholder="Tous les agents" />
                </SelectTrigger>
                <SelectContent className="rounded-2xl border-neutral-100 shadow-stripe-lg">
                  <SelectItem value="__all__" className="text-xs font-bold uppercase">Tous les agents</SelectItem>
                  {teamMembers.map((m) => (
                    <SelectItem key={m.id} value={m.id} className="text-xs font-bold uppercase">
                      {m.firstName} {m.lastName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Stage Select */}
            <div className="flex flex-col gap-2 flex-1 min-w-[180px]">
              <label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/60 px-2">Étape Pipeline</label>
              <Select
                value={filters.stage}
                onValueChange={(v) => updateFilter("stage", v === "__all__" ? "" : v)}
              >
                <SelectTrigger className="h-12 rounded-2xl border-neutral-100 bg-neutral-50/50 px-4 text-xs font-bold uppercase tracking-tight">
                  <SelectValue placeholder="Toutes les étapes" />
                </SelectTrigger>
                <SelectContent className="rounded-2xl border-neutral-100 shadow-stripe-lg">
                  <SelectItem value="__all__" className="text-xs font-bold uppercase">Toutes les étapes</SelectItem>
                  {STAGE_OPTIONS.map((s) => (
                    <SelectItem key={s.value} value={s.value} className="text-xs font-bold uppercase">
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Status Select */}
            <div className="flex flex-col gap-2 w-48">
              <label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/60 px-2">État Flux</label>
              <Select
                value={filters.status}
                onValueChange={(v) => updateFilter("status", v === "__all__" ? "" : v)}
              >
                <SelectTrigger className="h-12 rounded-2xl border-neutral-100 bg-neutral-50/50 px-4 text-xs font-bold uppercase tracking-tight">
                  <SelectValue placeholder="Tous les flux" />
                </SelectTrigger>
                <SelectContent className="rounded-2xl border-neutral-100 shadow-stripe-lg">
                  <SelectItem value="__all__" className="text-xs font-bold uppercase">Tous les flux</SelectItem>
                  {STATUS_OPTIONS.map((s) => (
                    <SelectItem key={s.value} value={s.value} className="text-xs font-bold uppercase">
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Reset */}
            {hasActiveFilters && (
              <Button
                variant="ghost"
                onClick={resetFilters}
                className="h-12 rounded-2xl text-[9px] font-black text-rose-500 hover:text-rose-600 hover:bg-rose-50/50 uppercase tracking-widest transition-all px-6 border border-rose-100"
              >
                <XCircleIcon className="mr-2 h-3.5 w-3.5" />
                Reset
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* ---- Content ---- */}
      {loading ? (
        <LoadingSkeleton />
      ) : error ? (
        <Card className="rounded-[32px] border-none shadow-stripe bg-rose-50/50 p-12 text-center">
          <AlertCircle className="h-16 w-16 text-rose-500 mx-auto mb-4 opacity-50" />
          <p className="text-lg font-black text-rose-900 tracking-tight">{error}</p>
        </Card>
      ) : data ? (
        <div className="space-y-12 pb-20">
          {/* KPI Cards */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <KpiCard label="En attente" value={data.summary.pending} icon={Clock8} iconBg="bg-amber-50 text-amber-500 border border-amber-100" />
            <KpiCard label="Exécutées" value={data.summary.completed} icon={CheckCircle2} iconBg="bg-emerald-50 text-emerald-500 border border-emerald-100" />
            <KpiCard label="Annulées" value={data.summary.cancelled} icon={XCircle} iconBg="bg-rose-50 text-rose-500 border border-rose-100" />
            <KpiCard label="En retard" value={data.summary.overdue} icon={AlertCircle} iconBg="bg-orange-50 text-orange-500 border border-orange-100" />
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-2">
            <Card className="rounded-[40px] border-none shadow-stripe bg-white">
              <CardHeader className="p-10 pb-4">
                <CardTitle className="text-[11px] font-black uppercase tracking-[0.3em] text-muted-foreground/60 italic">Efficacité par Étape</CardTitle>
              </CardHeader>
              <CardContent className="p-10 pt-0">
                <BarChart data={data.byStage} />
                <div className="mt-10 pt-6 border-t border-neutral-50 flex flex-wrap gap-4 text-[9px] font-black uppercase tracking-widest text-muted-foreground/60">
                   {['completed', 'inProgress', 'pending', 'cancelled', 'overdue'].map(s => (
                     <div key={s} className="flex items-center gap-2">
                       <div className={cn("h-2.5 w-2.5 rounded-full", s==='completed'?'bg-emerald-500':s==='inProgress'?'bg-blue-500':s==='pending'?'bg-amber-400':s==='cancelled'?'bg-rose-400':'bg-orange-500')} />
                       {s === 'completed' ? 'Signées' : s === 'inProgress' ? 'Actives' : s === 'pending' ? 'Attente' : s === 'cancelled' ? 'Refus' : 'Critique'}
                     </div>
                   ))}
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-[40px] border-none shadow-stripe bg-white">
              <CardHeader className="p-10 pb-4">
                 <CardTitle className="text-[11px] font-black uppercase tracking-[0.3em] text-muted-foreground/60 italic">Mix Logistique</CardTitle>
              </CardHeader>
              <CardContent className="p-10 pt-0 space-y-8">
                 {data.byType.map(d => {
                   const meta = TYPE_META[d.type] ?? { label: d.type, color: "text-neutral-500", bg: "bg-neutral-400" };
                   const pct = Math.round((d._count._all / (data.summary.total || 1)) * 100);
                   return (
                     <div key={d.type} className="space-y-3">
                        <div className="flex justify-between items-end">
                          <span className={cn("text-xs font-black uppercase tracking-widest", meta.color)}>{meta.label}</span>
                          <span className="font-black tabular-nums text-xl">{d._count._all} <span className="text-[10px] text-muted-foreground opacity-40 ml-1">({pct}%)</span></span>
                        </div>
                        <div className="h-2.5 w-full bg-neutral-50 rounded-full border border-neutral-100/50 overflow-hidden">
                           <div className={cn("h-full rounded-full transition-all duration-1000", meta.bg)} style={{ width: `${pct}%` }} />
                        </div>
                     </div>
                   );
                 })}
              </CardContent>
            </Card>
          </div>

          {/* Recent Tasks List */}
          <Card className="rounded-[40px] border-none shadow-stripe-lg bg-neutral-900 text-white overflow-hidden">
             <CardHeader className="p-10 bg-white/[0.03] border-b border-white/5">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-[12px] font-black uppercase tracking-[0.4em] text-neutral-400 italic">Propulseurs Récents</CardTitle>
                    <p className="text-[10px] text-neutral-500 mt-2 font-medium tracking-widest uppercase">Flux PRO-X Live Optimization</p>
                  </div>
                  <Badge className="bg-emerald-500 text-white rounded-full px-6 py-2 text-[10px] font-black uppercase italic shadow-[0_0_20px_rgba(16,185,129,0.3)] border-none">
                    ENGINE ACTIVE
                  </Badge>
                </div>
             </CardHeader>
             <CardContent className="p-0">
               <Table>
                 <TableHeader className="bg-white/[0.01]">
                   <TableRow className="border-b border-white/5 hover:bg-transparent">
                     <TableHead className="px-10 h-16 text-[9px] font-black uppercase tracking-[0.2em] text-neutral-500">Flux / Titre</TableHead>
                     <TableHead className="text-[9px] font-black uppercase tracking-[0.2em] text-neutral-500">Média</TableHead>
                     <TableHead className="text-[9px] font-black uppercase tracking-[0.2em] text-neutral-500">Étape</TableHead>
                     <TableHead className="text-[9px] font-black uppercase tracking-[0.2em] text-neutral-500">Statut</TableHead>
                     <TableHead className="px-10 text-right text-[9px] font-black uppercase tracking-[0.2em] text-neutral-500">Échéance</TableHead>
                   </TableRow>
                 </TableHeader>
                 <TableBody>
                   {data.recentTasks.map(task => {
                     const stageMeta = STAGE_META[task.pipelineStage] ?? { label: task.pipelineStage, color: "text-neutral-400" };
                     const typeMeta = TYPE_META[task.type] ?? { label: task.type, color: "text-neutral-400", bg: "bg-white/10" };
                     const statusMeta = STATUS_META[task.status] ?? { label: task.status, className: "bg-white/5" };
                     const overdue = isOverdue(task);
                     return (
                       <TableRow key={task.id} className="border-b border-white/5 hover:bg-white/[0.04] transition-colors group">
                         <TableCell className="px-10 py-6">
                            <div className="space-y-1">
                              <p className="font-black text-lg tracking-tight group-hover:text-primary transition-colors">{task.title}</p>
                              <p className="text-[11px] text-neutral-500 tabular-nums uppercase font-black opacity-60 tracking-wider">Prospect: {fullName(task.client)}</p>
                            </div>
                         </TableCell>
                         <TableCell>
                            <span className={cn("px-4 py-1.5 rounded-full text-[9px] font-black uppercase border border-white/10 italic", typeMeta.color)}>
                               {typeMeta.label}
                            </span>
                         </TableCell>
                         <TableCell>
                            <span className={cn("px-4 py-1.5 rounded-lg text-[9px] font-black uppercase bg-white/5", stageMeta.color)}>
                               {stageMeta.label}
                            </span>
                         </TableCell>
                         <TableCell>
                            <Badge variant="outline" className={cn("px-4 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border-white/10", statusMeta.className)}>
                               {statusMeta.label}
                            </Badge>
                         </TableCell>
                         <TableCell className="px-10 text-right space-y-1">
                            <p className={cn("text-sm font-black tabular-nums", overdue ? "text-rose-500 animate-pulse" : "text-neutral-400")}>{formatDate(task.dueAt)}</p>
                            <p className="text-[9px] text-neutral-600 font-bold uppercase tracking-widest">{fullName(task.assignedTo)}</p>
                         </TableCell>
                       </TableRow>
                     );
                   })}
                 </TableBody>
               </Table>
             </CardContent>
          </Card>
        </div>
      ) : null}
    </div>
  );
}
