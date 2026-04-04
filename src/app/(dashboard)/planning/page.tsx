"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { PlanningFilters, type ViewMode } from "@/components/planning/PlanningFilters";
import { DayView } from "@/components/planning/DayView";
import { WeekView } from "@/components/planning/WeekView";
import { MonthView } from "@/components/planning/MonthView";
import { VisitDetailPopup } from "@/components/planning/VisitDetailPopup";
import type {
  PlanningVisit,
  PlanningTask,
  ApiVisit,
  ApiTask,
} from "@/components/planning/types";
import { TASK_STATUS_COLORS, TASK_STATUS_LABELS } from "@/components/planning/types";
import { Calendar as CalendarIcon, Loader2, AlertCircle, ListTodo, User, Clock, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { toast } from "sonner";

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function mapApiVisit(v: ApiVisit): PlanningVisit {
  return {
    id: v.id,
    scheduledAt: v.scheduledAt,
    status: v.status,
    feedback: v.feedback ?? null,
    clientName: `${v.client.firstName} ${v.client.lastName}`,
    clientId: v.client.id,
    propertyName: v.property.name,
    propertyId: v.property.id,
    agentName: `${v.agent.firstName} ${v.agent.lastName}`,
    agentId: v.agent.id,
  };
}

function mapApiTask(t: ApiTask): PlanningTask {
  return {
    id: t.id,
    title: t.title,
    description: t.description ?? null,
    type: t.type,
    status: t.status,
    dueAt: t.dueAt,
    assignedToName: `${t.assignedTo.firstName} ${t.assignedTo.lastName}`,
    assignedToId: t.assignedTo.id,
    clientName: t.client ? `${t.client.firstName} ${t.client.lastName}` : null,
    clientId: t.client?.id ?? null,
  };
}

function getDefaultView(): ViewMode {
  if (typeof window !== "undefined" && window.innerWidth < 768) return "day";
  return "week";
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function PlanningPage() {
  const [view, setView] = useState<ViewMode>(getDefaultView);
  const [agent, setAgent] = useState("all");
  const [status, setStatus] = useState("all");
  const [date] = useState(new Date());
  const [activeTab, setActiveTab] = useState("visites");

  const [visits, setVisits] = useState<PlanningVisit[]>([]);
  const [tasks, setTasks] = useState<PlanningTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedVisit, setSelectedVisit] = useState<PlanningVisit | null>(null);

  // Create visit dialog
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [clients, setClients] = useState<Array<{ id: string; firstName: string; lastName: string }>>([]);
  const [properties, setProperties] = useState<Array<{ id: string; name: string }>>([]);
  const [agents, setAgents] = useState<Array<{ id: string; firstName: string; lastName: string }>>([]);
  const [visitForm, setVisitForm] = useState({ clientId: "", propertyId: "", agentId: "", scheduledAt: "" });

  /* ---- Fetch ---------------------------------------------------- */

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({ limit: "100" });
      if (status !== "all") params.set("status", status);
      if (agent !== "all") params.set("agentId", agent);

      const taskParams = new URLSearchParams({ limit: "100" });
      if (status !== "all") taskParams.set("status", status);
      if (agent !== "all") taskParams.set("assignedToId", agent);

      const [visitsRes, tasksRes] = await Promise.all([
        fetch(`/api/v1/visits?${params.toString()}`),
        fetch(`/api/v1/tasks?${taskParams.toString()}`),
      ]);

      if (!visitsRes.ok) {
        throw new Error(`Erreur lors du chargement des visites (${visitsRes.status})`);
      }
      if (!tasksRes.ok) {
        throw new Error(`Erreur lors du chargement des taches (${tasksRes.status})`);
      }

      const visitsJson = await visitsRes.json();
      const tasksJson = await tasksRes.json();

      if (!visitsJson.success) {
        throw new Error(visitsJson.error ?? "Erreur inconnue (visites)");
      }
      if (!tasksJson.success) {
        throw new Error(tasksJson.error ?? "Erreur inconnue (taches)");
      }

      setVisits((visitsJson.data.visits as ApiVisit[]).map(mapApiVisit));
      setTasks((tasksJson.data.tasks as ApiTask[]).map(mapApiTask));
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Erreur inconnue";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [status, agent]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  /* ---- Filtering ------------------------------------------------ */

  const filteredVisits = useMemo(() => {
    return visits.filter((v) => {
      if (agent !== "all" && v.agentId !== agent) return false;
      if (status !== "all" && v.status !== status) return false;
      return true;
    });
  }, [visits, agent, status]);

  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      if (agent !== "all" && t.assignedToId !== agent) return false;
      if (status !== "all" && t.status !== status) return false;
      return true;
    });
  }, [tasks, agent, status]);

  /* ---- Actions -------------------------------------------------- */

  const handleAction = async (visitId: string, action: string) => {
    try {
      const res = await fetch(`/api/v1/visits/${visitId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: action }),
      });
      if (res.ok) {
        setVisits((prev) =>
          prev.map((v) => (v.id === visitId ? { ...v, status: action } : v))
        );
      }
    } catch {
      // silently fail — user can retry
    }
    setSelectedVisit(null);
  };

  const handleOpenCreateVisit = async () => {
    setIsCreateOpen(true);
    setVisitForm({ clientId: "", propertyId: "", agentId: "", scheduledAt: "" });
    try {
      const [cRes, pRes, aRes] = await Promise.all([
        fetch("/api/v1/clients?limit=50"),
        fetch("/api/v1/properties?limit=50"),
        fetch("/api/v1/performance"),
      ]);
      const cJson = await cRes.json();
      const pJson = await pRes.json();
      const aJson = await aRes.json();
      if (cJson.success) setClients(cJson.data.clients ?? cJson.data ?? []);
      if (pJson.success) setProperties(pJson.data.properties ?? pJson.data ?? []);
      if (aJson.success) setAgents(aJson.data.agents ?? aJson.data ?? []);
    } catch {
      // Lists may fail — user can still type IDs
    }
  };

  const handleSubmitVisit = async () => {
    if (!visitForm.clientId || !visitForm.propertyId || !visitForm.agentId || !visitForm.scheduledAt) {
      toast.error("Veuillez remplir tous les champs");
      return;
    }
    setCreating(true);
    try {
      const res = await fetch("/api/v1/visits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId: visitForm.clientId,
          propertyId: visitForm.propertyId,
          agentId: visitForm.agentId,
          scheduledAt: new Date(visitForm.scheduledAt).toISOString(),
        }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error ?? "Erreur");
      toast.success("Visite creee avec succes");
      setIsCreateOpen(false);
      fetchData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur lors de la creation");
    } finally {
      setCreating(false);
    }
  };

  /* ---- Render --------------------------------------------------- */

  return (
    <div className="flex flex-col h-full gap-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
            <CalendarIcon className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight uppercase">Planning</h1>
            <p className="text-sm text-muted-foreground font-medium">
              Gestion des visites et taches
            </p>
          </div>
        </div>

        <PlanningFilters
          view={view}
          onViewChange={setView}
          agent={agent}
          onAgentChange={setAgent}
          status={status}
          onStatusChange={setStatus}
          onCreateVisit={handleOpenCreateVisit}
        />
      </div>

      {/* Tabs: Visites / Taches */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
        <TabsList className="w-fit">
          <TabsTrigger value="visites" className="gap-1.5 font-bold text-xs">
            <CalendarIcon className="h-3.5 w-3.5" />
            Visites
            {!loading && (
              <Badge variant="secondary" className="ml-1 text-[10px] px-1.5 py-0">
                {filteredVisits.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="taches" className="gap-1.5 font-bold text-xs">
            <ListTodo className="h-3.5 w-3.5" />
            Taches
            {!loading && (
              <Badge variant="secondary" className="ml-1 text-[10px] px-1.5 py-0">
                {filteredTasks.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* ---------- Loading ---------- */}
        {loading && (
          <div className="flex-1 flex items-center justify-center min-h-[400px]">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground font-medium">Chargement du planning...</p>
            </div>
          </div>
        )}

        {/* ---------- Error ---------- */}
        {!loading && error && (
          <div className="flex-1 flex items-center justify-center min-h-[400px]">
            <div className="flex flex-col items-center gap-3 text-center max-w-md">
              <div className="p-3 rounded-full bg-red-50 text-red-500">
                <AlertCircle className="h-8 w-8" />
              </div>
              <p className="text-sm font-bold text-red-700">{error}</p>
              <button
                onClick={fetchData}
                className="text-sm text-primary underline hover:no-underline font-medium"
              >
                Reessayer
              </button>
            </div>
          </div>
        )}

        {/* ---------- Visites tab ---------- */}
        {!loading && !error && (
          <TabsContent value="visites" className="flex-1 overflow-auto min-h-[500px] mt-4">
            {filteredVisits.length === 0 ? (
              <div className="flex items-center justify-center h-full min-h-[300px]">
                <p className="text-sm text-muted-foreground font-medium">Aucune visite trouvee.</p>
              </div>
            ) : view === "day" ? (
              <DayView visits={filteredVisits} date={date} onVisitClick={setSelectedVisit} />
            ) : view === "week" ? (
              <WeekView visits={filteredVisits} date={date} onVisitClick={setSelectedVisit} />
            ) : (
              <MonthView visits={filteredVisits} date={date} onVisitClick={setSelectedVisit} />
            )}
          </TabsContent>
        )}

        {/* ---------- Taches tab ---------- */}
        {!loading && !error && (
          <TabsContent value="taches" className="flex-1 overflow-auto min-h-[500px] mt-4">
            {filteredTasks.length === 0 ? (
              <div className="flex items-center justify-center h-full min-h-[300px]">
                <p className="text-sm text-muted-foreground font-medium">Aucune tache trouvee.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredTasks.map((task) => {
                  const sc = TASK_STATUS_COLORS[task.status] ?? TASK_STATUS_COLORS.PENDING;
                  const label = TASK_STATUS_LABELS[task.status] ?? task.status;
                  return (
                    <Card
                      key={task.id}
                      className={cn(
                        "p-4 border cursor-default transition-all hover:shadow-md",
                        sc.bg,
                        sc.border
                      )}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <div className={cn("h-2 w-2 rounded-full shrink-0", sc.dot)} />
                            <Badge
                              variant="outline"
                              className={cn("text-[10px] font-black uppercase", sc.text, sc.border)}
                            >
                              {label}
                            </Badge>
                            <Badge variant="outline" className="text-[10px] font-bold uppercase">
                              {task.type}
                            </Badge>
                          </div>
                          <p className="text-sm font-bold truncate">{task.title}</p>
                          {task.description && (
                            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                              {task.description}
                            </p>
                          )}
                          <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              {task.assignedToName}
                            </span>
                            {task.clientName && (
                              <span className="flex items-center gap-1">
                                <User className="h-3 w-3" />
                                {task.clientName}
                              </span>
                            )}
                            {task.dueAt && (
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {format(new Date(task.dueAt), "dd MMM yyyy 'a' HH:mm", {
                                  locale: fr,
                                })}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>
        )}
      </Tabs>

      {/* Visit Detail Popup */}
      <VisitDetailPopup
        visit={selectedVisit}
        open={!!selectedVisit}
        onClose={() => setSelectedVisit(null)}
        onAction={handleAction}
      />

      {/* Create Visit Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-black flex items-center gap-2">
              <Plus className="h-5 w-5 text-primary" /> Nouvelle Visite
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase text-muted-foreground">Client</label>
              <Select value={visitForm.clientId} onValueChange={(v: string | null) => setVisitForm((p) => ({ ...p, clientId: v ?? "" }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Selectionner un client" />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.firstName} {c.lastName}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase text-muted-foreground">Bien</label>
              <Select value={visitForm.propertyId} onValueChange={(v: string | null) => setVisitForm((p) => ({ ...p, propertyId: v ?? "" }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Selectionner un bien" />
                </SelectTrigger>
                <SelectContent>
                  {properties.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase text-muted-foreground">Agent</label>
              <Select value={visitForm.agentId} onValueChange={(v: string | null) => setVisitForm((p) => ({ ...p, agentId: v ?? "" }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Selectionner un agent" />
                </SelectTrigger>
                <SelectContent>
                  {agents.map((a) => (
                    <SelectItem key={a.id} value={a.id}>{a.firstName} {a.lastName}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase text-muted-foreground">Date et heure</label>
              <Input
                type="datetime-local"
                value={visitForm.scheduledAt}
                onChange={(e) => setVisitForm((p) => ({ ...p, scheduledAt: e.target.value }))}
              />
            </div>
          </div>
          <Button className="w-full font-bold" onClick={handleSubmitVisit} disabled={creating}>
            {creating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Creer la visite
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
