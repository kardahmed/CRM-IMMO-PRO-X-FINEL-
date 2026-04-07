"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  Phone,
  Home,
  MessageSquare,
  MoreVertical,
  PhoneCall,
  ExternalLink,
  Zap,
  Globe,
  UserPlus,
  Share2,
  Flame,
  Thermometer,
  Snowflake,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { Draggable } from "@hello-pangea/dnd";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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
  source?: string;
  // Smart Matching
  matchScore?: number; // 0-100
  matchedPropertyName?: string;
  selectedPropertyId?: string;
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

/** Temperature indicator based on stage progression */
function getTemperature(stage: string): { icon: React.ComponentType<{ className?: string }>; label: string; color: string; bg: string } {
  const hotStages = ["NEGOTIATION", "RESERVED", "SIGNED"];
  const warmStages = ["VISIT_SCHEDULED", "VISITED"];
  const coldStages = ["NEW", "CONTACTED", "QUALIFIED"];

  if (hotStages.includes(stage)) {
    return { icon: Flame, label: "Chaud", color: "text-rose-500", bg: "bg-rose-500/10 border-rose-500/20" };
  }
  if (warmStages.includes(stage)) {
    return { icon: Thermometer, label: "Tiede", color: "text-amber-500", bg: "bg-amber-500/10 border-amber-500/20" };
  }
  return { icon: Snowflake, label: "Froid", color: "text-blue-400", bg: "bg-blue-500/10 border-blue-500/20" };
}

