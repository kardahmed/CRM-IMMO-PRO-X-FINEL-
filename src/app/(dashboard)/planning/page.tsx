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
import {
  Calendar as CalendarIcon,
  Loader2,
  AlertCircle,
  ListTodo,
  User,
  Clock,
  Plus,
  CheckCircle2,
  XCircle,
  PlayCircle,
  MoreHorizontal,
  Columns3,
  List,
  AlertTriangle,
  Phone,
  Mail,
  Eye,
  FileText,
  Users,
  LayoutList,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { format, isPast, isToday, differenceInDays } from "date-fns";
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

const TASK_TYPE_CONFIG: Record<string, { icon: React.ElementType; label: string; color: string }> = {
  CALL: { icon: Phone, label: "Appel", color: "text-blue-600" },
  EMAIL: { icon: Mail, label: "Email", color: "text-indigo-600" },
  VISIT: { icon: Eye, label: "Visite", color: "text-green-600" },
  FOLLOW_UP: { icon: Clock, label: "Suivi", color: "text-amber-600" },
  DOCUMENT: { icon: FileText, label: "Document", color: "text-purple-600" },
  MEETING: { icon: Users, label: "Reunion", color: "text-cyan-600" },
  OTHER: { icon: LayoutList, label: "Autre", color: "text-gray-600" },
};

const TASK_TYPE_FILTER_OPTIONS = [
  { value: "all", label: "Tous les types" },
  { value: "CALL", label: "Appel" },
  { value: "EMAIL", label: "Email" },
  { value: "VISIT", label: "Visite" },
  { value: "FOLLOW_UP", label: "Suivi" },
  { value: "DOCUMENT", label: "Document" },
  { value: "MEETING", label: "Reunion" },
  { value: "OTHER", label: "Autre" },
];

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

  // Task filters
  const [taskTypeFilter, setTaskTypeFilter] = useState("all");
  const [taskStatusFilter, setTaskStatusFilter] = useState("all");
  const [taskSearch, setTaskSearch] = useState("");
  const [taskViewMode, setTaskViewMode] = useState<"list" | "kanban">("list");
  const [taskSortBy] = useState<"dueAt" | "status" | "type">("dueAt");

  // Create visit dialog
  const [isCreateVisitOpen, setIsCreateVisitOpen] = useState(false);
  const [creatingVisit, setCreatingVisit] = useState(false);
  const [clients, setClients] = useState<Array<{ id: string; firstName: string; lastName: string }>>([]);
  const [properties, setProperties] = useState<Array<{ id: string; name: string }>>([]);
  const [agents, setAgents] = useState<Array<{ id: string; firstName: string; lastName: string }>>([]);
  const [visitForm, setVisitForm] = useState({
    clientId: "",
    propertyId: "",
    agentId: "",
    scheduledAt: "",
  });

  // Create task dialog
  const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false);
  const [creatingTask, setCreatingTask] = useState(false);
  const [taskForm, setTaskForm] = useState({
    title: "",
    description: "",
    type: "CALL",
    clientId: "",
    assignedToId: "",
    dueAt: "",
  });

  /* ---- Fetch ---------------------------------------------------- */

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({ limit: "100" });
      if (status !== "all") params.set("status", status);
      if (agent !== "all") params.set("agentId", agent);

      const taskParams = new URLSearchParams({ limit: "100" });
      if (agent !== "all") taskParams.set("assignedToId", agent);

      const [visitsRes, tasksRes] = await Promise.all([
        fetch(`/api/v1/visits?${params.toString()}`),
        fetch(`/api/v1/tasks?${taskParams.toString()}`),
      ]);

      if (!visitsRes.ok)
        throw new Error(`Erreur lors du chargement des visites (${visitsRes.status})`);
      if (!tasksRes.ok)
        throw new Error(`Erreur lors du chargement des taches (${tasksRes.status})`);

      const visitsJson = await visitsRes.json();
      const tasksJson = await tasksRes.json();

      if (!visitsJson.success)
        throw new Error(visitsJson.error ?? "Erreur inconnue (visites)");
      if (!tasksJson.success)
        throw new Error(tasksJson.error ?? "Erreur inconnue (taches)");

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
    let filtered = tasks.filter((t) => {
      if (agent !== "all" && t.assignedToId !== agent) return false;
      if (taskStatusFilter !== "all" && t.status !== taskStatusFilter) return false;
      if (taskTypeFilter !== "all" && t.type !== taskTypeFilter) return false;
      if (taskSearch) {
        const q = taskSearch.toLowerCase();
        const matchTitle = t.title.toLowerCase().includes(q);
        const matchClient = t.clientName?.toLowerCase().includes(q) ?? false;
        const matchAgent = t.assignedToName.toLowerCase().includes(q);
        if (!matchTitle && !matchClient && !matchAgent) return false;
      }
      return true;
    });

    // Sort
    filtered = [...filtered].sort((a, b) => {
      if (taskSortBy === "dueAt") {
        // Overdue first, then by due date
        const aOverdue = a.dueAt && isPast(new Date(a.dueAt)) && a.status !== "COMPLETED" && a.status !== "CANCELLED";
        const bOverdue = b.dueAt && isPast(new Date(b.dueAt)) && b.status !== "COMPLETED" && b.status !== "CANCELLED";
        if (aOverdue && !bOverdue) return -1;
        if (!aOverdue && bOverdue) return 1;
        if (!a.dueAt) return 1;
        if (!b.dueAt) return -1;
        return new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime();
      }
      if (taskSortBy === "status") {
        const order = ["PENDING", "IN_PROGRESS", "COMPLETED", "CANCELLED"];
        return order.indexOf(a.status) - order.indexOf(b.status);
      }
      return a.type.localeCompare(b.type);
    });

    return filtered;
  }, [tasks, agent, taskStatusFilter, taskTypeFilter, taskSearch, taskSortBy]);

  // Stats for tasks
  const taskStats = useMemo(() => {
    const overdue = tasks.filter(
      (t) =>
        t.dueAt &&
        isPast(new Date(t.dueAt)) &&
        t.status !== "COMPLETED" &&
        t.status !== "CANCELLED"
    ).length;
    const pending = tasks.filter((t) => t.status === "PENDING").length;
    const inProgress = tasks.filter((t) => t.status === "IN_PROGRESS").length;
    const completed = tasks.filter((t) => t.status === "COMPLETED").length;
    return { overdue, pending, inProgress, completed };
  }, [tasks]);

  // Group tasks by status for kanban view
  const tasksByStatus = useMemo(() => {
    const groups: Record<string, PlanningTask[]> = {
      PENDING: [],
      IN_PROGRESS: [],
      COMPLETED: [],
      CANCELLED: [],
    };
    for (const task of filteredTasks) {
      if (groups[task.status]) {
        groups[task.status].push(task);
      }
    }
    return groups;
  }, [filteredTasks]);

  /* ---- Actions -------------------------------------------------- */

  const handleVisitAction = async (visitId: string, action: string) => {
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
        toast.success("Statut de la visite mis a jour");
      }
    } catch {
      toast.error("Erreur lors de la mise a jour");
    }
    setSelectedVisit(null);
  };

  const handleTaskStatusChange = async (taskId: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/v1/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error ?? "Erreur");
      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t))
      );
      toast.success(`Tache ${TASK_STATUS_LABELS[newStatus] ?? newStatus}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur lors de la mise a jour");
    }
  };

  const fetchFormData = async () => {
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
      // Lists may fail silently
    }
  };

  const handleOpenCreateVisit = async () => {
    setIsCreateVisitOpen(true);
    setVisitForm({ clientId: "", propertyId: "", agentId: "", scheduledAt: "" });
    await fetchFormData();
  };

  const handleOpenCreateTask = async () => {
    setIsCreateTaskOpen(true);
    setTaskForm({ title: "", description: "", type: "CALL", clientId: "", assignedToId: "", dueAt: "" });
    await fetchFormData();
  };

  const handleSubmitVisit = async () => {
    if (!visitForm.clientId || !visitForm.propertyId || !visitForm.agentId || !visitForm.scheduledAt) {
      toast.error("Veuillez remplir tous les champs");
      return;
    }
    setCreatingVisit(true);
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
      setIsCreateVisitOpen(false);
      fetchData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur lors de la creation");
    } finally {
      setCreatingVisit(false);
    }
  };

  const handleSubmitTask = async () => {
    if (!taskForm.title.trim() || !taskForm.assignedToId) {
      toast.error("Le titre et l'agent sont requis");
      return;
    }
    setCreatingTask(true);
    try {
      const res = await fetch("/api/v1/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: taskForm.title,
          description: taskForm.description || null,
          type: taskForm.type,
          clientId: taskForm.clientId || null,
          assignedToId: taskForm.assignedToId,
          dueAt: taskForm.dueAt ? new Date(taskForm.dueAt).toISOString() : null,
        }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error ?? "Erreur");
      toast.success("Tache creee avec succes");
      setIsCreateTaskOpen(false);
      fetchData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur lors de la creation");
    } finally {
      setCreatingTask(false);
    }
  };

  /* ---- Task Card Component ------------------------------------- */

  const renderTaskCard = (task: PlanningTask) => {
    const sc = TASK_STATUS_COLORS[task.status] ?? TASK_STATUS_COLORS.PENDING;
    const label = TASK_STATUS_LABELS[task.status] ?? task.status;
    const typeConfig = TASK_TYPE_CONFIG[task.type] ?? TASK_TYPE_CONFIG.OTHER;
    const TypeIcon = typeConfig.icon;

    const isOverdue =
      task.dueAt &&
      isPast(new Date(task.dueAt)) &&
      task.status !== "COMPLETED" &&
      task.status !== "CANCELLED";

    const isDueToday = task.dueAt && isToday(new Date(task.dueAt));

    const daysOverdue = isOverdue
      ? differenceInDays(new Date(), new Date(task.dueAt!))
      : 0;

    return (
      <Card
        key={task.id}
        className={cn(
          "p-4 border transition-all hover:shadow-md group",
          sc.bg,
          sc.border,
          isOverdue && "ring-2 ring-red-300 border-red-300"
        )}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <div className={cn("h-2 w-2 rounded-full shrink-0", sc.dot)} />
              <Badge
                variant="outline"
                className={cn("text-[10px] font-black uppercase", sc.text, sc.border)}
              >
                {label}
              </Badge>
              <Badge
                variant="outline"
                className={cn("text-[10px] font-bold uppercase gap-1", typeConfig.color)}
              >
                <TypeIcon className="h-2.5 w-2.5" />
                {typeConfig.label}
              </Badge>
              {isOverdue && (
                <Badge className="text-[10px] font-black uppercase bg-red-500 text-white border-red-600 gap-1">
                  <AlertTriangle className="h-2.5 w-2.5" />
                  En retard ({daysOverdue}j)
                </Badge>
              )}
              {isDueToday && !isOverdue && (
                <Badge className="text-[10px] font-black uppercase bg-amber-500 text-white border-amber-600">
                  Aujourd&apos;hui
                </Badge>
              )}
            </div>
            <p className="text-sm font-bold truncate">{task.title}</p>
            {task.description && (
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                {task.description}
              </p>
            )}
            <div className="flex items-center gap-4 mt-2.5 text-xs text-muted-foreground flex-wrap">
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
                <span
                  className={cn(
                    "flex items-center gap-1",
                    isOverdue && "text-red-600 font-bold"
                  )}
                >
                  <Clock className="h-3 w-3" />
                  {format(new Date(task.dueAt), "dd MMM yyyy 'a' HH:mm", { locale: fr })}
                </span>
              )}
            </div>
          </div>

          {/* Actions */}
          {task.status !== "COMPLETED" && task.status !== "CANCELLED" && (
            <DropdownMenu>
              <DropdownMenuTrigger
                className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity inline-flex items-center justify-center rounded-md text-sm font-medium hover:bg-accent hover:text-accent-foreground"
              >
                <MoreHorizontal className="h-4 w-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                {task.status === "PENDING" && (
                  <DropdownMenuItem
                    onClick={() => handleTaskStatusChange(task.id, "IN_PROGRESS")}
                    className="gap-2 font-medium"
                  >
                    <PlayCircle className="h-4 w-4 text-blue-600" />
                    Demarrer
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem
                  onClick={() => handleTaskStatusChange(task.id, "COMPLETED")}
                  className="gap-2 font-medium"
                >
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  Terminer
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => handleTaskStatusChange(task.id, "CANCELLED")}
                  className="gap-2 font-medium text-red-600"
                >
                  <XCircle className="h-4 w-4" />
                  Annuler
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </Card>
    );
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

        {activeTab === "visites" && (
          <PlanningFilters
            view={view}
            onViewChange={setView}
            agent={agent}
            onAgentChange={setAgent}
            status={status}
            onStatusChange={setStatus}
            onCreateVisit={handleOpenCreateVisit}
          />
        )}
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(String(v ?? "visites"))} className="flex-1 flex flex-col min-h-0">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
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
                  {tasks.length}
                </Badge>
              )}
              {taskStats.overdue > 0 && (
                <Badge className="ml-1 text-[10px] px-1.5 py-0 bg-red-500 text-white">
                  {taskStats.overdue}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          {/* Task tab controls */}
          {activeTab === "taches" && !loading && !error && (
            <div className="flex items-center gap-2 flex-wrap">
              <div className="relative">
                <Input
                  placeholder="Rechercher..."
                  value={taskSearch}
                  onChange={(e) => setTaskSearch(e.target.value)}
                  className="pl-3 w-[160px] text-sm h-9"
                />
              </div>
              <Select value={taskTypeFilter} onValueChange={(v: string | null) => setTaskTypeFilter(v ?? "all")}>
                <SelectTrigger className="w-[140px] text-xs h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TASK_TYPE_FILTER_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={taskStatusFilter} onValueChange={(v: string | null) => setTaskStatusFilter(v ?? "all")}>
                <SelectTrigger className="w-[140px] text-xs h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les statuts</SelectItem>
                  {Object.entries(TASK_STATUS_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="flex items-center gap-1 p-0.5 rounded-lg bg-accent/30 border">
                <Button
                  size="sm"
                  variant={taskViewMode === "list" ? "default" : "ghost"}
                  onClick={() => setTaskViewMode("list")}
                  className="h-7 w-7 p-0"
                >
                  <List className="h-3.5 w-3.5" />
                </Button>
                <Button
                  size="sm"
                  variant={taskViewMode === "kanban" ? "default" : "ghost"}
                  onClick={() => setTaskViewMode("kanban")}
                  className="h-7 w-7 p-0"
                >
                  <Columns3 className="h-3.5 w-3.5" />
                </Button>
              </div>
              <Button size="sm" onClick={handleOpenCreateTask} className="gap-1.5 font-bold h-9">
                <Plus className="h-3.5 w-3.5" />
                Nouvelle tache
              </Button>
            </div>
          )}
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex-1 flex items-center justify-center min-h-[400px]">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground font-medium">
                Chargement du planning...
              </p>
            </div>
          </div>
        )}

        {/* Error */}
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

        {/* -------- Visites tab -------- */}
        {!loading && !error && (
          <TabsContent value="visites" className="flex-1 overflow-auto min-h-[500px] mt-4">
            {filteredVisits.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full min-h-[300px] gap-3">
                <CalendarIcon className="h-10 w-10 text-muted-foreground" />
                <p className="text-sm text-muted-foreground font-medium">
                  Aucune visite trouvee.
                </p>
                <Button size="sm" variant="outline" onClick={handleOpenCreateVisit} className="gap-1.5">
                  <Plus className="h-3.5 w-3.5" />
                  Planifier une visite
                </Button>
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

        {/* -------- Taches tab -------- */}
        {!loading && !error && (
          <TabsContent value="taches" className="flex-1 overflow-auto min-h-[500px] mt-4">
            {/* Task Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
              <div className="p-3 rounded-xl border bg-card text-center">
                <p className="text-[10px] font-black uppercase text-muted-foreground">En attente</p>
                <p className="text-xl font-black text-yellow-600">{taskStats.pending}</p>
              </div>
              <div className="p-3 rounded-xl border bg-card text-center">
                <p className="text-[10px] font-black uppercase text-muted-foreground">En cours</p>
                <p className="text-xl font-black text-blue-600">{taskStats.inProgress}</p>
              </div>
              <div className="p-3 rounded-xl border bg-card text-center">
                <p className="text-[10px] font-black uppercase text-muted-foreground">Terminees</p>
                <p className="text-xl font-black text-gray-500">{taskStats.completed}</p>
              </div>
              <div className={cn(
                "p-3 rounded-xl border text-center",
                taskStats.overdue > 0 ? "bg-red-50 border-red-200" : "bg-card"
              )}>
                <p className="text-[10px] font-black uppercase text-muted-foreground">En retard</p>
                <p className={cn("text-xl font-black", taskStats.overdue > 0 ? "text-red-600" : "text-gray-400")}>
                  {taskStats.overdue}
                </p>
              </div>
            </div>

            {filteredTasks.length === 0 ? (
              <div className="flex flex-col items-center justify-center min-h-[200px] gap-3">
                <ListTodo className="h-10 w-10 text-muted-foreground" />
                <p className="text-sm text-muted-foreground font-medium">
                  Aucune tache trouvee.
                </p>
                <Button size="sm" variant="outline" onClick={handleOpenCreateTask} className="gap-1.5">
                  <Plus className="h-3.5 w-3.5" />
                  Creer une tache
                </Button>
              </div>
            ) : taskViewMode === "list" ? (
              /* List View */
              <div className="space-y-3">{filteredTasks.map(renderTaskCard)}</div>
            ) : (
              /* Kanban View */
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {(["PENDING", "IN_PROGRESS", "COMPLETED", "CANCELLED"] as const).map(
                  (statusKey) => {
                    const sc = TASK_STATUS_COLORS[statusKey];
                    const statusLabel = TASK_STATUS_LABELS[statusKey];
                    const statusTasks = tasksByStatus[statusKey] || [];

                    return (
                      <div key={statusKey} className="space-y-3">
                        <div className={cn("flex items-center gap-2 p-3 rounded-xl border", sc.bg, sc.border)}>
                          <div className={cn("h-3 w-3 rounded-full", sc.dot)} />
                          <span className={cn("text-xs font-black uppercase", sc.text)}>
                            {statusLabel}
                          </span>
                          <Badge variant="secondary" className="ml-auto text-[10px] px-1.5">
                            {statusTasks.length}
                          </Badge>
                        </div>
                        <div className="space-y-2 min-h-[100px]">
                          {statusTasks.map(renderTaskCard)}
                          {statusTasks.length === 0 && (
                            <div className="p-6 text-center text-xs text-muted-foreground border border-dashed rounded-xl">
                              Aucune tache
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  }
                )}
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
        onAction={handleVisitAction}
      />

      {/* Create Visit Dialog */}
      <Dialog open={isCreateVisitOpen} onOpenChange={setIsCreateVisitOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-black flex items-center gap-2">
              <Plus className="h-5 w-5 text-primary" /> Nouvelle Visite
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase text-muted-foreground">Client</label>
              <Select
                value={visitForm.clientId}
                onValueChange={(v: string | null) => setVisitForm((p) => ({ ...p, clientId: v ?? "" }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selectionner un client" />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.firstName} {c.lastName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase text-muted-foreground">Bien</label>
              <Select
                value={visitForm.propertyId}
                onValueChange={(v: string | null) => setVisitForm((p) => ({ ...p, propertyId: v ?? "" }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selectionner un bien" />
                </SelectTrigger>
                <SelectContent>
                  {properties.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase text-muted-foreground">Agent</label>
              <Select
                value={visitForm.agentId}
                onValueChange={(v: string | null) => setVisitForm((p) => ({ ...p, agentId: v ?? "" }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selectionner un agent" />
                </SelectTrigger>
                <SelectContent>
                  {agents.map((a) => (
                    <SelectItem key={a.id} value={a.id}>
                      {a.firstName} {a.lastName}
                    </SelectItem>
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
          <Button className="w-full font-bold" onClick={handleSubmitVisit} disabled={creatingVisit}>
            {creatingVisit && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Creer la visite
          </Button>
        </DialogContent>
      </Dialog>

      {/* Create Task Dialog */}
      <Dialog open={isCreateTaskOpen} onOpenChange={setIsCreateTaskOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-black flex items-center gap-2">
              <ListTodo className="h-5 w-5 text-primary" /> Nouvelle Tache
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase text-muted-foreground">Titre</label>
              <Input
                placeholder="Ex: Appeler le client pour confirmation"
                value={taskForm.title}
                onChange={(e) => setTaskForm((p) => ({ ...p, title: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase text-muted-foreground">
                Description (optionnel)
              </label>
              <Textarea
                placeholder="Details supplementaires..."
                value={taskForm.description}
                onChange={(e) => setTaskForm((p) => ({ ...p, description: e.target.value }))}
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-muted-foreground">Type</label>
                <Select
                  value={taskForm.type}
                  onValueChange={(v: string | null) => setTaskForm((p) => ({ ...p, type: v ?? "CALL" }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TASK_TYPE_FILTER_OPTIONS.filter((o) => o.value !== "all").map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-muted-foreground">Echeance</label>
                <Input
                  type="datetime-local"
                  value={taskForm.dueAt}
                  onChange={(e) => setTaskForm((p) => ({ ...p, dueAt: e.target.value }))}
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase text-muted-foreground">
                Assigner a
              </label>
              <Select
                value={taskForm.assignedToId}
                onValueChange={(v: string | null) => setTaskForm((p) => ({ ...p, assignedToId: v ?? "" }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selectionner un agent" />
                </SelectTrigger>
                <SelectContent>
                  {agents.map((a) => (
                    <SelectItem key={a.id} value={a.id}>
                      {a.firstName} {a.lastName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase text-muted-foreground">
                Client (optionnel)
              </label>
              <Select
                value={taskForm.clientId}
                onValueChange={(v: string | null) => setTaskForm((p) => ({ ...p, clientId: v ?? "" }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selectionner un client" />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.firstName} {c.lastName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button className="w-full font-bold" onClick={handleSubmitTask} disabled={creatingTask}>
            {creatingTask && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Creer la tache
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
