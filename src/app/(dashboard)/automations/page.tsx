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
  PlusCircle,
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
import { cn } from "@/lib/utils";
import { VerticalFlowConnector } from "@/components/automations/FlowConnector";

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
  NEW: { label: "Nouveau", color: "bg-blue-500/10 text-blue-600 border-blue-500/20", order: 1 },
  CONTACTED: { label: "Contacté", color: "bg-cyan-500/10 text-cyan-600 border-cyan-500/20", order: 2 },
  QUALIFIED: { label: "Qualified", color: "bg-violet-500/10 text-violet-600 border-violet-500/20", order: 3 },
  VISIT_SCHEDULED: { label: "Visite planifiée", color: "bg-indigo-500/10 text-indigo-600 border-indigo-500/20", order: 4 },
  VISITED: { label: "Visite effectuée", color: "bg-sky-500/10 text-sky-600 border-sky-500/20", order: 5 },
  NEGOTIATION: { label: "Négociation", color: "bg-amber-500/10 text-amber-600 border-amber-500/20", order: 6 },
  RESERVED: { label: "Réservé", color: "bg-orange-500/10 text-orange-600 border-orange-500/20", order: 7 },
  SIGNED: { label: "Signé", color: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20", order: 8 },
  CLOSED: { label: "Clôturé", color: "bg-green-500/10 text-green-600 border-green-500/20", order: 9 },
};

// ---------------------------------------------------------------------------
// Task type metadata
// ---------------------------------------------------------------------------
const TYPE_META: Record<string, { label: string; icon: string; color: string }> = {
  CALL: { label: "Appel", icon: "Phone", color: "bg-emerald-50 text-emerald-600 border-emerald-100" },
  OTHER: { label: "WhatsApp/SMS", icon: "MessageCircle", color: "bg-emerald-50 text-emerald-600 border-emerald-100" },
  DOCUMENT: { label: "Document", icon: "FileText", color: "bg-blue-50 text-blue-600 border-blue-100" },
  MEETING: { label: "Rendez-vous", icon: "Calendar", color: "bg-purple-50 text-purple-600 border-purple-100" },
};

