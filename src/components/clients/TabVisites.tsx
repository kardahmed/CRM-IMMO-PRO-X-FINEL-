"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  MapPin,
  CheckCircle2,
  XCircle,
  Clock,
  Eye,
  Plus,
  MessageSquare,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import { fr } from "date-fns/locale";

interface Visit {
  id: string;
  scheduledAt: string;
  status: string;
  feedback?: string;
  property?: { id: string; name: string };
}

const STATUS_MAP: Record<string, { label: string; color: string; icon: LucideIcon }> = {
  PLANNED: { label: "Planifiée", color: "bg-blue-100 text-blue-700", icon: Clock },
  CONFIRMED: { label: "Confirmée", color: "bg-indigo-100 text-indigo-700", icon: CheckCircle2 },
  DONE: { label: "Terminée", color: "bg-green-100 text-green-700", icon: CheckCircle2 },
  CANCELLED: { label: "Annulée", color: "bg-red-100 text-red-700", icon: XCircle },
  NO_SHOW: { label: "Absent", color: "bg-orange-100 text-orange-700", icon: XCircle },
};

export function TabVisites({ visits }: { visits: Visit[] }) {
  return (
    <Card className="border-neutral-100 dark:border-neutral-800">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2 text-base font-black">
          <Eye className="h-4 w-4 text-primary" />
          Visites ({visits.length})
        </CardTitle>
        <Button size="sm" className="gap-1.5 font-bold">
          <Plus className="h-3.5 w-3.5" />
          Planifier une visite
        </Button>
      </CardHeader>
      <CardContent>
        {visits.length === 0 ? (
          <p className="text-sm text-muted-foreground italic text-center py-8">
            Aucune visite enregistrée
          </p>
        ) : (
          <div className="relative">
            {/* Timeline Line */}
            <div className="absolute left-[19px] top-0 bottom-0 w-px bg-neutral-200 dark:bg-neutral-800" />

            <div className="space-y-6">
              {visits.map((visit) => {
                const status = STATUS_MAP[visit.status] || STATUS_MAP.PLANNED;
                const StatusIcon = status.icon;
                return (
                  <div key={visit.id} className="relative flex gap-4 pl-1">
                    {/* Timeline Dot */}
                    <div
                      className={cn(
                        "relative z-10 flex items-center justify-center h-10 w-10 rounded-full border-2 bg-background shrink-0",
                        visit.status === "DONE"
                          ? "border-green-400"
                          : visit.status === "CANCELLED" || visit.status === "NO_SHOW"
                            ? "border-red-400"
                            : "border-blue-400"
                      )}
                    >
                      <StatusIcon className="h-4 w-4" />
                    </div>

                    {/* Content */}
                    <div className="flex-1 pb-2">
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className="text-sm font-bold">
                          {format(new Date(visit.scheduledAt), "dd MMM yyyy 'à' HH:mm", { locale: fr })}
                        </span>
                        <Badge
                          variant="outline"
                          className={cn("text-xs font-black uppercase", status.color)}
                        >
                          {status.label}
                        </Badge>
                      </div>

                      {visit.property && (
                        <div className="flex items-center gap-1.5 text-sm text-muted-foreground mt-1">
                          <MapPin className="h-3.5 w-3.5 text-indigo-400" />
                          {visit.property.name}
                        </div>
                      )}

                      {visit.feedback && (
                        <div className="mt-2 p-3 rounded-lg bg-accent/20 border border-accent/30 text-sm">
                          <div className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground mb-1">
                            <MessageSquare className="h-3 w-3" />
                            Feedback
                          </div>
                          {visit.feedback}
                        </div>
                      )}

                      <span className="text-xs text-muted-foreground mt-1 block">
                        {formatDistanceToNow(new Date(visit.scheduledAt), {
                          addSuffix: true,
                          locale: fr,
                        })}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
