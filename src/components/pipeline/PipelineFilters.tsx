"use client";

import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Search, 
  SlidersHorizontal, 
  Filter, 
  LayoutGrid, 
  Wallet, 
  Users,
  Target
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface FilterOption {
  id: string;
  label: string;
}

interface PipelineFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  agent: string;
  onAgentChange: (value: string) => void;
  project: string;
  onProjectChange: (value: string) => void;
  source: string;
  onSourceChange: (value: string) => void;
  minBudget: string;
  onMinBudgetChange: (value: string) => void;
  activeFiltersCount: number;
  onReset: () => void;
  agents: FilterOption[];
  projects: FilterOption[];
}

const SOURCES = [
  { id: "all", label: "Toutes les sources" },
  { id: "FACEBOOK", label: "Facebook" },
  { id: "WEBSITE", label: "Site Web" },
  { id: "REFERRAL", label: "Parrainage" },
  { id: "PHONE", label: "Téléphone" },
  { id: "WALK_IN", label: "Passage agence" },
  { id: "OTHER", label: "Autre" },
];

export function PipelineFilters({
  search,
  onSearchChange,
  agent,
  onAgentChange,
  project,
  onProjectChange,
  source,
  onSourceChange,
  minBudget,
  onMinBudgetChange,
  activeFiltersCount,
  onReset,
  agents,
  projects,
}: PipelineFiltersProps) {
  return (
    <div className="flex flex-col gap-4 w-full bg-white dark:bg-neutral-900 p-4 rounded-2xl border-2 border-border shadow-sm">
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
        {/* Search & Main Filters */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3 flex-1">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60" />
            <Input
              placeholder="Rechercher nom, téléphone..."
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-10 h-11 bg-accent/50 border-none ring-1 ring-neutral-200 dark:ring-neutral-700 focus:ring-2 focus:ring-primary rounded-xl transition-all"
            />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
            <Select value={agent} onValueChange={(v) => onAgentChange(v ?? "all")}>
              <SelectTrigger className="w-[140px] md:w-[160px] h-10 bg-white dark:bg-neutral-900 border-none ring-1 ring-neutral-200 dark:ring-neutral-700 rounded-xl">
                <Users className="h-3.5 w-3.5 mr-2 text-muted-foreground" />
                <SelectValue placeholder="Agent" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les agents</SelectItem>
                {agents.map((a) => (
                  <SelectItem key={a.id} value={a.id}>
                    {a.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={project} onValueChange={(v) => onProjectChange(v ?? "all")}>
              <SelectTrigger className="w-[140px] md:w-[160px] h-10 bg-white dark:bg-neutral-900 border-none ring-1 ring-neutral-200 dark:ring-neutral-700 rounded-xl">
                <LayoutGrid className="h-3.5 w-3.5 mr-2 text-muted-foreground" />
                <SelectValue placeholder="Projet" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les projets</SelectItem>
                {projects.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 shrink-0 border-t lg:border-t-0 pt-3 lg:pt-0">
          <div className="flex items-center gap-2 flex-1 lg:flex-none justify-end">
            {activeFiltersCount > 0 && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={onReset}
                className="text-xs font-black uppercase tracking-widest text-muted-foreground hover:text-red-500"
              >
                Réinitialiser
              </Button>
            )}
            <Badge variant="secondary" className="h-10 px-4 rounded-xl gap-2 bg-accent text-xs font-black uppercase tracking-widest border-none">
              <Filter className="h-3.5 w-3.5" />
              {activeFiltersCount} Filtres actifs
            </Badge>
          </div>
        </div>
      </div>

      {/* Secondary Filters Row */}
      <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-border">
        <Select value={source} onValueChange={(v) => onSourceChange(v ?? "all")}>
          <SelectTrigger className="w-[160px] h-9 bg-transparent border-none ring-1 ring-neutral-100 dark:ring-neutral-800 rounded-lg text-xs font-bold">
            <Target className="h-3 w-3 mr-2 text-primary/60" />
            <SelectValue placeholder="Source" />
          </SelectTrigger>
          <SelectContent>
            {SOURCES.map((s) => (
              <SelectItem key={s.id} value={s.id} className="text-xs">
                {s.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="relative w-[180px]">
          <Wallet className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-primary/60" />
          <Input
            type="number"
            placeholder="Budget min (DA)..."
            value={minBudget}
            onChange={(e) => onMinBudgetChange(e.target.value)}
            className="pl-9 h-9 bg-transparent border-none ring-1 ring-neutral-100 dark:ring-neutral-800 rounded-lg text-xs font-bold focus:ring-1"
          />
        </div>
      </div>
    </div>
  );
}