const TYPE_ICONS: Record<string, React.ReactNode> = {
  Phone: <Phone className="h-4 w-4" />,
  MessageCircle: <MessageCircle className="h-4 w-4" />,
  FileText: <FileText className="h-4 w-4" />,
  Calendar: <Calendar className="h-4 w-4" />,
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
      // Silently fail
    }
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
      toast.success(`Flux "${STAGE_META[pipelineStage]?.label ?? pipelineStage}" ${isActive ? "mis en route" : "suspendu"}`);
    } catch {
      setConfigs((prev) =>
        prev.map((c) => (c.pipelineStage === pipelineStage ? { ...c, isActive: !isActive } : c))
      );
      toast.error("Erreur technique de synchronisation");
    }
  };

  const handleTaskToggle = (pipelineStage: string, taskIndex: number, isActive: boolean) => {
    setConfigs((prev) =>
      prev.map((c) => {
        if (c.pipelineStage !== pipelineStage) return c;
        const updatedTasks = c.tasks.map((t, i) =>
          i === taskIndex ? { ...t, isActive } : t
        );
        return { ...c, tasks: updatedTasks };
      })
    );
  };

  const handleTaskAgentChange = (pipelineStage: string, taskIndex: number, agentId: string | null) => {
    setConfigs((prev) =>
      prev.map((c) => {
        if (c.pipelineStage !== pipelineStage) return c;
        const updatedTasks = c.tasks.map((t, i) =>
          i === taskIndex ? { ...t, targetAgentId: agentId } : t
        );
        return { ...c, tasks: updatedTasks };
      })
    );
  };

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
        body: JSON.stringify(config),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      toast.success(`Flux "${STAGE_META[config.pipelineStage]?.label ?? config.pipelineStage}" optimisé`);
    } catch {
      toast.error("Erreur d'enregistrement");
    } finally {
      setSavingStages((prev) => {
        const next = new Set(prev);
        next.delete(config.pipelineStage);
        return next;
      });
    }
  }, [setSavingStages]);

  const sortedConfigs = [...configs].sort((a, b) => {
    return (STAGE_META[a.pipelineStage]?.order ?? 99) - (STAGE_META[b.pipelineStage]?.order ?? 99);
  });

  return (
    <div className="space-y-12 pb-20 max-w-5xl mx-auto px-4 italic-none">
      {/* Executive Header */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-6 bg-card p-8 rounded-[32px] shadow-stripe border border-border animate-page-enter">
        <div className="flex items-center gap-6">
          <div className="h-16 w-16 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 shadow-sm border border-emerald-500/20">
            <Zap className="h-8 w-8 fill-emerald-500/20" />
          </div>
          <div>
            <h1 className="text-4xl font-black tracking-tighter text-foreground flex items-center gap-2">
              Automations
              <span className="text-primary italic text-xl font-medium tracking-normal opacity-40 lowercase">engine</span>
            </h1>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-[0.3em] opacity-60 mt-1">
              Architecture des Flux & Propulseurs d'Activite
            </p>
          </div>
        </div>
        <Link href="/dashboard/automations/dashboard">
          <Button variant="outline" className="h-14 px-8 rounded-full font-bold uppercase text-xs tracking-[0.2em] shadow-stripe border-border hover:bg-accent gap-3 group transition-all">
            <BarChart3 className="h-4 w-4 text-primary group-hover:rotate-12 transition-transform" />
            Performance Hub
          </Button>
        </Link>
      </div>

      {loading ? (
        <div className="space-y-10">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-32 rounded-[32px] w-full" />)}
        </div>
      ) : error ? (
        <Card className="rounded-[32px] border-none shadow-stripe bg-rose-50/50 p-12 text-center">
          <XCircle className="h-16 w-16 text-rose-500 mx-auto mb-4 opacity-50" />
          <p className="text-lg font-bold text-rose-900 tracking-tight">{error}</p>
          <Button onClick={fetchConfigs} variant="outline" className="mt-6 rounded-full h-12 px-8">Réessayer</Button>
        </Card>
      ) : (
        <div className="space-y-16 relative">
          {/* Vertical Visual Guide Line */}
          <div className="absolute left-[39px] top-10 bottom-0 w-[2px] bg-neutral-100/50 hidden lg:block" />

          {sortedConfigs.map((config) => {
            const meta = STAGE_META[config.pipelineStage] ?? { label: config.pipelineStage, color: "bg-muted text-muted-foreground", order: 99 };
            const isExpanded = expandedStages.has(config.pipelineStage);
            const isSaving = savingStages.has(config.pipelineStage);
            const tasks = config.tasks || [];
            const activeTaskCount = tasks.filter(t => t.isActive !== false).length;

            return (
              <div key={config.id} className="relative animate-page-enter">
                {/* TRIGGER NODE */}
                <div className="relative z-10 flex items-start gap-4 lg:gap-8 group">
                   <div className={cn(
                     "flex-shrink-0 h-[80px] w-[80px] rounded-full flex items-center justify-center transition-all duration-700 shadow-stripe-lg border-4 border-white",
                     config.isActive ? "bg-emerald-500 text-white scale-110" : "bg-neutral-100 text-neutral-400 grayscale"
                   )}>
                     <Zap className={cn("h-8 w-8", config.isActive && "animate-pulse")} />
                   </div>
                   
                   <div className={cn(
                     "flex-1 bg-card p-8 rounded-[32px] border transition-all duration-500 shadow-stripe hover:shadow-stripe-lg",
                     config.isActive ? "border-emerald-500/10" : "border-border opacity-60"
                   )}>
                      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                        <div className="space-y-1">
                           <div className="flex items-center gap-3">
                             <span className="text-xs font-bold uppercase tracking-[0.25em] text-primary">Déclencheur Système</span>
                             <Badge className={cn("rounded-full px-4 py-1 text-xs font-bold uppercase border", meta.color)}>
                               {meta.label}
                             </Badge>
                           </div>
                           <h3 className="text-2xl font-black tracking-tight text-foreground transition-colors group-hover:text-primary">
                             Prospect entre dans l'étape
                           </h3>
                           <p className="text-sm text-muted-foreground font-medium italic">
                             Actionne automatiquement {tasks.length} propulseur{tasks.length > 1 ? "s" : ""} logistique{tasks.length > 1 ? "s" : ""}.
                           </p>
                        </div>

                        <div className="flex items-center gap-6 self-start lg:self-center bg-accent px-6 py-4 rounded-2xl border border-border">
                          <div className="text-right">
                             <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground/60">{config.isActive ? "Actif" : "Suspendu"}</p>
                             <p className="text-xs font-bold uppercase text-foreground">{activeTaskCount} actif{activeTaskCount > 1 ? "s" : ""}</p>
                          </div>
                          <Switch
                            checked={config.isActive}
                            onCheckedChange={(checked) => handleMasterToggle(config.pipelineStage, checked)}
                            className="data-[state=checked]:bg-emerald-500"
                          />
                        </div>
                      </div>

                      {/* Expand / Visual Flow Control */}
                      <Button 
                        variant="ghost" 
                        onClick={() => toggleExpand(config.pipelineStage)}
                        className="mt-6 w-full h-12 bg-accent/50 hover:bg-accent border border-border text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground transition-all rounded-xl gap-2"
                      >
                        {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                        {isExpanded ? "Masquer le pipeline visuel" : "Déployer le flux Zapier"}
                      </Button>
                   </div>
                </div>

                {/* VISUAL FLOW - ACTION NODES */}
                {isExpanded && (
                  <div className="mt-4 ml-[39px] flex flex-col items-center lg:items-start lg:ml-[39px] animate-in fade-in slide-in-from-top-4 duration-500 w-full lg:w-auto">
                    {tasks.map((task, idx) => {
                      const typeMeta = TYPE_META[task.type] ?? { label: task.type, icon: "FileText", color: "bg-gray-100 text-gray-700" };
                      const IconNode = TYPE_ICONS[typeMeta.icon] ?? <FileText className="h-4 w-4" />;

                      return (
                        <div key={idx} className="flex flex-col items-center lg:items-start w-full">
                          <VerticalFlowConnector active={config.isActive && task.isActive !== false} className="lg:w-20 lg:ml-[-10px]" />
                          
                          <div className="flex items-start gap-6 lg:gap-8 w-full group/task">
                            {/* Action Pulse Point */}
                            <div className={cn(
                              "flex-shrink-0 h-4 w-4 rounded-full mt-10 transition-all duration-700 relative",
                              task.isActive !== false ? "bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.5)] scale-125" : "bg-neutral-200"
                            )}>
                              {task.isActive !== false && <div className="absolute inset-0 rounded-full bg-emerald-500 animate-ping opacity-25" />}
                            </div>

                            {/* Action Card */}
                            <div className={cn(
                              "flex-1 bg-card border p-6 rounded-[24px] shadow-stripe hover:shadow-stripe-lg transition-all duration-500",
                              task.isActive !== false ? "border-emerald-500/5" : "opacity-50 border-border"
                            )}>
                              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                                <div className="flex items-center gap-4">
                                  <div className={cn("h-12 w-12 rounded-[14px] flex items-center justify-center border shadow-sm transition-transform group-hover/task:rotate-3", typeMeta.color)}>
                                    {IconNode}
                                  </div>
                                  <div>
                                    <div className="flex items-center gap-2 mb-0.5">
                                      <span className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground/60 italic">Propulseur #{idx + 1}</span>
                                      {task.delayMinutes && task.delayMinutes > 0 && (
                                        <Badge variant="outline" className="text-xs font-bold uppercase py-0 px-2 flex items-center gap-1 border-border">
                                          <Clock className="h-2.5 w-2.5" />
                                          Délai : {formatDelay(task.delayMinutes)}
                                        </Badge>
                                      )}
                                      {task.type === "OTHER" && (
                                        <button
                                          type="button"
                                          className="inline-flex items-center justify-center h-6 w-6 rounded hover:bg-accent transition-colors"
                                          title="Modifier le template WhatsApp"
                                          onClick={() => {
                                            const templateKey = `${config.pipelineStage}-${idx}`;
                                            setEditingTemplate(editingTemplate === templateKey ? null : templateKey);
                                          }}
                                        >
                                          <Pencil className="h-3 w-3 text-muted-foreground" />
                                        </button>
                                      )}
                                    </div>
                                    <h4 className="text-lg font-bold tracking-tight text-foreground">{task.name}</h4>
                                  </div>
                                </div>

                                <div className="flex items-center gap-4 w-full md:w-auto">
                                  <div className="flex-1 min-w-[160px]">
                                    <Select
                                      value={task.targetAgentId ?? "all"}
                                      onValueChange={(v) => handleTaskAgentChange(config.pipelineStage, idx, v === "all" ? null : v)}
                                    >
                                      <SelectTrigger className="h-10 text-xs font-bold uppercase tracking-widest border-border rounded-xl bg-accent/50">
                                        <Users className="h-3 w-3 mr-2 text-primary" />
                                        <SelectValue placeholder="Assigne à..." />
                                      </SelectTrigger>
                                      <SelectContent className="rounded-xl border-border shadow-stripe-lg">
                                        <SelectItem value="all" className="text-xs font-bold uppercase">Flux Collectif</SelectItem>
                                        {agents.map((a) => (
                                          <SelectItem key={a.id} value={a.id} className="text-xs font-bold uppercase">{a.firstName} {a.lastName}</SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  </div>
                                  <Switch
                                    checked={task.isActive !== false}
                                    onCheckedChange={(c) => handleTaskToggle(config.pipelineStage, idx, c)}
                                    className="data-[state=checked]:bg-emerald-500 scale-90"
                                  />
                                </div>
                              </div>

                              {/* WhatsApp template editor */}
                              {editingTemplate === `${config.pipelineStage}-${idx}` && task.type === "OTHER" && (
                                <div className="mt-4 border-t border-border pt-4 animate-in fade-in slide-in-from-top-2 duration-300">
                                  <label className="text-xs font-black uppercase tracking-widest text-muted-foreground block mb-2">
                                    Template de message WhatsApp
                                  </label>
                                  <textarea
                                    className="w-full rounded-xl border border-border bg-accent/50 px-4 py-3 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all resize-none min-h-[100px] font-medium text-foreground"
                                    rows={3}
                                    maxLength={2000}
                                    placeholder="Pas de template personnalisé"
                                    value={task.messageTemplate ?? ""}
                                    onChange={(e) => handleTaskTemplateChange(config.pipelineStage, idx, e.target.value)}
                                  />
                                  <div className="mt-2 flex flex-wrap gap-1.5">
                                    {["{clientName}", "{agentName}", "{propertyName}", "{budget}", "{date}"].map(v => (
                                      <span key={v} className="px-2 py-0.5 rounded-md bg-neutral-100 text-xs font-bold text-muted-foreground border border-neutral-200/50">{v}</span>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}

                    <div className="mt-8 self-end pr-0 lg:pr-8 animate-in fade-in duration-1000">
                      <Button
                        size="lg"
                        onClick={() => handleSaveTasks(config)}
                        disabled={isSaving}
                        className="h-14 px-10 rounded-full font-black uppercase text-xs tracking-[0.25em] bg-neutral-900 text-white shadow-stripe-lg hover:bg-neutral-800 transition-all active:scale-95 italic"
                      >
                        {isSaving ? "Synchronisation..." : "Optimiser ce flux"}
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
