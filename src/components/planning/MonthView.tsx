"use client";

import { cn } from "@/lib/utils";
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  isSameMonth,
  isSameDay,
  isToday,
} from "date-fns";
import { fr } from "date-fns/locale";
import type { PlanningVisit } from "./types";
import { STATUS_COLORS } from "./types";

interface MonthViewProps {
  visits: PlanningVisit[];
  date: Date;
  onVisitClick: (visit: PlanningVisit) => void;
}

export function MonthView({ visits, date, onVisitClick }: MonthViewProps) {
  const monthStart = startOfMonth(date);
  const monthEnd = endOfMonth(date);
  const calStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });

  // Build weeks
  const weeks: Date[][] = [];
  let cursor = calStart;
  while (cursor <= calEnd) {
    const week: Date[] = [];
    for (let i = 0; i < 7; i++) {
      week.push(cursor);
      cursor = addDays(cursor, 1);
    }
    weeks.push(week);
  }

  const dayNames = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

  return (
    <div className="rounded-xl border bg-card overflow-hidden">
      {/* Month Header */}
      <div className="px-6 py-3 bg-accent/30 border-b">
        <h3 className="text-sm font-black uppercase tracking-tight">
          {format(date, "MMMM yyyy", { locale: fr })}
        </h3>
      </div>

      {/* Day Names */}
      <div className="grid grid-cols-7 border-b">
        {dayNames.map((d) => (
          <div key={d} className="text-center py-2 text-xs font-black uppercase text-muted-foreground border-r last:border-r-0">
            {d}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      {weeks.map((week, wi) => (
        <div key={wi} className="grid grid-cols-7 border-b last:border-b-0">
          {week.map((day, di) => {
            const dayVisits = visits.filter((v) => isSameDay(new Date(v.scheduledAt), day));
            const inMonth = isSameMonth(day, date);
            const today = isToday(day);

            return (
              <div
                key={di}
                className={cn(
                  "min-h-[90px] border-r last:border-r-0 p-1.5",
                  !inMonth && "bg-accent/20 opacity-40",
                  today && "bg-primary/5"
                )}
              >
                <div className="flex items-center justify-between mb-1">
                  <span
                    className={cn(
                      "text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full",
                      today && "bg-primary text-white"
                    )}
                  >
                    {format(day, "d")}
                  </span>
                  {dayVisits.length > 0 && (
                    <span className="text-xs font-black text-muted-foreground">
                      {dayVisits.length}
                    </span>
                  )}
                </div>

                <div className="space-y-0.5">
                  {dayVisits.slice(0, 3).map((visit) => {
                    const sc = STATUS_COLORS[visit.status] || STATUS_COLORS.PLANNED;
                    return (
                      <div
                        key={visit.id}
                        onClick={() => onVisitClick(visit)}
                        className={cn(
                          "px-1.5 py-0.5 rounded text-xs cursor-pointer truncate font-bold transition-all hover:shadow-sm",
                          sc.bg,
                          sc.text,
                          sc.border,
                          "border"
                        )}
                      >
                        {format(new Date(visit.scheduledAt), "HH:mm")} {visit.clientName}
                      </div>
                    );
                  })}
                  {dayVisits.length > 3 && (
                    <p className="text-xs text-muted-foreground font-bold text-center">
                      +{dayVisits.length - 3} autres
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}
