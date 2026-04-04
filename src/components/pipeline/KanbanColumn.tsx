"use client";

import { Droppable } from "@hello-pangea/dnd";
import { KanbanCard, type PipelineClient } from "./KanbanCard";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";

export interface StageDefinition {
  id: string;
  label: string;
  color: string;
  bgColor: string;
  borderColor: string;
  dotColor: string;
}

export const PIPELINE_STAGES: StageDefinition[] = [
  {
    id: "ACCUEIL",
    label: "Accueil",
    color: "text-blue-700",
    bgColor: "bg-blue-50 dark:bg-blue-950/30",
    borderColor: "border-blue-200 dark:border-blue-800",
    dotColor: "bg-blue-500",
  },
  {
    id: "VISITE_A_GERER",
    label: "Visite à gérer",
    color: "text-purple-700",
    bgColor: "bg-purple-50 dark:bg-purple-950/30",
    borderColor: "border-purple-200 dark:border-purple-800",
    dotColor: "bg-purple-500",
  },
  {
    id: "VISITE_CONFIRMEE",
    label: "Visite confirmée",
    color: "text-indigo-700",
    bgColor: "bg-indigo-50 dark:bg-indigo-950/30",
    borderColor: "border-indigo-200 dark:border-indigo-800",
    dotColor: "bg-indigo-500",
  },
  {
    id: "VISITE_TERMINEE",
    label: "Visite terminée",
    color: "text-cyan-700",
    bgColor: "bg-cyan-50 dark:bg-cyan-950/30",
    borderColor: "border-cyan-200 dark:border-cyan-800",
    dotColor: "bg-cyan-500",
  },
  {
    id: "NEGOCIATION",
    label: "Négociation",
    color: "text-orange-700",
    bgColor: "bg-orange-50 dark:bg-orange-950/30",
    borderColor: "border-orange-200 dark:border-orange-800",
    dotColor: "bg-orange-500",
  },
  {
    id: "RESERVATION",
    label: "Réservation",
    color: "text-amber-700",
    bgColor: "bg-amber-50 dark:bg-amber-950/30",
    borderColor: "border-amber-200 dark:border-amber-800",
    dotColor: "bg-amber-500",
  },
  {
    id: "VENTE",
    label: "Vente",
    color: "text-green-700",
    bgColor: "bg-green-50 dark:bg-green-950/30",
    borderColor: "border-green-200 dark:border-green-800",
    dotColor: "bg-green-500",
  },
  {
    id: "RELANCEMENT",
    label: "Relancement",
    color: "text-gray-700",
    bgColor: "bg-gray-50 dark:bg-gray-950/30",
    borderColor: "border-gray-200 dark:border-gray-800",
    dotColor: "bg-gray-500",
  },
  {
    id: "PERDUE",
    label: "Perdue",
    color: "text-red-700",
    bgColor: "bg-red-50 dark:bg-red-950/30",
    borderColor: "border-red-200 dark:border-red-800",
    dotColor: "bg-red-500",
  },
];

export function KanbanColumn({
  stage,
  clients,
}: {
  stage: StageDefinition;
  clients: PipelineClient[];
}) {
  return (
    <div
      className={cn(
        "flex flex-col rounded-xl border min-w-[240px] w-[240px] md:min-w-[280px] md:w-[280px] shrink-0",
        stage.borderColor,
        stage.bgColor,
      )}
    >
      {/* Column Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-inherit">
        <div className="flex items-center gap-2">
          <div className={cn("h-2.5 w-2.5 rounded-full", stage.dotColor)} />
          <h3 className={cn("text-sm font-black uppercase tracking-tight", stage.color)}>
            {stage.label}
          </h3>
        </div>
        <span
          className={cn(
            "text-[11px] font-black px-2 py-0.5 rounded-full",
            "bg-white/70 dark:bg-black/20",
            stage.color,
          )}
        >
          {clients.length}
        </span>
      </div>

      {/* Droppable Zone */}
      <Droppable droppableId={stage.id}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={cn(
              "flex-1 overflow-y-auto p-2 space-y-2 min-h-[120px] max-h-[calc(100vh-220px)] transition-colors duration-200",
              snapshot.isDraggingOver && "bg-primary/5 ring-2 ring-inset ring-primary/10 rounded-b-xl",
            )}
          >
            {clients.map((client, index) => (
              <KanbanCard key={client.id} client={client} index={index} />
            ))}
            {provided.placeholder}

            {clients.length === 0 && !snapshot.isDraggingOver && (
              <div className="flex items-center justify-center h-20 text-xs text-muted-foreground/50 font-medium italic">
                Aucun prospect
              </div>
            )}
          </div>
        )}
      </Droppable>
    </div>
  );
}
