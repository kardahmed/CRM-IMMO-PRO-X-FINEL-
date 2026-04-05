"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Clock,
  ArrowLeft,
  Zap,
  Plus,
  Edit,
  ToggleRight,
  ToggleLeft,
  Sparkles,
  MessageSquare,
  CheckCircle,
  XCircle,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
} from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Card, CardContent } from "@/components/ui/card";
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

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface IActivityEvent {
  id: string;
  action: string;
  entity: string;
  entityId: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  user: { firstName: string | null; lastName: string | null } | null;
}

interface IPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

// ---------------------------------------------------------------------------
// Action metadata
// ---------------------------------------------------------------------------
const ACTION_META: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  AUTOMATION_TRIGGERED: { label: "Automatisation déclenchée", color: "bg-blue-500", icon: Zap },
  AUTOMATION_CONFIG_CREATED: { label: "Configuration créée", color: "bg-green-500", icon: Plus },
  AUTOMATION_CONFIG_UPDATED: { label: "Configuration modifiée", color: "bg-amber-500", icon: Edit },
  AUTOMATION_CONFIG_ENABLED: { label: "Automatisation activée", color: "bg-emerald-500", icon: ToggleRight },
  AUTOMATION_CONFIG_DISABLED: { label: "Automatisation désactivée", color: "bg-red-500", icon: ToggleLeft },
  AI_CALL_SCRIPT_GENERATED: { label: "Script d'appel IA généré", color: "bg-purple-500", icon: Sparkles },
  AI_MESSAGE_GENERATED: { label: "Message IA généré", color: "bg-indigo-500", icon: MessageSquare },
  TASK_COMPLETED: { label: "Tâche terminée", color: "bg-green-600", icon: CheckCircle },
  TASK_CANCELLED: { label: "Tâche annulée", color: "bg-red-400", icon: XCircle },
};

