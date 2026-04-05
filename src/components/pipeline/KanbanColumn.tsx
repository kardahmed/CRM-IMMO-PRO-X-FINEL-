"use client";

import { Droppable } from "@hello-pangea/dnd";
import { KanbanCard, type PipelineClient } from "./KanbanCard";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { 
  MoreHorizontal, 
  Plus, 
  ArrowUpDown,
  TrendingUp,
  LayoutDashboard
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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
    id: "NEW",
    label: "Nouveau",
    color: "text-blue-700",
    bgColor: "bg-blue-50 dark:bg-blue-950/30",
    borderColor: "border-blue-200 dark:border-blue-800",
    dotColor: "bg-blue-500",
  },
  {
    id: "CONTACTED",
    label: "Contacté",
    color: "text-purple-700",
    bgColor: "bg-purple-50 dark:bg-purple-950/30",
    borderColor: "border-purple-200 dark:border-purple-800",
    dotColor: "bg-purple-500",
  },
  {
    id: "QUALIFIED",
    label: "Qualifié",
    color: "text-indigo-700",
    bgColor: "bg-indigo-50 dark:bg-indigo-950/30",
    borderColor: "border-indigo-200 dark:border-indigo-800",
    dotColor: "bg-indigo-500",
  },
  {
    id: "VISIT_SCHEDULED",
    label: "Prospection",
    color: "text-cyan-700",
    bgColor: "bg-cyan-50 dark:bg-cyan-950/30",
    borderColor: "border-cyan-200 dark:border-cyan-800",
    dotColor: "bg-cyan-500",
  },
  {
    id: "VISITED",
    label: "Visité",
    color: "text-teal-700",
    bgColor: "bg-teal-50 dark:bg-teal-950/30",
    borderColor: "border-teal-200 dark:border-teal-800",
    dotColor: "bg-teal-500",
  },
  {
    id: "NEGOTIATION",
    label: "Négociation",
    color: "text-orange-700",
    bgColor: "bg-orange-50 dark:bg-orange-950/30",
    borderColor: "border-orange-200 dark:border-orange-800",
    dotColor: "bg-orange-500",
  },
  {
    id: "RESERVED",
    label: "Réservé",
    color: "text-amber-700",
    bgColor: "bg-amber-50 dark:bg-amber-950/30",
    borderColor: "border-amber-200 dark:border-amber-800",
    dotColor: "bg-amber-500",
  },
  {
    id: "SIGNED",
    label: "Signé",
    color: "text-green-700",
    bgColor: "bg-green-50 dark:bg-green-950/30",
    borderColor: "border-green-200 dark:border-green-800",
    dotColor: "bg-green-500",
  },
  {
    id: "CLOSED",
    label: "Perdu",
    color: "text-gray-700",
    bgColor: "bg-gray-50 dark:bg-gray-950/30",
    borderColor: "border-gray-200 dark:border-gray-800",
    dotColor: "bg-gray-500",
  },
];

function formatColumnBudget(budget: number): string {
  if (budget >= 1_000_000) {
    return `${(budget / 1_000_000).toFixed(1)}M DA`;
  }
  return `${(budget / 1_000).toFixed(0)}k DA`;
}

export function KanbanColumn({
  stage,
  clients,
}: {
  stage: StageDefinition;
  clients: PipelineClient[];
}) {
  const totalBudget = clients.reduce((acc, c) => acc + (c.budget || 0), 0);

  return (
    <div
      className={cn(
        "flex flex-col rounded-2xl border-2 transition-all duration-300 min-w-[280px] w-[280px] md:min-w-[320px] md:w-[320px] shrink-0",
        stage.borderColor,
        "bg-accent/50 backdrop-blur-sm",
        "shadow-sm hover:shadow-md"
      )}
    >
      {/* Column Header */}
      <div className="flex flex-col gap-2 p-4 border-b-2 border-inherit">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className={cn("h-3 w-3 rounded-full ring-4 ring-white dark:ring-neutral-900", stage.dotColor)} />
            <h3 className={cn("text-xs font-black uppercase tracking-widest", stage.color)}>
              {stage.label}
            </h3>
            <Badge variant="outline" className={cn("text-xs font-black h-5 px-1.5 rounded-md", stage.color, "bg-white/50 border-inherit")}>
              {clients.length}
            </Badge>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger>
              <div className="p-1 px-2 hover:bg-accent rounded-md text-muted-foreground hover:text-foreground">
                <MoreHorizontal className="h-4 w-4" />
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem className="text-xs font-bold uppercase tracking-tight">
                <ArrowUpDown className="mr-2 h-3.5 w-3.5" /> Trier par budget
              </DropdownMenuItem>
              <DropdownMenuItem className="text-xs font-bold uppercase tracking-tight">
                <LayoutDashboard className="mr-2 h-3.5 w-3.5" /> Trier par date
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="flex items-center justify-between mt-1">
          <div className="flex items-center gap-1.5">
            <TrendingUp className={cn("h-3.5 w-3.5", stage.color)} />
            <span className={cn("text-sm font-black tabular-nums tracking-tighter", stage.color)}>
              {formatColumnBudget(totalBudget)}
            </span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Ajouter un prospect"
            className={cn("h-7 w-7 rounded-full bg-white/50 dark:bg-black/20 hover:scale-110 transition-transform", stage.color)}
          >
            <Plus className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Droppable Zone */}
      <Droppable droppableId={stage.id}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={cn(
              "flex-1 overflow-y-auto p-3 space-y-3 min-h-[120px] max-h-[calc(100vh-280px)] transition-all duration-300",
              snapshot.isDraggingOver && "bg-white/40 dark:bg-black/10 rounded-b-2xl",
              "scrollbar-thin scrollbar-thumb-neutral-200 dark:scrollbar-thumb-neutral-800"
            )}
          >
            {clients.map((client, index) => (
              <KanbanCard key={client.id} client={client} index={index} />
            ))}
            {provided.placeholder}

            {clients.length === 0 && !snapshot.isDraggingOver && (
              <div className="flex flex-col items-center justify-center h-32 opacity-30 grayscale group">
                <LayoutDashboard className="h-8 w-8 mb-2 animate-pulse" />
                <div className="text-xs font-black uppercase tracking-widest text-center">
                  Aucun prospect <br/> dans cette étape
                </div>
              </div>
            )}
          </div>
        )}
      </Droppable>
    </div>
  );
}
