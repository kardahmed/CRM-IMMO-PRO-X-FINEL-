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
    <div className="space-y-4">
      {/* Back + Actions */}
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.back()}
          className="gap-1.5 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour
        </Button>
      </div>

      {/* Main Header Card */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 p-6 rounded-2xl border bg-card shadow-sm">
        {/* Left: Avatar + Info */}
        <div className="flex flex-col sm:flex-row items-start gap-5 flex-1 min-w-0 w-full md:w-auto">
          <Avatar className="h-16 w-16 border-2 border-primary/20 shadow-md shrink-0 mt-1 sm:mt-0">
            <AvatarFallback className="text-lg font-black bg-primary/10 text-primary">
              {initials}
            </AvatarFallback>
          </Avatar>

          <div className="min-w-0 space-y-2 w-full">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
              <h1 className="text-2xl font-black tracking-tight truncate">{fullName}</h1>
              <Badge
                variant="outline"
                className={cn(
                  "text-[10px] font-black uppercase w-fit",
                  STAGE_COLORS[client.pipelineStage] || "bg-gray-100"
                )}
              >
                {STAGE_LABELS[client.pipelineStage] || client.pipelineStage}
              </Badge>
            </div>

            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted-foreground w-full">
              <span className="flex items-center gap-1.5 font-mono whitespace-nowrap">
                <Phone className="h-3.5 w-3.5 shrink-0" />
                {client.phone}
              </span>
              <span className="flex items-center gap-1.5 whitespace-nowrap">
                <Mail className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate max-w-[200px] sm:max-w-none">{client.email}</span>
              </span>
              <span className="flex items-center gap-1.5 whitespace-nowrap">
                <User className="h-3.5 w-3.5 shrink-0" />
                {agentName}
              </span>
              <span className="flex items-center gap-1.5 text-xs whitespace-nowrap">
                <Calendar className="h-3.5 w-3.5 shrink-0" />
                Créé{" "}
                {formatDistanceToNow(new Date(client.createdAt), {
                  addSuffix: true,
                  locale: fr,
                })}
              </span>
              {client.source && (
                <Badge variant="outline" className="text-[10px] font-semibold whitespace-nowrap">
                  Source : {client.source}
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* Right: Quick Actions */}
        <div className="flex flex-wrap items-center gap-2 shrink-0 w-full md:w-auto justify-start md:justify-end">
          <Button
            size="sm"
            className="gap-1.5 bg-green-600 hover:bg-green-700 text-white font-bold shadow-sm"
          >
            <Phone className="h-3.5 w-3.5" />
            Appeler
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="gap-1.5 border-green-300 text-green-700 hover:bg-green-50 font-bold"
          >
            <MessageCircle className="h-3.5 w-3.5" />
            WhatsApp
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="gap-1.5 font-bold"
          >
            <MessageSquare className="h-3.5 w-3.5" />
            SMS
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="gap-1.5 font-bold"
          >
            <Mail className="h-3.5 w-3.5" />
            Email
          </Button>
        </div>
      </div>
    </div>
  );
}
