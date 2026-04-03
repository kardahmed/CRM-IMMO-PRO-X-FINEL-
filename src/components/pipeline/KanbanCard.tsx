"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  Phone,
  Home,
  Clock,
  AlertTriangle,
  MessageSquare,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { Draggable } from "@hello-pangea/dnd";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";

export interface PipelineClient {
  id: string;
  name: string;
  phone: string;
  budget: number;
  property: string;
  agentName: string;
  agentAvatar: string;
  daysInStage: number;
  lastInteraction: Date;
  overdueTasks: number;
  stage: string;
}

function formatBudgetDA(budget: number): string {
  if (budget >= 1_000_000) {
    return `${(budget / 1_000_000).toFixed(1)}M DA`;
  }
  if (budget >= 1_000) {
    return `${(budget / 1_000).toFixed(0)}k DA`;
  }
  return `${budget.toLocaleString("fr-DZ")} DA`;
}

export function KanbanCard({
  client,
  index,
}: {
  client: PipelineClient;
  index: number;
}) {
  const router = useRouter();

  return (
    <Draggable draggableId={client.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          onClick={() => router.push(`/clients/${client.id}`)}
          className={cn(
            "p-3.5 rounded-xl border bg-white dark:bg-neutral-900 cursor-pointer",
            "transition-all duration-200 group",
            "hover:shadow-md hover:border-primary/30 hover:-translate-y-0.5",
            snapshot.isDragging &&
              "shadow-xl rotate-[2deg] border-primary/50 ring-2 ring-primary/20",
          )}
        >
          {/* Header: Name + Days Badge */}
          <div className="flex items-start justify-between gap-2 mb-2.5">
            <h4 className="font-bold text-sm text-foreground truncate group-hover:text-primary transition-colors">
              {client.name}
            </h4>
            <Badge
              variant="outline"
              className={cn(
                "text-[10px] font-black shrink-0 tabular-nums",
                client.daysInStage > 7
                  ? "border-orange-300 text-orange-600 bg-orange-50 dark:bg-orange-900/20"
                  : "border-neutral-200 text-muted-foreground",
              )}
            >
              {client.daysInStage}j
            </Badge>
          </div>

          {/* Phone */}
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1.5">
            <Phone className="h-3 w-3 shrink-0" />
            <span className="font-mono">{client.phone}</span>
          </div>

          {/* Budget */}
          <div className="text-xs font-extrabold text-primary mb-2">
            {formatBudgetDA(client.budget)}
          </div>

          {/* Property */}
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-3">
            <Home className="h-3 w-3 shrink-0 text-indigo-400" />
            <span className="truncate">{client.property}</span>
          </div>

          {/* Footer: Agent + Last Interaction + Overdue */}
          <div className="flex items-center justify-between pt-2.5 border-t border-dashed border-neutral-100 dark:border-neutral-800">
            <div className="flex items-center gap-2">
              <Avatar className="h-6 w-6 border border-neutral-200">
                <AvatarImage src={client.agentAvatar} />
                <AvatarFallback className="text-[9px] font-bold">
                  {client.agentName
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </AvatarFallback>
              </Avatar>
              <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                <MessageSquare className="h-3 w-3" />
                <span>
                  {formatDistanceToNow(new Date(client.lastInteraction), {
                    addSuffix: true,
                    locale: fr,
                  })}
                </span>
              </div>
            </div>

            {client.overdueTasks > 0 && (
              <Badge
                variant="destructive"
                className="text-[9px] font-black h-5 px-1.5 gap-0.5 animate-pulse"
              >
                <AlertTriangle className="h-2.5 w-2.5" />
                {client.overdueTasks}
              </Badge>
            )}
          </div>
        </div>
      )}
    </Draggable>
  );
}
