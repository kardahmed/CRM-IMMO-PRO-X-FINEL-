"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
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
  Users,
  Settings2,
  BarChart3,
  Pencil,
} from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
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

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface AutomationTask {
  name: string;
  type: string;
  delayMinutes?: number;
  isActive?: boolean;
  targetAgentId?: string | null;
  messageTemplate?: string;
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
// Pipeline stage labels & colors
// ---------------------------------------------------------------------------
const STAGE_META: Record<string, { label: string; color: string; order: number }> = {
  NEW: { label: "Nouveau", color: "bg-blue-500/15 text-blue-700", order: 1 },
  CONTACTED: { label: "Contacté", color: "bg-cyan-500/15 text-cyan-700", order: 2 },
  QUALIFIED: { label: "Qualifié", color: "bg-violet-500/15 text-violet-700", order: 3 },
  VISIT_SCHEDULED: { label: "Visite planifiée", color: "bg-indigo-500/15 text-indigo-700", order: 4 },
  VISITED: { label: "Visite effectuée", color: "bg-sky-500/15 text-sky-700", order: 5 },
  NEGOTIATION: { label: "Négociation", color: "bg-amber-500/15 text-amber-700", order: 6 },
  RESERVED: { label: "Réservé", color: "bg-orange-500/15 text-orange-700", order: 7 },
  SIGNED: { label: "Signé", color: "bg-emerald-500/15 text-emerald-700", order: 8 },
  CLOSED: { label: "Clôturé", color: "bg-green-500/15 text-green-700", order: 9 },
};

// ---------------------------------------------------------------------------
// Task type metadata
// ---------------------------------------------------------------------------
const TYPE_META: Record<string, { label: string; icon: string; color: string }> = {
  CALL: { label: "Appel", icon: "Phone", color: "bg-green-100 text-green-700" },
  OTHER: { label: "WhatsApp/SMS", icon: "MessageCircle", color: "bg-emerald-100 text-emerald-700" },
  DOCUMENT: { label: "Document", icon: "FileText", color: "bg-blue-100 text-blue-700" },
  MEETING: { label: "Rendez-vous", icon: "Calendar", color: "bg-purple-100 text-purple-700" },
};

const TYPE_ICONS: Record<string, React.ReactNode> = {
  Phone: <Phone className="h-3.5 w-3.5" />,
  MessageCircle: <MessageCircle className="h-3.5 w-3.5" />,
  FileText: <FileText className="h-3.5 w-3.5" />,
  Calendar: <Calendar className="h-3.5 w-3.5" />,
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function formatDelay(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  if (minutes < 1440) return `${Math.round(minutes / 60)}h`;
  return `${Math.round(minutes / 1440)} jour${Math.round(minutes / 1440) > 1 ? "s" : ""}`;
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

  // -------------------------------------------------------------------------
  // Fetch configs
  // -------------------------------------------------------------------------
  const fetchConfigs = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/v1/automations/config");
      const json = await res.json();
      if (json.success) {
        setConfigs(json.data);
      } else {
        setError(json.error ?? "Erreur lors du chargement des automatisations");
      }
    } catch {
      setError("Impossible de contacter le serveur");
    } finally {
      setLoading(false);
    }
  }, []);

  // -------------------------------------------------------------------------
  // Fetch agents
  // -------------------------------------------------------------------------
  const fetchAgents = useCallback(async () => {
    try {
      const res = await fetch("/api/v1/settings/team");
      const json = await res.json();
      if (json.data?.members) {
        setAgents(json.data.members);
      }
    } catch {
      // Silently fail — agent list is optional
    }
  }, []);

  useEffect(() => {
    fetchConfigs();
    fetchAgents();
  }, [fetchConfigs, fetchAgents]);

  // -------------------------------------------------------------------------
  // Toggle expand/collapse
  // -------------------------------------------------------------------------
  const toggleExpand = useCallback((stage: string) => {
    setExpandedStages((prev) => {
      const next = new Set(prev);
      if (next.has(stage)) {
        next.delete(stage);
      } else {
        next.add(stage);
      }
      return next;
    });
  }, []);

  // -------------------------------------------------------------------------
  // Master toggle
  // -------------------------------------------------------------------------
  const handleMasterToggle = useCallback(async (pipelineStage: string, isActive: boolean) => {
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
      if (!json.success) {
        throw new Error(json.error ?? "Erreur");
      }
      toast.success(`Automatisation "${STAGE_META[pipelineStage]?.label ?? pipelineStage}" ${isActive ? "activée" : "désactivée"}`);
    } catch {
      setConfigs((prev) =>
        prev.map((c) => (c.pipelineStage === pipelineStage ? { ...c, isActive: !isActive } : c))
      );
      toast.error("Erreur lors de la mise à jour");
    }
  }, []);

  // -------------------------------------------------------------------------
  // Task toggle
  // -------------------------------------------------------------------------
  const handleTaskToggle = useCallback((pipelineStage: string, taskIndex: number, isActive: boolean) => {
    setConfigs((prev) =>
      prev.map((c) => {
        if (c.pipelineStage !== pipelineStage) return c;
        const updatedTasks = c.tasks.map((t, i) =>
          i === taskIndex ? { ...t, isActive } : t
        );
        return { ...c, tasks: updatedTasks };
      })
    );
  }, []);

  // -------------------------------------------------------------------------
  // Task agent targeting
  // -------------------------------------------------------------------------
  const handleTaskAgentChange = useCallback((pipelineStage: string, taskIndex: number, agentId: string | null) => {
    setConfigs((prev) =>
      prev.map((c) => {
        if (c.pipelineStage !== pipelineStage) return c;
        const updatedTasks = c.tasks.map((t, i) =>
          i === taskIndex ? { ...t, targetAgentId: agentId } : t
        );
        return { ...c, tasks: updatedTasks };
      })
    );
  }, []);

  // -------------------------------------------------------------------------
  // Task message template
  // -------------------------------------------------------------------------
  const handleTaskTemplateChange = useCallback((pipelineStage: string, taskIndex: number, template: string) => {
    setConfigs((prev) =>
      prev.map((c) => {
        if (c.pipelineStage !== pipelineStage) return c;
        const updatedTasks = c.tasks.map((t, i) =>
          i === taskIndex ? { ...t, messageTemplate: template || undefined } : t
        );
        return { ...c, tasks: updatedTasks };
      })
    );
  }, []);

  // -------------------------------------------------------------------------
  // Save tasks for a stage
  // -------------------------------------------------------------------------
  const handleSaveTasks = useCallback(async (config: AutomationConfig) => {
    setSavingStages((prev) => new Set(prev).add(config.pipelineStage));
    try {
      const res = await fetch("/api/v1/automations/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pipelineStage: config.pipelineStage,
          isActive: config.isActive,
          tasks: config.tasks,
        }),
      });
      const json = await res.json();
      if (!json.success) {
        throw new Error(json.error ?? "Erreur");
      }
      toast.success(`Tâches "${STAGE_META[config.pipelineStage]?.label ?? config.pipelineStage}" sauvegardées`);
    } catch {
      toast.error("Erreur lors de la sauvegarde des tâches");
    } finally {
      setSavingStages((prev) => {
        const next = new Set(prev);
        next.delete(config.pipelineStage);
        return next;
      });
    }
  }, []);

  // -------------------------------------------------------------------------
  // Sort configs by stage order
  // -------------------------------------------------------------------------
  const sortedConfigs = [...configs].sort((a, b) => {
    const orderA = STAGE_META[a.pipelineStage]?.order ?? 99;
    const orderB = STAGE_META[b.pipelineStage]?.order ?? 99;
    return orderA - orderB;
  });

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------
  return (
    <div className="flex flex-col gap-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-primary/10 text-primary">
            <Settings2 className="h-7 w-7" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight uppercase">
              Automatisations
            </h1>
            <p className="text-sm text-muted-foreground font-medium mt-0.5">
              Panneau de controle des actions automatiques par etape du pipeline.
            </p>
          </div>
        </div>
        <Link href="/dashboard/automations/dashboard">
          <Button variant="outline" className="gap-2 font-bold">
            <BarChart3 className="h-4 w-4" />
            Tableau de bord
          </Button>
        </Link>
      </div>

      {/* Loading state */}
      {loading && (
        <div className="flex flex-col gap-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-6 w-28 rounded-full" />
                    <Skeleton className="h-4 w-40" />
                  </div>
                  <Skeleton className="h-6 w-11 rounded-full" />
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      )}

      {/* Error state */}
      {!loading && error && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 gap-3 text-muted-foreground">
            <XCircle className="h-10 w-10 text-red-400" />
            <p>{error}</p>
            <Button variant="outline" size="sm" onClick={fetchConfigs}>
              Réessayer
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Empty state */}
      {!loading && !error && configs.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 gap-3 text-muted-foreground">
            <Zap className="h-10 w-10" />
            <p>Aucune automatisation configurée</p>
          </CardContent>
        </Card>
      )}

      {/* Stage cards */}
      {!loading && !error && sortedConfigs.length > 0 && (
        <div className="flex flex-col gap-4">
          {sortedConfigs.map((config) => {
            const meta = STAGE_META[config.pipelineStage] ?? {
              label: config.pipelineStage,
              color: "bg-muted text-muted-foreground",
              order: 99,
            };
            const tasks: AutomationTask[] = Array.isArray(config.tasks) ? config.tasks : [];
            const isExpanded = expandedStages.has(config.pipelineStage);
            const isSaving = savingStages.has(config.pipelineStage);
            const activeTaskCount = tasks.filter((t) => t.isActive !== false).length;

            return (
              <Card
                key={config.id}
                className={`transition-colors ${!config.isActive ? "opacity-60" : ""}`}
              >
                {/* Stage header */}
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between gap-4">
                    <button
                      type="button"
                      className="flex items-center gap-3 flex-1 min-w-0 text-left cursor-pointer hover:opacity-80 transition-opacity"
                      onClick={() => toggleExpand(config.pipelineStage)}
                    >
                      {isExpanded ? (
                        <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                      )}
                      <Badge variant="secondary" className={`${meta.color} shrink-0`}>
                        {meta.label}
                      </Badge>
                      <span className="text-xs text-muted-foreground truncate">
                        {activeTaskCount}/{tasks.length} tâche{tasks.length !== 1 ? "s" : ""} active{activeTaskCount !== 1 ? "s" : ""}
                      </span>
                    </button>

                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-xs font-medium text-muted-foreground">
                        {config.isActive ? "Activé" : "Désactivé"}
                      </span>
                      <Switch
                        checked={config.isActive}
                        onCheckedChange={(checked: boolean) =>
                          handleMasterToggle(config.pipelineStage, checked)
                        }
                        aria-label={`Activer ${meta.label}`}
                      />
                    </div>
                  </div>
                </CardHeader>

                {/* Expanded task list */}
                {isExpanded && (
                  <CardContent className="pt-0">
                    <div className="border-t pt-4">
                      {tasks.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-4">
                          Aucune tâche configurée pour cette étape
                        </p>
                      ) : (
                        <div className="flex flex-col gap-3">
                          {tasks.map((task, taskIndex) => {
                            const typeMeta = TYPE_META[task.type] ?? {
                              label: task.type,
                              icon: "FileText",
                              color: "bg-gray-100 text-gray-700",
                            };
                            const icon = TYPE_ICONS[typeMeta.icon] ?? (
                              <FileText className="h-3.5 w-3.5" />
                            );

                            const templateKey = `${config.pipelineStage}-${taskIndex}`;
                            const isEditingTemplate = editingTemplate === templateKey;

                            return (
                              <div key={taskIndex} className="flex flex-col gap-0">
                                <div
                                  className={`flex items-center gap-4 p-3 rounded-lg border transition-colors ${
                                    task.isActive === false
                                      ? "bg-muted/30 border-muted"
                                      : "bg-background border-border"
                                  } ${isEditingTemplate ? "rounded-b-none" : ""}`}
                                >
                                  {/* Task info */}
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <span className="text-sm font-medium truncate">
                                        {task.name}
                                      </span>
                                      <Badge
                                        variant="secondary"
                                        className={`${typeMeta.color} text-xs gap-1 shrink-0`}
                                      >
                                        {icon}
                                        {typeMeta.label}
                                      </Badge>
                                      {task.delayMinutes != null && task.delayMinutes > 0 && (
                                        <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                                          <Clock className="h-3 w-3" />
                                          {formatDelay(task.delayMinutes)}
                                        </span>
                                      )}
                                      {task.type === "OTHER" && (
                                        <button
                                          type="button"
                                          className="inline-flex items-center justify-center h-6 w-6 rounded hover:bg-muted transition-colors"
                                          title="Modifier le template WhatsApp"
                                          onClick={() =>
                                            setEditingTemplate(isEditingTemplate ? null : templateKey)
                                          }
                                        >
                                          <Pencil className="h-3 w-3 text-muted-foreground" />
                                        </button>
                                      )}
                                    </div>
                                  </div>

                                {/* Agent selector */}
                                <div className="shrink-0 w-44">
                                  <Select
                                    value={task.targetAgentId ?? "all"}
                                    onValueChange={(value) =>
                                      handleTaskAgentChange(
                                        config.pipelineStage,
                                        taskIndex,
                                        !value || value === "all" ? null : value
                                      )
                                    }
                                  >
                                    <SelectTrigger className="h-8 text-xs">
                                      <Users className="h-3 w-3 mr-1 shrink-0" />
                                      <SelectValue placeholder="Agent cible" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="all">
                                        Tous les agents
                                      </SelectItem>
                                      {agents.map((agent) => (
                                        <SelectItem key={agent.id} value={agent.id}>
                                          {agent.firstName} {agent.lastName}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>

                                {/* Task toggle */}
                                <Switch
                                  checked={task.isActive !== false}
                                  onCheckedChange={(checked: boolean) =>
                                    handleTaskToggle(config.pipelineStage, taskIndex, checked)
                                  }
                                  aria-label={`Activer la tâche ${task.name}`}
                                  className="shrink-0"
                                />
                              </div>

                              {/* WhatsApp template editor */}
                              {isEditingTemplate && task.type === "OTHER" && (
                                <div className="border border-t-0 rounded-b-lg p-3 bg-muted/20 flex flex-col gap-2">
                                  <label className="text-xs font-semibold text-foreground">
                                    Template de message WhatsApp
                                  </label>
                                  <textarea
                                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-y min-h-[80px]"
                                    rows={3}
                                    maxLength={2000}
                                    placeholder="Pas de template personnalise"
                                    value={task.messageTemplate ?? ""}
                                    onChange={(e) =>
                                      handleTaskTemplateChange(
                                        config.pipelineStage,
                                        taskIndex,
                                        e.target.value
                                      )
                                    }
                                  />
                                  <p className="text-[11px] text-muted-foreground">
                                    Variables disponibles : <code className="bg-muted px-1 rounded">{"{clientName}"}</code> <code className="bg-muted px-1 rounded">{"{agentName}"}</code> <code className="bg-muted px-1 rounded">{"{propertyName}"}</code> <code className="bg-muted px-1 rounded">{"{budget}"}</code> <code className="bg-muted px-1 rounded">{"{date}"}</code>
                                  </p>
                                </div>
                              )}
                              </div>
                            );
                          })}

                          {/* Save button */}
                          <div className="flex justify-end pt-2">
                            <Button
                              size="sm"
                              onClick={() => handleSaveTasks(config)}
                              disabled={isSaving}
                            >
                              {isSaving ? "Enregistrement..." : "Enregistrer les modifications"}
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
