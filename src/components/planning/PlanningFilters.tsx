"use client";

import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Search, Plus, CalendarDays, CalendarRange, Calendar } from "lucide-react";

export type ViewMode = "day" | "week" | "month";

interface PlanningFiltersProps {
  view: ViewMode;
  onViewChange: (v: ViewMode) => void;
  agent: string;
  onAgentChange: (v: string) => void;
  status: string;
  onStatusChange: (v: string) => void;
  onCreateVisit: () => void;
}

const AGENTS = [
  { id: "all", label: "Tous les agents" },
  { id: "sophie", label: "Sophie Martin" },
  { id: "lucas", label: "Lucas Bernard" },
  { id: "emma", label: "Emma Petit" },
];

const STATUSES = [
  { id: "all", label: "Tous les statuts" },
  { id: "SCHEDULED", label: "Programmee" },
  { id: "COMPLETED", label: "Terminee" },
  { id: "CANCELLED", label: "Annulee" },
  { id: "NO_SHOW", label: "Absent" },
];

export function PlanningFilters({
  view,
  onViewChange,
  agent,
  onAgentChange,
  status,
  onStatusChange,
  onCreateVisit,
}: PlanningFiltersProps) {
  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
      {/* View Toggle */}
      <div className="flex items-center gap-1 p-1 rounded-lg bg-accent/30 border">
        <Button
          size="sm"
          variant={view === "day" ? "default" : "ghost"}
          onClick={() => onViewChange("day")}
          className="gap-1.5 text-xs font-bold"
        >
          <CalendarDays className="h-3.5 w-3.5" />
          Jour
        </Button>
        <Button
          size="sm"
          variant={view === "week" ? "default" : "ghost"}
          onClick={() => onViewChange("week")}
          className="gap-1.5 text-xs font-bold"
        >
          <CalendarRange className="h-3.5 w-3.5" />
          Semaine
        </Button>
        <Button
          size="sm"
          variant={view === "month" ? "default" : "ghost"}
          onClick={() => onViewChange("month")}
          className="gap-1.5 text-xs font-bold"
        >
          <Calendar className="h-3.5 w-3.5" />
          Mois
        </Button>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <Select value={agent} onValueChange={(v: string | null) => onAgentChange(v ?? "all")}>
          <SelectTrigger className="w-[170px] bg-white dark:bg-neutral-900 text-sm">
            <SelectValue placeholder="Agent" />
          </SelectTrigger>
          <SelectContent>
            {AGENTS.map((a) => (
              <SelectItem key={a.id} value={a.id}>{a.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={status} onValueChange={(v: string | null) => onStatusChange(v ?? "all")}>
          <SelectTrigger className="w-[170px] bg-white dark:bg-neutral-900 text-sm">
            <SelectValue placeholder="Statut" />
          </SelectTrigger>
          <SelectContent>
            {STATUSES.map((s) => (
              <SelectItem key={s.id} value={s.id}>{s.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button onClick={onCreateVisit} size="sm" className="gap-1.5 font-bold">
          <Plus className="h-3.5 w-3.5" />
          Nouvelle visite
        </Button>
      </div>
    </div>
  );
}
