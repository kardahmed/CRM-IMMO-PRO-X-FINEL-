"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Zap,
  XCircle,
  ChevronDown,
  ChevronRight,
  Phone,
  MessageCircle,
  FileText,
  Calendar,
  Clock,
  ArrowDown,
  Loader2,
  Save,
  Pencil,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface AutomationTask {
  name?: string;
  title?: string;
  type: string;
  delayMinutes?: number;
  isActive?: boolean;
  targetAgentId?: string | null;
  messageTemplate?: string;
  description?: string;
}

interface AutomationConfig {
  id: string;
  pipelineStage: string;
  isActive: boolean;
  tasks: AutomationTask[];
  createdAt: string;
}

interface TeamMember {
  id: string;
  firstName: string;
  lastName: string;
  role: string;
}

// ---------------------------------------------------------------------------
// Stage metadata
// ---------------------------------------------------------------------------
const STAGE_META: Record<string, { label: string; color: string; bg: string; order: number }> = {
  NEW:              { label: "Nouveau",          color: "text-blue-600",    bg: "bg-blue-50 border-blue-200",     order: 1 },
  CONTACTED:        { label: "Contacté",         color: "text-cyan-600",    bg: "bg-cyan-50 border-cyan-200",     order: 2 },
  QUALIFIED:        { label: "Qualifié",         color: "text-violet-600",  bg: "bg-violet-50 border-violet-200", order: 3 },
  VISIT_SCHEDULED:  { label: "Visite planifiée", color: "text-indigo-600",  bg: "bg-indigo-50 border-indigo-200", order: 4 },
  VISITED:          { label: "Visite effectuée", color: "text-sky-600",     bg: "bg-sky-50 border-sky-200",       order: 5 },
  NEGOTIATION:      { label: "Négociation",      color: "text-amber-600",   bg: "bg-amber-50 border-amber-200",   order: 6 },
  RESERVED:         { label: "Réservé",          color: "text-orange-600",  bg: "bg-orange-50 border-orange-200", order: 7 },
  SIGNED:           { label: "Signé",            color: "text-emerald-600", bg: "bg-emerald-50 border-emerald-200", order: 8 },
  CLOSED:           { label: "Clôturé",          color: "text-green-600",   bg: "bg-green-50 border-green-200",   order: 9 },
};

// ---------------------------------------------------------------------------
// Task type config
// ---------------------------------------------------------------------------
const TYPE_CONFIG: Record<string, { label: string; icon: typeof Phone; color: string; iconColor: string }> = {
  CALL:     { label: "Appel",        icon: Phone,          color: "bg-emerald-50 border-emerald-200", iconColor: "text-emerald-600" },
  OTHER:    { label: "WhatsApp/SMS", icon: MessageCircle,  color: "bg-green-50 border-green-200",     iconColor: "text-green-600" },
  DOCUMENT: { label: "Document",     icon: FileText,       color: "bg-blue-50 border-blue-200",       iconColor: "text-blue-600" },
  MEETING:  { label: "Rendez-vous",  icon: Calendar,       color: "bg-purple-50 border-purple-200",   iconColor: "text-purple-600" },
};

function formatDelay(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  if (minutes < 1440) return `${Math.round(minutes / 60)}h`;
  const days = Math.round(minutes / 1440);
  return `${days} jour${days > 1 ? "s" : ""}`;
}