export function KanbanCard({
  client,
  index,
}: {
  client: PipelineClient;
  index: number;
}) {
  const router = useRouter();
  const temp = getTemperature(client.stage);
  const TempIcon = temp.icon;

  const handleCall = (e: React.MouseEvent) => {
    e.stopPropagation();
    window.location.href = `tel:${client.phone}`;
  };

  const handleWhatsApp = (e: React.MouseEvent) => {
    e.stopPropagation();
    const cleanPhone = client.phone.replace(/\D/g, "");
    window.open(`https://wa.me/${cleanPhone}`, "_blank");
  };

  const getSourceIcon = (source?: string) => {
    switch (source) {
      case "FACEBOOK": return <Share2 className="h-3 w-3 text-blue-500" />;
      case "WEBSITE": return <Globe className="h-3 w-3 text-emerald-500" />;
      case "REFERRAL": return <UserPlus className="h-3 w-3 text-purple-500" />;
      default: return <Globe className="h-3 w-3 text-muted-foreground" />;
    }
  };

  return (
    <Draggable draggableId={client.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          onClick={() => router.push(`/clients/${client.id}`)}
          className={cn(
            "p-4 rounded-2xl border-2 bg-card cursor-pointer shadow-sm relative",
            "transition-all duration-300 group ring-offset-background",
            "hover:shadow-stripe-lg hover:border-primary/40 hover:-translate-y-1.5 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
            snapshot.isDragging ?
              "shadow-2xl rotate-[3deg] border-primary ring-4 ring-primary/10 z-50 brightness-105" :
              "border-transparent"
          )}
        >
          {/* Top Indicators */}
          <div className="absolute -top-2 -left-2 flex items-center gap-1.5 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
            {client.overdueTasks > 0 && (
              <div className="bg-rose-500 text-white text-[9px] font-black h-5 w-5 flex items-center justify-center rounded-full animate-bounce shadow-lg">
                !
              </div>
            )}
          </div>

          {/* Temperature Badge */}
          <div className="absolute -top-2 -right-2 z-10">
            <div className={cn("flex items-center gap-1 px-2 py-0.5 rounded-full border text-[9px] font-black uppercase", temp.bg, temp.color)}>
              <TempIcon className="h-3 w-3" />
              {temp.label}
            </div>
          </div>

          {/* Header: Name + Actions */}
          <div className="flex items-start justify-between gap-2 mb-3 mt-1">
            <div className="flex flex-col min-w-0">
              <h4 className="font-bold text-sm text-foreground truncate group-hover:text-primary transition-colors pr-2">
                {client.name}
              </h4>
              <div className="flex items-center gap-1.5 mt-0.5">
                {getSourceIcon(client.source)}
                <span className="text-[10px] font-black text-muted-foreground uppercase opacity-70">
                  ID: {client.id.slice(0, 4)}
                </span>
              </div>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger onClick={(e) => e.stopPropagation()}>
                <div className="p-1 px-2 hover:bg-accent rounded-md opacity-0 group-hover:opacity-100 transition-opacity">
                  <MoreVertical className="h-4 w-4 text-muted-foreground" />
                </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleCall}>
                  <PhoneCall className="mr-2 h-4 w-4" /> Appeler
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleWhatsApp}>
                  <Zap className="mr-2 h-4 w-4" /> WhatsApp
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push(`/clients/${client.id}`)}>
                  <ExternalLink className="mr-2 h-4 w-4" /> Voir profil
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Budget Display - Prominent */}
          <div className="bg-primary/5 dark:bg-primary/10 rounded-xl p-2.5 mb-4 border border-primary/10">
            <div className="text-[10px] font-black text-primary uppercase tracking-[0.15em] mb-0.5 opacity-70">Budget estime</div>
            <div className="text-sm font-black text-primary tabular-nums">
              {formatBudgetDA(client.budget)}
            </div>
          </div>

          {/* Smart Match Badge */}
          {client.matchScore != null && client.matchScore > 0 && (
            <div className={cn(
              "flex items-center gap-2 p-2 rounded-xl border text-xs font-bold mb-4",
              client.matchScore >= 80
                ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-600"
                : client.matchScore >= 50
                ? "bg-amber-500/10 border-amber-500/20 text-amber-600"
                : "bg-blue-500/10 border-blue-500/20 text-blue-600"
            )}>
              <Zap className="h-3.5 w-3.5" />
              <span>Match {client.matchScore}%</span>
              {client.matchedPropertyName && (
                <span className="text-[10px] text-muted-foreground truncate ml-auto">{client.matchedPropertyName}</span>
              )}
            </div>
          )}

          {/* Linked Property Badge */}
          {client.selectedPropertyId && (
            <div className="flex items-center gap-2 p-2 rounded-xl border border-primary/20 bg-primary/5 text-xs font-bold text-primary mb-4">
              <Home className="h-3.5 w-3.5" />
              <span>Bien lie</span>
            </div>
          )}

          {/* Property Info */}
          <div className="space-y-2 mb-4">
            <div className="flex items-center gap-2 text-xs text-muted-foreground/80 font-medium">
              <Home className="h-3.5 w-3.5 shrink-0 text-indigo-500/70" />
              <span className="truncate">{client.property}</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground/80 font-medium">
              <Phone className="h-3.5 w-3.5 shrink-0 text-emerald-500/70" />
              <span className="font-mono tabular-nums">{client.phone}</span>
            </div>
          </div>

          {/* Footer: Agent + Activity Status */}
          <div className="flex items-center justify-between pt-3 border-t border-border">
            <div className="flex items-center gap-2">
              <div className="relative">
                <Avatar className="h-7 w-7 border-2 border-card shadow-sm">
                  <AvatarImage src={client.agentAvatar} />
                  <AvatarFallback className="text-[10px] font-black bg-accent text-muted-foreground">
                    {client.agentName.split(" ").map(n => n[0]).join("")}
                  </AvatarFallback>
                </Avatar>
                <div className={cn(
                  "absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-card",
                  client.daysInStage > 7 ? "bg-amber-500" : "bg-emerald-500"
                )} />
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-foreground leading-none mb-0.5">{client.agentName}</span>
                <div className="flex items-center gap-1 text-[9px] text-muted-foreground font-semibold uppercase tracking-tighter">
                  <MessageSquare className="h-2.5 w-2.5" />
                  <span>
                    {formatDistanceToNow(new Date(client.lastInteraction), {
                      addSuffix: true,
                      locale: fr,
                    })}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-col items-end">
              <Badge
                variant="outline"
                className={cn(
                  "text-[9px] font-black h-5 px-1.5 tabular-nums uppercase tracking-tighter",
                  client.daysInStage > 7
                    ? "border-amber-200 dark:border-amber-800 text-amber-600 bg-amber-50 dark:bg-amber-900/20"
                    : "border-border text-muted-foreground"
                )}
              >
                {client.daysInStage} JOURS
              </Badge>
            </div>
          </div>
        </div>
      )}
    </Draggable>
  );
}