const FILTER_OPTIONS = [
  { value: "ALL", label: "Tous" },
  { value: "AUTOMATION_TRIGGERED", label: "Déclenchement" },
  { value: "AUTOMATION_CONFIG_CREATED", label: "Config créée" },
  { value: "AUTOMATION_CONFIG_UPDATED", label: "Config modifiée" },
  { value: "AUTOMATION_CONFIG_ENABLED", label: "Activée" },
  { value: "AUTOMATION_CONFIG_DISABLED", label: "Désactivée" },
  { value: "AI_CALL_SCRIPT_GENERATED", label: "Script IA" },
  { value: "AI_MESSAGE_GENERATED", label: "Message IA" },
  { value: "TASK_COMPLETED", label: "Tâche terminée" },
  { value: "TASK_CANCELLED", label: "Tâche annulée" },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export default function AutomationHistoryPage() {
  const [events, setEvents] = useState<IActivityEvent[]>([]);
  const [pagination, setPagination] = useState<IPagination>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });
  const [loading, setLoading] = useState(true);

  // Filters
  const [actionFilter, setActionFilter] = useState("ALL");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const fetchHistory = useCallback(
    async (page: number) => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        params.set("page", String(page));
        params.set("limit", "20");
        if (actionFilter !== "ALL") params.set("action", actionFilter);
        if (fromDate) params.set("from", new Date(fromDate).toISOString());
        if (toDate) params.set("to", new Date(toDate + "T23:59:59").toISOString());

        const res = await fetch(`/api/v1/automations/history?${params.toString()}`);
        const json = await res.json();

        if (json.success) {
          setEvents(json.data.events);
          setPagination(json.data.pagination);
        }
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    },
    [actionFilter, fromDate, toDate],
  );

  useEffect(() => {
    fetchHistory(1);
  }, [fetchHistory]);

  const resetFilters = () => {
    setActionFilter("ALL");
    setFromDate("");
    setToDate("");
  };

  const getUserName = (user: IActivityEvent["user"]) => {
    if (!user) return "Système";
    const parts = [user.firstName, user.lastName].filter(Boolean);
    return parts.length > 0 ? parts.join(" ") : "Utilisateur";
  };

  const getMeta = (action: string) =>
    ACTION_META[action] ?? { label: action, color: "bg-gray-500", icon: Zap };

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <div className="mx-auto max-w-4xl space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Clock className="h-6 w-6 text-muted-foreground" />
          <h1 className="text-2xl font-bold tracking-tight">
            Historique des automatisations
          </h1>
        </div>
        <Link href="/dashboard/automations">
          <Button variant="outline" size="sm" className="gap-1.5">
            <ArrowLeft className="h-4 w-4" />
            Retour
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="flex flex-wrap items-end gap-4 pt-6">
          <div className="min-w-[180px] flex-1">
            <label className="mb-1.5 block text-sm font-medium text-muted-foreground">
              Type d&apos;action
            </label>
            <Select value={actionFilter} onValueChange={(v) => setActionFilter(v ?? "")}>
              <SelectTrigger>
                <SelectValue placeholder="Tous" />
              </SelectTrigger>
              <SelectContent>
                {FILTER_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="min-w-[150px]">
            <label className="mb-1.5 block text-sm font-medium text-muted-foreground">Du</label>
            <Input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
          </div>

          <div className="min-w-[150px]">
            <label className="mb-1.5 block text-sm font-medium text-muted-foreground">Au</label>
            <Input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} />
          </div>

          <Button variant="ghost" size="sm" onClick={resetFilters} className="gap-1.5">
            <RotateCcw className="h-4 w-4" />
            Réinitialiser
          </Button>
        </CardContent>
      </Card>

      {/* Timeline */}
      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex gap-4">
              <Skeleton className="h-4 w-4 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : events.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            Aucun événement trouvé pour les critères sélectionnés.
          </CardContent>
        </Card>
      ) : (
        <div className="relative ml-3 border-l-2 border-muted pl-6">
          {events.map((event) => {
            const meta = getMeta(event.action);
            const IconComponent = meta.icon;

            return (
              <div key={event.id} className="relative mb-6 last:mb-0">
                {/* Dot */}
                <div
                  className={`absolute -left-[calc(1.5rem+5px)] top-1 flex h-3 w-3 items-center justify-center rounded-full ${meta.color}`}
                />

                <Card>
                  <CardContent className="p-4">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <IconComponent className="h-4 w-4 text-muted-foreground" />
                        <Badge variant="secondary">{meta.label}</Badge>
                        <span className="text-sm text-muted-foreground">
                          par {getUserName(event.user)}
                        </span>
                      </div>
                      <time className="text-xs text-muted-foreground">
                        {format(new Date(event.createdAt), "dd MMM yyyy, HH:mm", { locale: fr })}
                      </time>
                    </div>

                    {/* Metadata details */}
                    <div className="mt-2 space-y-1 text-sm text-muted-foreground">
                      {event.entity && (
                        <p>
                          <span className="font-medium text-foreground">Entité :</span>{" "}
                          {event.entity}
                          {event.entityId && (
                            <span className="ml-1 font-mono text-xs">({event.entityId})</span>
                          )}
                        </p>
                      )}
                      {event.metadata &&
                        Object.entries(event.metadata).map(([key, value]) => (
                          <p key={key}>
                            <span className="font-medium text-foreground">{key} :</span>{" "}
                            {typeof value === "object" ? JSON.stringify(value) : String(value)}
                          </p>
                        ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-4">
          <Button
            variant="outline"
            size="sm"
            disabled={pagination.page <= 1}
            onClick={() => fetchHistory(pagination.page - 1)}
            className="gap-1"
          >
            <ChevronLeft className="h-4 w-4" />
            Précédent
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {pagination.page} sur {pagination.totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={pagination.page >= pagination.totalPages}
            onClick={() => fetchHistory(pagination.page + 1)}
            className="gap-1"
          >
            Suivant
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