// ---------------------------------------------------------------------------
// Flow Arrow connector
// ---------------------------------------------------------------------------
function FlowArrow({ muted = false }: { muted?: boolean }) {
  return (
    <div className="flex flex-col items-center py-1">
      <div className={cn("w-0.5 h-6", muted ? "bg-neutral-200" : "bg-primary/30")} />
      <ArrowDown className={cn("h-3.5 w-3.5 -mt-0.5", muted ? "text-neutral-300" : "text-primary/40")} />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
export default function AutomationsPage() {
  const [configs, setConfigs] = useState<AutomationConfig[]>([]);
  const [agents, setAgents] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedStages, setExpandedStages] = useState<Set<string>>(new Set());
  const [savingStages, setSavingStages] = useState<Set<string>>(new Set());
  const [editingTemplate, setEditingTemplate] = useState<string | null>(null);

  const fetchConfigs = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/v1/automations/config");
      const json = await res.json();
      if (json.success) {
        setConfigs(json.data);
      } else {
        setError(json.error ?? "Erreur lors du chargement");
      }
    } catch {
      setError("Impossible de contacter le serveur");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchAgents = useCallback(async () => {
    try {
      const res = await fetch("/api/v1/settings/team");
      const json = await res.json();
      if (json.data?.members) setAgents(json.data.members);
    } catch { /* silent */ }
  }, []);

  useEffect(() => {
    fetchConfigs();
    fetchAgents();
  }, [fetchConfigs, fetchAgents]);

  const toggleExpand = (stage: string) => {
    setExpandedStages((prev) => {
      const next = new Set(prev);
      if (next.has(stage)) next.delete(stage);
      else next.add(stage);
      return next;
    });
  };

  const handleMasterToggle = async (pipelineStage: string, isActive: boolean) => {
    setConfigs((prev) =>
      prev.map((c) => (c.pipelineStage === pipelineStage ? { ...c, isActive } : c))
    );
    try {
      const res = await fetch("/api/v1/automations/config", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pipelineStage, isActive }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      toast.success(`${STAGE_META[pipelineStage]?.label ?? pipelineStage} ${isActive ? "activé" : "désactivé"}`);
    } catch {
      setConfigs((prev) =>
        prev.map((c) => (c.pipelineStage === pipelineStage ? { ...c, isActive: !isActive } : c))
      );
      toast.error("Erreur de synchronisation");
    }
  };

  const handleTaskToggle = (pipelineStage: string, taskIndex: number, isActive: boolean) => {
    setConfigs((prev) =>
      prev.map((c) => {
        if (c.pipelineStage !== pipelineStage) return c;
        const updatedTasks = c.tasks.map((t, i) => i === taskIndex ? { ...t, isActive } : t);
        return { ...c, tasks: updatedTasks };
      })
    );
  };

  const handleTaskAgentChange = (pipelineStage: string, taskIndex: number, agentId: string | null) => {
    setConfigs((prev) =>
      prev.map((c) => {
        if (c.pipelineStage !== pipelineStage) return c;
        const updatedTasks = c.tasks.map((t, i) => i === taskIndex ? { ...t, targetAgentId: agentId } : t);
        return { ...c, tasks: updatedTasks };
      })
    );
  };

  const handleTaskTemplateChange = useCallback((pipelineStage: string, taskIndex: number, template: string) => {
    setConfigs((prev) =>
      prev.map((c) => {
        if (c.pipelineStage !== pipelineStage) return c;
        const updatedTasks = c.tasks.map((t, i) => i === taskIndex ? { ...t, messageTemplate: template || undefined } : t);
        return { ...c, tasks: updatedTasks };
      })
    );
  }, []);

  const handleSaveTasks = useCallback(async (config: AutomationConfig) => {
    setSavingStages((prev) => new Set(prev).add(config.pipelineStage));
    try {
      const res = await fetch("/api/v1/automations/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      toast.success("Flux sauvegardé");
    } catch {
      toast.error("Erreur d'enregistrement");
    } finally {
      setSavingStages((prev) => {
        const next = new Set(prev);
        next.delete(config.pipelineStage);
        return next;
      });
    }
  }, []);

  const sortedConfigs = [...configs].sort((a, b) =>
    (STAGE_META[a.pipelineStage]?.order ?? 99) - (STAGE_META[b.pipelineStage]?.order ?? 99)
  );

  return (
    <div className="pb-20 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Zap className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">Automatisations</h1>
            <p className="text-xs text-muted-foreground">
              {sortedConfigs.length} étapes · {sortedConfigs.reduce((s, c) => s + (c.tasks?.length || 0), 0)} actions
            </p>
          </div>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex flex-col items-center gap-3 py-20">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Chargement des flux...</p>
        </div>
      )}

      {/* Error */}
      {error && !loading && (
        <div className="flex flex-col items-center gap-4 py-20">
          <XCircle className="h-10 w-10 text-red-400" />
          <p className="text-sm font-medium text-red-600">{error}</p>
          <Button onClick={fetchConfigs} variant="outline" size="sm">Réessayer</Button>
        </div>
      )}

      {/* Flow */}
      {!loading && !error && (
        <div className="flex flex-col items-center">
          {sortedConfigs.map((config, stageIdx) => {
            const meta = STAGE_META[config.pipelineStage] ?? { label: config.pipelineStage, color: "text-neutral-600", bg: "bg-neutral-50 border-neutral-200", order: 99 };
            const isExpanded = expandedStages.has(config.pipelineStage);
            const isSaving = savingStages.has(config.pipelineStage);
            const tasks = config.tasks || [];
            const activeCount = tasks.filter(t => t.isActive !== false).length;

            return (
              <div key={config.id} className="flex flex-col items-center w-full">
                {/* Arrow between stages */}
                {stageIdx > 0 && <FlowArrow muted={!config.isActive} />}

                {/* ═══════ TRIGGER NODE ═══════ */}
                <div
                  className={cn(
                    "w-full max-w-xl bg-white dark:bg-card border rounded-2xl shadow-sm transition-all hover:shadow-md cursor-pointer",
                    config.isActive ? "border-primary/20" : "border-border opacity-60"
                  )}
                  onClick={() => toggleExpand(config.pipelineStage)}
                >
                  <div className="flex items-center gap-3 p-4">
                    {/* Stage icon */}
                    <div className={cn("h-9 w-9 rounded-lg flex items-center justify-center border shrink-0", meta.bg)}>
                      <Zap className={cn("h-4 w-4", meta.color)} />
                    </div>

                    {/* Stage info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className={cn("text-[10px] font-bold uppercase border px-2 py-0", meta.bg, meta.color)}>
                          {meta.label}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {activeCount}/{tasks.length} actions
                        </span>
                      </div>
                      <p className="text-sm font-semibold mt-0.5 truncate">
                        Quand un prospect entre dans cette étape
                      </p>
                    </div>

                    {/* Toggle + expand */}
                    <div className="flex items-center gap-3 shrink-0">
                      <Switch
                        checked={config.isActive}
                        onCheckedChange={(checked) => {
                          handleMasterToggle(config.pipelineStage, checked);
                        }}
                        onClick={(e) => e.stopPropagation()}
                        className="data-[state=checked]:bg-primary"
                      />
                      {isExpanded ? (
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                  </div>
                </div>

                {/* ═══════ TASK NODES ═══════ */}
                {isExpanded && (
                  <div className="flex flex-col items-center w-full">
                    {tasks.map((task, idx) => {
                      const typeConf = TYPE_CONFIG[task.type] ?? TYPE_CONFIG.CALL;
                      const Icon = typeConf.icon;
                      const taskActive = task.isActive !== false;
                      const templateKey = `${config.pipelineStage}-${idx}`;
                      const isEditingTpl = editingTemplate === templateKey;

                      return (
                        <div key={idx} className="flex flex-col items-center w-full">
                          {/* Arrow */}
                          <FlowArrow muted={!taskActive} />

                          {/* Task card */}
                          <div
                            className={cn(
                              "w-full max-w-lg bg-white dark:bg-card border rounded-xl shadow-sm transition-all",
                              taskActive ? "border-border hover:shadow-md" : "border-border/50 opacity-40"
                            )}
                          >
                            <div className="flex items-start gap-3 p-3.5">
                              {/* Type icon */}
                              <div className={cn("h-8 w-8 rounded-lg flex items-center justify-center border shrink-0 mt-0.5", typeConf.color)}>
                                <Icon className={cn("h-3.5 w-3.5", typeConf.iconColor)} />
                              </div>

                              {/* Content */}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-0.5">
                                  <Badge variant="outline" className={cn("text-[10px] font-semibold px-1.5 py-0 border", typeConf.color, typeConf.iconColor)}>
                                    {typeConf.label}
                                  </Badge>
                                  {task.delayMinutes && task.delayMinutes > 0 && (
                                    <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                                      <Clock className="h-2.5 w-2.5" />
                                      {formatDelay(task.delayMinutes)}
                                    </span>
                                  )}
                                </div>
                                <p className="text-sm font-medium leading-snug">
                                  {idx + 1}. {task.title || task.name}
                                </p>
                                {task.description && (
                                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                                    {task.description}
                                  </p>
                                )}

                                {/* Agent selector (inline) */}
                                {taskActive && agents.length > 0 && (
                                  <div className="mt-2">
                                    <Select
                                      value={task.targetAgentId ?? "all"}
                                      onValueChange={(v) => handleTaskAgentChange(config.pipelineStage, idx, v === "all" ? null : v)}
                                    >
                                      <SelectTrigger className="h-7 text-[10px] font-medium w-auto min-w-[140px] max-w-[200px] border-dashed">
                                        <Users className="h-2.5 w-2.5 mr-1 text-muted-foreground" />
                                        <SelectValue placeholder="Tout le monde" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="all" className="text-xs">Tout le monde</SelectItem>
                                        {agents.map((a) => (
                                          <SelectItem key={a.id} value={a.id} className="text-xs">
                                            {a.firstName} {a.lastName}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  </div>
                                )}

                                {/* WhatsApp template editor */}
                                {isEditingTpl && task.type === "OTHER" && (
                                  <div className="mt-3 pt-3 border-t border-dashed border-border">
                                    <textarea
                                      className="w-full rounded-lg border border-border bg-muted/30 px-3 py-2 text-xs focus:ring-1 focus:ring-primary/20 focus:border-primary outline-none resize-none"
                                      rows={3}
                                      maxLength={2000}
                                      placeholder="Template WhatsApp personnalisé..."
                                      value={task.messageTemplate ?? ""}
                                      onChange={(e) => handleTaskTemplateChange(config.pipelineStage, idx, e.target.value)}
                                    />
                                    <div className="mt-1.5 flex flex-wrap gap-1">
                                      {["{clientName}", "{agentName}", "{budget}", "{date}"].map(v => (
                                        <span key={v} className="px-1.5 py-0.5 rounded text-[10px] font-medium text-muted-foreground bg-muted/50 border border-border/50">{v}</span>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>

                              {/* Right actions */}
                              <div className="flex items-center gap-1.5 shrink-0">
                                {task.type === "OTHER" && (
                                  <button
                                    type="button"
                                    className="h-6 w-6 rounded hover:bg-accent flex items-center justify-center transition-colors"
                                    title="Template WhatsApp"
                                    onClick={() => setEditingTemplate(isEditingTpl ? null : templateKey)}
                                  >
                                    <Pencil className="h-3 w-3 text-muted-foreground" />
                                  </button>
                                )}
                                <Switch
                                  checked={taskActive}
                                  onCheckedChange={(c) => handleTaskToggle(config.pipelineStage, idx, c)}
                                  className="data-[state=checked]:bg-primary scale-75"
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}

                    {/* Save button */}
                    <div className="mt-3 mb-1">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleSaveTasks(config)}
                        disabled={isSaving}
                        className="h-8 text-xs font-medium gap-1.5 rounded-lg"
                      >
                        {isSaving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
                        Sauvegarder
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
