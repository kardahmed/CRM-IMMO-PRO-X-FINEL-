"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Phone,
  MessageCircle,
  Mail,
  MessageSquare,
  Calendar,
  User,
  ArrowLeft,
  Copy,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";

const STAGE_COLORS: Record<string, string> = {
  ACCUEIL: "bg-blue-100 text-blue-700 border-blue-200",
  VISITE_A_GERER: "bg-purple-100 text-purple-700 border-purple-200",
  VISITE_CONFIRMEE: "bg-indigo-100 text-indigo-700 border-indigo-200",
  VISITE_TERMINEE: "bg-cyan-100 text-cyan-700 border-cyan-200",
  NEGOCIATION: "bg-orange-100 text-orange-700 border-orange-200",
  RESERVATION: "bg-amber-100 text-amber-700 border-amber-200",
  VENTE: "bg-green-100 text-green-700 border-green-200",
  RELANCEMENT: "bg-gray-100 text-gray-700 border-gray-200",
  PERDUE: "bg-red-100 text-red-700 border-red-200",
};

const STAGE_LABELS: Record<string, string> = {
  ACCUEIL: "Accueil",
  VISITE_A_GERER: "Visite à gérer",
  VISITE_CONFIRMEE: "Visite confirmée",
  VISITE_TERMINEE: "Visite terminée",
  NEGOCIATION: "Négociation",
  RESERVATION: "Réservation",
  VENTE: "Vente",
  RELANCEMENT: "Relancement",
  PERDUE: "Perdue",
};

interface ClientHeaderProps {
  client: {
    id: string;
    firstName: string;
    lastName: string;
    phone: string;
    email: string;
    pipelineStage: string;
    source: string;
    createdAt: string;
    assignedAgent?: {
      id: string;
      firstName: string;
      lastName: string;
      email: string;
    };
  };
}

export function ClientHeader({ client }: ClientHeaderProps) {
  const router = useRouter();
  const fullName = `${client.firstName} ${client.lastName}`;
  const initials = `${client.firstName?.[0] || ""}${client.lastName?.[0] || ""}`;
  const agentName = client.assignedAgent
    ? `${client.assignedAgent.firstName} ${client.assignedAgent.lastName}`
    : "Non assigné";

  return (
    <div className="flex flex-col md:flex-row items-center justify-between gap-4 p-4 rounded-xl border bg-white dark:bg-card shadow-sm">
      {/* Left: Avatar + Info */}
      <div className="flex items-center gap-4 flex-1 min-w-0">
        <Avatar className="h-12 w-12 border-2 border-primary/10 shadow-sm shrink-0">
          <AvatarFallback className="text-sm font-black bg-primary/10 text-primary">
            {initials}
          </AvatarFallback>
        </Avatar>

        <div className="min-w-0 space-y-1">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-black tracking-tight truncate">{fullName}</h1>
            <Badge
              variant="outline"
              className={cn(
                "text-[10px] font-black uppercase shrink-0",
                STAGE_COLORS[client.pipelineStage] || "bg-gray-100"
              )}
            >
              {STAGE_LABELS[client.pipelineStage] || client.pipelineStage}
            </Badge>
          </div>

          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <User className="h-3.5 w-3.5" />
            <span>Agent : <span className="font-bold">{agentName}</span></span>
            <span className="text-neutral-300 mx-1">•</span>
            {client.source && (
              <span className="font-medium text-[10px] uppercase bg-neutral-100 dark:bg-neutral-800 px-1.5 py-0.5 rounded">
                {client.source}
              </span>
            )}
            <span className="text-neutral-300 mx-1">•</span>
            <span>
              Créé {formatDistanceToNow(new Date(client.createdAt), { addSuffix: true, locale: fr })}
            </span>
          </div>
        </div>
      </div>

      {/* Right: Edit Profile */}
      <div className="flex items-center shrink-0">
        <Button variant="outline" size="sm" className="gap-2 font-bold hover:bg-accent/50 text-xs h-8">
          <User className="h-3.5 w-3.5" />
          Modifier la fiche
        </Button>
      </div>
    </div>
  );
}
