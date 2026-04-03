"use client";

import { cn } from "@/lib/utils";
import {
  format,
  startOfWeek,
  addDays,
  isSameDay,
} from "date-fns";
import { fr } from "date-fns/locale";
import { User, Home } from "lucide-react";
import type { PlanningVisit } from "./types";
import { STATUS_COLORS, STATUS_LABELS } from "./types";

const HOURS = Array.from({ length: 12 }, (_, i) => i + 8);

interface WeekViewProps {
  visits: PlanningVisit[];
  date: Date;
  onVisitClick: (visit: PlanningVisit) => void;
}

export function WeekView({ visits, date, onVisitClick }: WeekViewProps) {
  const weekStart = startOfWeek(date, { weekStartsOn: 1 });
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const today = new Date();

  return (
    <div className="rounded-xl border bg-card overflow-hidden">
      {/* Week Header Row */}
      <div className="grid grid-cols-[80px_repeat(7,1fr)] border-b sticky top-0 bg-card z-10">
        <div className="border-r" />
        {days.map((day, i) => (
          <div
            key={i}
            className={cn(
              "text-center py-3 border-r last:border-r-0",
              isSameDay(day, today) && "bg-primary/5"
            )}
          >
            <p className="text-[10px] font-bold uppercase text-muted-foreground">
              {format(day, "EEE", { locale: fr })}
            </p>
            <p
              className={cn(
                "text-lg font-black",
                isSameDay(day, today) && "text-primary"
              )}
            >
              {format(day, "dd")}
            </p>
          </div>
        ))}
      </div>

      {/* Grid Body */}
      <div className="overflow-y-auto max-h-[calc(100vh-300px)]">
        {HOURS.map((hour) => (
          <div key={hour} className="grid grid-cols-[80px_repeat(7,1fr)] border-b last:border-b-0 min-h-[60px]">
            {/* Time Label */}
            <div className="flex items-start justify-end pr-3 pt-1.5 border-r">
              <span className="text-[10px] font-mono font-bold text-muted-foreground">
                {String(hour).padStart(2, "0")}:00
              </span>
            </div>

            {/* Day Cells */}
            {days.map((day, di) => {
              const cellVisits = visits.filter((v) => {
                const d = new Date(v.scheduledAt);
                return isSameDay(d, day) && d.getHours() === hour;
              });

              return (
                <div
                  key={di}
                  className={cn(
                    "border-r last:border-r-0 p-0.5",
                    isSameDay(day, today) && "bg-primary/[0.02]"
                  )}
                >
                  {cellVisits.map((visit) => {
                    const sc = STATUS_COLORS[visit.status] || STATUS_COLORS.PLANNED;
                    return (
                      <div
                        key={visit.id}
                        onClick={() => onVisitClick(visit)}
                        className={cn(
                          "p-1.5 rounded-md border text-[10px] cursor-pointer transition-all hover:shadow-sm mb-0.5",
                          sc.bg,
                          sc.border
                        )}
                      >
                        <div className="flex items-center gap-1">
                          <div className={cn("h-1.5 w-1.5 rounded-full shrink-0", sc.dot)} />
                          <span className={cn("font-black truncate", sc.text)}>
                            {format(new Date(visit.scheduledAt), "HH:mm")}
                          </span>
                        </div>
                        <p className="font-bold truncate mt-0.5">{visit.clientName}</p>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
