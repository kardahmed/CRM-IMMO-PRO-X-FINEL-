"use client";

import { useState, useCallback, useMemo } from "react";
import {
  DragDropContext,
  type DropResult,
} from "@hello-pangea/dnd";
import { KanbanColumn, PIPELINE_STAGES } from "@/components/pipeline/KanbanColumn";
import { PipelineFilters } from "@/components/pipeline/PipelineFilters";
import { LossReasonModal } from "@/components/pipeline/LossReasonModal";
import type { PipelineClient } from "@/components/pipeline/KanbanCard";
import { Kanban } from "lucide-react";

// ============================================================================
// Mock data – will be replaced by API calls
// ============================================================================
const MOCK_CLIENTS: PipelineClient[] = [
  {
    id: "c1",
    name: "Karim Benmohamed",
    phone: "0555 12 34 56",
    budget: 12_500_000,
    property: "Appt F3 - Résidence Riviera",
    agentName: "Sophie Martin",
    agentAvatar: "https://i.pravatar.cc/150?u=sophie",
    daysInStage: 3,
    lastInteraction: new Date(Date.now() - 1000 * 60 * 60 * 5),
    overdueTasks: 0,
    stage: "ACCUEIL",
  },
  {
    id: "c2",
    name: "Amira Hadj",
    phone: "0661 98 76 54",
    budget: 8_000_000,
    property: "Studio - Les Palmiers",
    agentName: "Lucas Bernard",
    agentAvatar: "https://i.pravatar.cc/150?u=lucas",
    daysInStage: 12,
    lastInteraction: new Date(Date.now() - 1000 * 60 * 60 * 72),
    overdueTasks: 2,
    stage: "ACCUEIL",
  },
  {
    id: "c3",
    name: "Yacine Ferhat",
    phone: "0770 11 22 33",
    budget: 22_000_000,
    property: "Villa Duplex - Horizon Bay",
    agentName: "Emma Petit",
    agentAvatar: "https://i.pravatar.cc/150?u=emma",
    daysInStage: 1,
    lastInteraction: new Date(Date.now() - 1000 * 60 * 30),
    overdueTasks: 0,
    stage: "VISITE_A_GERER",
  },
  {
    id: "c4",
    name: "Nadia Khelifa",
    phone: "0555 44 55 66",
    budget: 15_000_000,
    property: "Appt F4 - Résidence Riviera",
    agentName: "Sophie Martin",
    agentAvatar: "https://i.pravatar.cc/150?u=sophie",
    daysInStage: 5,
    lastInteraction: new Date(Date.now() - 1000 * 60 * 60 * 24),
    overdueTasks: 1,
    stage: "VISITE_CONFIRMEE",
  },
  {
    id: "c5",
    name: "Rachid Belkacem",
    phone: "0661 77 88 99",
    budget: 18_500_000,
    property: "Appt F3 - Les Palmiers",
    agentName: "Lucas Bernard",
    agentAvatar: "https://i.pravatar.cc/150?u=lucas",
    daysInStage: 2,
    lastInteraction: new Date(Date.now() - 1000 * 60 * 60 * 48),
    overdueTasks: 0,
    stage: "VISITE_TERMINEE",
  },
  {
    id: "c6",
    name: "Samia Boudiaf",
    phone: "0770 22 33 44",
    budget: 35_000_000,
    property: "Penthouse - Horizon Bay",
    agentName: "Emma Petit",
    agentAvatar: "https://i.pravatar.cc/150?u=emma",
    daysInStage: 8,
    lastInteraction: new Date(Date.now() - 1000 * 60 * 60 * 12),
    overdueTasks: 0,
    stage: "NEGOCIATION",
  },
  {
    id: "c7",
    name: "Mourad Slimani",
    phone: "0555 66 77 88",
    budget: 14_000_000,
    property: "Appt F2 - Résidence Riviera",
    agentName: "Sophie Martin",
    agentAvatar: "https://i.pravatar.cc/150?u=sophie",
    daysInStage: 4,
    lastInteraction: new Date(Date.now() - 1000 * 60 * 60 * 6),
    overdueTasks: 0,
    stage: "RESERVATION",
  },
  {
    id: "c8",
    name: "Fatima Zohra Messaoud",
    phone: "0661 55 44 33",
    budget: 20_000_000,
    property: "Villa - Horizon Bay",
    agentName: "Lucas Bernard",
    agentAvatar: "https://i.pravatar.cc/150?u=lucas",
    daysInStage: 1,
    lastInteraction: new Date(Date.now() - 1000 * 60 * 60 * 2),
    overdueTasks: 0,
    stage: "VENTE",
  },
  {
    id: "c9",
    name: "Ali Tounsi",
    phone: "0770 99 88 77",
    budget: 9_500_000,
    property: "Studio - Les Palmiers",
    agentName: "Emma Petit",
    agentAvatar: "https://i.pravatar.cc/150?u=emma",
    daysInStage: 15,
    lastInteraction: new Date(Date.now() - 1000 * 60 * 60 * 120),
    overdueTasks: 3,
    stage: "RELANCEMENT",
  },
  {
    id: "c10",
    name: "Meriem Bouzid",
    phone: "0555 11 00 99",
    budget: 11_000_000,
    property: "Appt F3 - Les Palmiers",
    agentName: "Sophie Martin",
    agentAvatar: "https://i.pravatar.cc/150?u=sophie",
    daysInStage: 2,
    lastInteraction: new Date(Date.now() - 1000 * 60 * 60 * 8),
    overdueTasks: 0,
    stage: "VISITE_A_GERER",
  },
  {
    id: "c11",
    name: "Djamel Aït-Ahmed",
    phone: "0661 00 11 22",
    budget: 27_000_000,
    property: "Duplex - Résidence Riviera",
    agentName: "Lucas Bernard",
    agentAvatar: "https://i.pravatar.cc/150?u=lucas",
    daysInStage: 6,
    lastInteraction: new Date(Date.now() - 1000 * 60 * 60 * 36),
    overdueTasks: 1,
    stage: "NEGOCIATION",
  },
];

// ============================================================================
// Page Component
// ============================================================================
export default function PipelinePage() {
  const [clients, setClients] = useState<PipelineClient[]>(MOCK_CLIENTS);
  const [search, setSearch] = useState("");
  const [agent, setAgent] = useState("all");
  const [project, setProject] = useState("all");

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
      return matchSearch && matchAgent && matchProject;
    });
  }, [clients, search, agent, project]);

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
      }).catch((err) => console.error("Failed to update stage:", err));
    },
    [],
  );

  // DnD handler
  const onDragEnd = useCallback(
    (result: DropResult) => {
      const { destination, draggableId } = result;
      if (!destination) return;

      // If dropping into PERDUE, show modal first
      if (destination.droppableId === "PERDUE") {
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
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
            <Kanban className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight uppercase">
              Pipeline
            </h1>
            <p className="text-sm text-muted-foreground font-medium">
              {clients.length} prospects · {PIPELINE_STAGES.length} étapes
            </p>
          </div>
        </div>

        <PipelineFilters
          search={search}
          onSearchChange={setSearch}
          agent={agent}
          onAgentChange={setAgent}
          project={project}
          onProjectChange={setProject}
        />
      </div>

      {/* Kanban Board */}
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="flex-1 overflow-x-auto pb-4 -mx-6 lg:-mx-8 px-6 lg:px-8">
          <div className="flex gap-4 min-w-max">
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
