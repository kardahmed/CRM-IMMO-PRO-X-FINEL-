"use client";

import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Clock, User, Home, MapPin } from "lucide-react";
import type { PlanningVisit } from "./types";
import { STATUS_COLORS, STATUS_LABELS } from "./types";

const HOURS = Array.from({ length: 12 }, (_, i) => i + 8); // 08:00 - 19:00

interface DayViewProps {
  visits: PlanningVisit[];
  date: Date;
  onVisitClick: (visit: PlanningVisit) => void;
}

export function DayView({ visits, date, onVisitClick }: DayViewProps) {
  return (
    <div className="rounded-xl border bg-card overflow-hidden">
      {/* Day Header */}
      <div className="px-6 py-3 bg-accent/30 border-b">
        <h3 className="text-sm font-black uppercase tracking-tight">
          {format(date, "EEEE dd MMMM yyyy", { locale: fr })}
        </h3>
      </div>

      {/* Timeline */}
      <div className="relative">
        {HOURS.map((hour) => {
          const hourVisits = visits.filter((v) => {
            const h = new Date(v.scheduledAt).getHours();
            return h === hour;
          });

          return (
            <div key={hour} className="flex border-b last:border-b-0 min-h-[72px]">
              {/* Time Label */}
              <div className="w-20 shrink-0 flex items-start justify-end pr-4 pt-2 border-r">
                <span className="text-xs font-mono font-bold text-muted-foreground">
                  {String(hour).padStart(2, "0")}:00
                </span>
              </div>

              {/* Slots */}
              <div className="flex-1 p-2 flex flex-wrap gap-2">
                {hourVisits.map((visit) => {
                  const sc = STATUS_COLORS[visit.status] || STATUS_COLORS.PLANNED;
                  return (
                    <div
                      key={visit.id}
                      onClick={() => onVisitClick(visit)}
                      className={cn(
                        "flex-1 min-w-[200px] max-w-md p-3 rounded-lg border cursor-pointer transition-all hover:shadow-md hover:-translate-y-0.5 group",
                        sc.bg,
                        sc.border
                      )}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <div className={cn("h-2 w-2 rounded-full shrink-0", sc.dot)} />
                        <span className={cn("text-xs font-black uppercase", sc.text)}>
                          {format(new Date(visit.scheduledAt), "HH:mm")} — {STATUS_LABELS[visit.status]}
                        </span>
                      </div>
                      <p className="text-sm font-bold truncate group-hover:text-primary transition-colors">
                        <User className="h-3 w-3 inline mr-1" />
                        {visit.clientName}
                      </p>
                      <p className="text-xs text-muted-foreground truncate mt-0.5">
                        <Home className="h-3 w-3 inline mr-1" />
                        {visit.propertyName}
                      </p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        <MapPin className="h-3 w-3 inline mr-1" />
                        {visit.agentName}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
