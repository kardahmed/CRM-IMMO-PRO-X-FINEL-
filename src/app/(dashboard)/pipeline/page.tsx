"use client";

import * as Sentry from "@sentry/nextjs";
import { useState, useCallback, useMemo, useEffect } from "react";
import {
  DragDropContext,
  type DropResult,
} from "@hello-pangea/dnd";
import { KanbanColumn, PIPELINE_STAGES } from "@/components/pipeline/KanbanColumn";
import { PipelineFilters } from "@/components/pipeline/PipelineFilters";
import { PipelineSummary } from "@/components/pipeline/PipelineSummary";
import { LossReasonModal } from "@/components/pipeline/LossReasonModal";
import type { PipelineClient } from "@/components/pipeline/KanbanCard";
import { Kanban, Loader2, AlertCircle, RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface FilterOption {
  id: string;
  label: string;
}

// ============================================================================
// Map API client data to PipelineClient shape
// ============================================================================
interface ApiClient {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  budgetMin: string | number | null;
  budgetMax: string | number | null;
  pipelineStage: string;
  desiredType: string | null;
  desiredWilaya: string | null;
  source: string;
  createdAt: string;
  updatedAt: string;
  assignedAgent: {
    id: string;
    firstName: string;
    lastName: string;
  } | null;
}

function mapApiClientToPipeline(c: ApiClient): PipelineClient {
  const budget = c.budgetMax ? Number(c.budgetMax) : c.budgetMin ? Number(c.budgetMin) : 0;
  const agentName = c.assignedAgent
    ? `${c.assignedAgent.firstName} ${c.assignedAgent.lastName}`
    : "Non assigné";

  const updatedAt = new Date(c.updatedAt);
  const now = new Date();
  const daysInStage = Math.max(0, Math.floor((now.getTime() - updatedAt.getTime()) / (1000 * 60 * 60 * 24)));

  return {
    id: c.id,
    name: `${c.firstName} ${c.lastName}`,
    phone: c.phone,
    budget,
    property: [c.desiredType, c.desiredWilaya].filter(Boolean).join(" - ") || "Non renseigné",
    agentName,
    agentAvatar: "",
    daysInStage,
    lastInteraction: updatedAt,
    overdueTasks: 0,
    stage: c.pipelineStage,
    source: c.source,
  };
}

// ============================================================================
// Page Component
// ============================================================================
export default function PipelinePage() {
  const [clients, setClients] = useState<PipelineClient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [agent, setAgent] = useState("all");
  const [project, setProject] = useState("all");
  const [source, setSource] = useState("all");
  const [minBudget, setMinBudget] = useState("");

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (search) count++;
    if (agent !== "all") count++;
    if (project !== "all") count++;
    if (source !== "all") count++;
    if (minBudget) count++;
    return count;
  }, [search, agent, project, source, minBudget]);

  const resetFilters = useCallback(() => {
    setSearch("");
    setAgent("all");
    setProject("all");
    setSource("all");
    setMinBudget("");
  }, []);

  const fetchClients = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/v1/clients?limit=250");
      if (!res.ok) throw new Error(`Erreur ${res.status}`);
      const json = await res.json();
      if (!json.success) throw new Error(json.error || "Erreur inconnue");
      const mapped = (json.data.clients as ApiClient[]).map(mapApiClientToPipeline);
      setClients(mapped);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors du chargement");
    } finally {
      setLoading(false);
    }
  }, []);

  // Extract dynamic filters from clients
  const agents = useMemo<FilterOption[]>(() => {
    const unique = new Set<string>();
    clients.forEach(c => {
      if (c.agentName && c.agentName !== "Non assigné") unique.add(c.agentName);
    });
    return Array.from(unique).sort().map(name => ({ id: name, label: name }));
  }, [clients]);

  const projects = useMemo<FilterOption[]>(() => {
    const unique = new Set<string>();
    clients.forEach(c => {
      if (c.property && c.property !== "Non renseigné") {
        // Extract project name (it's often the second part or the whole thing)
        // For simplicity, we use the property string as is or split by ' - '
        const p = c.property.split(" - ")[1] || c.property.split(" - ")[0];
        if (p) unique.add(p);
      }
    });
    return Array.from(unique).sort().map(name => ({ id: name, label: name }));
  }, [clients]);

  // Fetch clients from API
  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  // Loss reason modal state
  const [lossModal, setLossModal] = useState<{
    open: boolean;
    clientId: string;
    clientName: string;
    sourceStage: string;
    sourceIndex: number;
    destIndex: number;
  }>({
    open: false,
    clientId: "",
    clientName: "",
    sourceStage: "",
    sourceIndex: 0,
    destIndex: 0,
  });

  // Pending move for loss reason flow
  const [pendingMove, setPendingMove] = useState<DropResult | null>(null);

  // Filtered clients
  const filteredClients = useMemo(() => {
    return clients.filter((c) => {
      const matchSearch =
        !search ||
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.phone.replace(/\s/g, "").includes(search.replace(/\s/g, ""));
      const matchAgent =
        agent === "all" ||
        c.agentName.toLowerCase().includes(agent.toLowerCase());
      const matchProject =
        project === "all" ||
        c.property.toLowerCase().includes(project.toLowerCase());
      const matchSource = 
        source === "all" || 
        c.source === source;
      const matchBudget = 
        !minBudget || 
        c.budget >= Number(minBudget);
        
      return matchSearch && matchAgent && matchProject && matchSource && matchBudget;
    });
  }, [clients, search, agent, project, source, minBudget]);

  // Group by stage
  const clientsByStage = useMemo(() => {
    const map: Record<string, PipelineClient[]> = {};
    PIPELINE_STAGES.forEach((s) => (map[s.id] = []));
    filteredClients.forEach((c) => {
      if (map[c.stage]) map[c.stage].push(c);
    });
    return map;
  }, [filteredClients]);

  // Move a client between stages
  const moveClient = useCallback(
    (result: DropResult, lossReason?: string) => {
      const { source, destination, draggableId } = result;
      if (!destination) return;
      if (
        source.droppableId === destination.droppableId &&
        source.index === destination.index
      )
        return;

      setClients((prev) => {
        const updated = prev.map((c) => {
          if (c.id === draggableId) {
            return { ...c, stage: destination.droppableId, daysInStage: 0 };
          }
          return c;
        });
        return updated;
      });

      // Call API
      fetch(`/api/v1/clients/${draggableId}/change-stage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          stage: destination.droppableId,
          lossReason,
        }),
      }).catch((err) => Sentry.captureException(err, { tags: { context: "Pipeline stage update" } }));
    },
    [],
  );

  // DnD handler
  const onDragEnd = useCallback(
    (result: DropResult) => {
      const { destination, draggableId } = result;
      if (!destination) return;

      // If dropping into CLOSED, show loss reason modal first
      if (destination.droppableId === "CLOSED") {
        const client = clients.find((c) => c.id === draggableId);
        if (!client) return;
        setPendingMove(result);
        setLossModal({
          open: true,
          clientId: draggableId,
          clientName: client.name,
          sourceStage: result.source.droppableId,
          sourceIndex: result.source.index,
          destIndex: destination.index,
        });
        return;
      }

      moveClient(result);
    },
    [clients, moveClient],
  );

  // Loss reason confirmed
  const handleLossConfirm = useCallback(
    (reason: string, details?: string) => {
      if (pendingMove) {
        moveClient(pendingMove, `${reason}${details ? ` – ${details}` : ""}`);
        setPendingMove(null);
      }
      setLossModal((m) => ({ ...m, open: false }));
    },
    [pendingMove, moveClient],
  );

  // Loss reason cancelled → revert
  const handleLossCancel = useCallback(() => {
    setPendingMove(null);
    setLossModal((m) => ({ ...m, open: false }));
  }, []);

  return (
    <div className="flex flex-col h-full gap-6">
      {/* Premium Header */}
      <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-6 pb-4 border-b border-border/50">
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-black uppercase tracking-[0.3em]">
            <Kanban className="h-3.5 w-3.5" /> Pipeline de Vente
          </div>
          <h1 className="text-4xl font-black tracking-tighter text-foreground flex items-center gap-3">
            Pipeline 360°
            <Badge variant="outline" className="font-black border-primary/20 text-primary bg-primary/5 text-xs">
              {filteredClients.length} prospects
            </Badge>
          </h1>
          <p className="text-sm text-muted-foreground font-medium">
            Suivez vos prospects a travers les {PIPELINE_STAGES.length} etapes du tunnel de conversion
          </p>
        </div>

        <div className="flex items-center gap-3">
          {activeFiltersCount > 0 && (
            <Button variant="ghost" onClick={resetFilters} className="text-xs font-bold text-muted-foreground rounded-xl">
              Reinitialiser ({activeFiltersCount})
            </Button>
          )}
          <Button
             variant="outline"
             size="icon"
             onClick={fetchClients}
             disabled={loading}
             className="h-12 w-12 rounded-2xl border-border bg-card shadow-stripe hover:shadow-stripe-lg active:scale-95 transition-all"
          >
            <RefreshCcw className={cn("h-4 w-4", loading && "animate-spin")} />
          </Button>
          <PipelineFilters
            search={search}
            onSearchChange={setSearch}
            agent={agent}
            onAgentChange={setAgent}
            project={project}
            onProjectChange={setProject}
            source={source}
            onSourceChange={setSource}
            minBudget={minBudget}
            onMinBudgetChange={setMinBudget}
            activeFiltersCount={activeFiltersCount}
            onReset={resetFilters}
            agents={agents}
            projects={projects}
          />
        </div>
      </div>

      {/* Summary Dashboard */}
      {!loading && !error && (
        <PipelineSummary clients={filteredClients} />
      )}

      {/* Loading */}
      {loading && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => <div key={i} className="h-28 rounded-[24px] bg-card border border-border animate-pulse" />)}
          </div>
          <div className="flex gap-4">
            {[...Array(4)].map((_, i) => <div key={i} className="h-96 w-80 rounded-2xl bg-card border border-border animate-pulse shrink-0" />)}
          </div>
        </div>
      )}

      {/* Error */}
      {error && !loading && (
        <div className="flex flex-col items-center justify-center py-20 gap-6">
          <div className="p-8 rounded-[32px] bg-rose-50 dark:bg-rose-500/5 border border-rose-100 dark:border-rose-500/10 shadow-stripe text-center">
            <AlertCircle className="h-12 w-12 text-rose-500 mx-auto mb-4" />
            <p className="text-lg font-black text-foreground tracking-tight">{error}</p>
          </div>
          <Button
            variant="outline"
            onClick={() => window.location.reload()}
            className="h-12 px-8 rounded-full font-bold"
          >
            Reessayer
          </Button>
        </div>
      )}

      {/* Kanban Board */}
      {!loading && !error && (
        <DragDropContext onDragEnd={onDragEnd}>
          <div className="flex-1 overflow-x-auto pb-4 -mx-3 md:-mx-6 lg:-mx-8 px-3 md:px-6 lg:px-8 scrollbar-thin">
            <div className="flex gap-3 md:gap-4 min-w-max">
              {PIPELINE_STAGES.map((stage) => (
                <KanbanColumn
                  key={stage.id}
                  stage={stage}
                  clients={clientsByStage[stage.id] || []}
                />
              ))}
            </div>
          </div>
        </DragDropContext>
      )}

      {/* Loss Reason Modal */}
      <LossReasonModal
        open={lossModal.open}
        clientName={lossModal.clientName}
        onConfirm={handleLossConfirm}
        onCancel={handleLossCancel}
      />
    </div>
  );
}
