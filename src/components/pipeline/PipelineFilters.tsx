"use client";

import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, SlidersHorizontal } from "lucide-react";

interface PipelineFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  agent: string;
  onAgentChange: (value: string) => void;
  project: string;
  onProjectChange: (value: string) => void;
}

const MOCK_AGENTS = [
  { id: "all", label: "Tous les agents" },
  { id: "sophie", label: "Sophie Martin" },
  { id: "lucas", label: "Lucas Bernard" },
  { id: "emma", label: "Emma Petit" },
];

const MOCK_PROJECTS = [
  { id: "all", label: "Tous les projets" },
  { id: "riviera", label: "Résidence Riviera" },
  { id: "palmiers", label: "Les Palmiers" },
  { id: "horizon", label: "Horizon Bay" },
];

export function PipelineFilters({
  search,
  onSearchChange,
  agent,
  onAgentChange,
  project,
  onProjectChange,
}: PipelineFiltersProps) {
  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
      {/* Search */}
      <div className="relative flex-1 max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Rechercher nom ou téléphone..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9 bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800"
        />
      </div>

      <div className="flex items-center gap-2">
        <SlidersHorizontal className="h-4 w-4 text-muted-foreground shrink-0 hidden sm:block" />

        {/* Agent Filter */}
        <Select value={agent} onValueChange={onAgentChange}>
          <SelectTrigger className="w-[180px] bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800">
            <SelectValue placeholder="Agent" />
          </SelectTrigger>
          <SelectContent>
            {MOCK_AGENTS.map((a) => (
              <SelectItem key={a.id} value={a.id}>
                {a.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Project Filter */}
        <Select value={project} onValueChange={onProjectChange}>
          <SelectTrigger className="w-[180px] bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800">
            <SelectValue placeholder="Projet" />
          </SelectTrigger>
          <SelectContent>
            {MOCK_PROJECTS.map((p) => (
              <SelectItem key={p.id} value={p.id}>
                {p.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
