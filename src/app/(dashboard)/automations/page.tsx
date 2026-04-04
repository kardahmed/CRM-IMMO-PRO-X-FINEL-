"use client";

import { useState, useEffect, useCallback } from "react";
import { Zap, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface AutomationTask {
  name: string;
  type: string;
}

interface AutomationConfig {
  id: string;
  pipelineStage: string;
  isActive: boolean;
  tasks: AutomationTask[];
  createdAt: string;
}

// ---------------------------------------------------------------------------
// Pipeline stage labels & colors
// ---------------------------------------------------------------------------
const STAGE_META: Record<string, { label: string; color: string }> = {
  NEW: { label: "Nouveau", color: "bg-blue-500/15 text-blue-700" },
  CONTACTED: { label: "Contacte", color: "bg-cyan-500/15 text-cyan-700" },
  QUALIFIED: { label: "Qualifie", color: "bg-violet-500/15 text-violet-700" },
  VISIT_SCHEDULED: { label: "Visite planifiee", color: "bg-indigo-500/15 text-indigo-700" },
  VISITED: { label: "Visite effectuee", color: "bg-sky-500/15 text-sky-700" },
  NEGOTIATION: { label: "Negociation", color: "bg-amber-500/15 text-amber-700" },
  RESERVED: { label: "Reserve", color: "bg-orange-500/15 text-orange-700" },
  SIGNED: { label: "Signe", color: "bg-emerald-500/15 text-emerald-700" },
  CLOSED: { label: "Cloture", color: "bg-green-500/15 text-green-700" },
};

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
export default function AutomationsPage() {
  const [configs, setConfigs] = useState<AutomationConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  useEffect(() => {
    fetchConfigs();
  }, [fetchConfigs]);

  const handleToggle = useCallback(async (pipelineStage: string, isActive: boolean) => {
    // Optimistic update
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
      toast.success(`Automatisation ${isActive ? "activee" : "desactivee"}`);
    } catch {
      // Rollback
      setConfigs((prev) =>
        prev.map((c) => (c.pipelineStage === pipelineStage ? { ...c, isActive: !isActive } : c))
      );
      toast.error("Erreur lors de la mise a jour");
    }
  }, []);

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------
  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
          <Zap className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-2xl font-black tracking-tight uppercase">
            Automatisations
          </h1>
          <p className="text-sm text-muted-foreground font-medium">
            Configurez les actions automatiques a chaque etape du pipeline
          </p>
        </div>
      </div>

      {/* Loading state */}
      {loading && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 9 }).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-5 w-32" />
              </CardHeader>
              <CardContent className="space-y-3">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
              </CardContent>
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
          </CardContent>
        </Card>
      )}

      {/* Empty state */}
      {!loading && !error && configs.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 gap-3 text-muted-foreground">
            <Zap className="h-10 w-10" />
            <p>Aucune automatisation configuree</p>
          </CardContent>
        </Card>
      )}

      {/* Configs grid */}
      {!loading && !error && configs.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {configs.map((config) => {
            const meta = STAGE_META[config.pipelineStage] ?? {
              label: config.pipelineStage,
              color: "bg-muted text-muted-foreground",
            };
            const tasks: AutomationTask[] = Array.isArray(config.tasks)
              ? config.tasks
              : [];

            return (
              <Card key={config.id}>
                <CardHeader className="flex flex-row items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <Badge
                      variant="secondary"
                      className={meta.color}
                    >
                      {meta.label}
                    </Badge>
                    <CardTitle className="truncate text-sm">
                      {config.pipelineStage}
                    </CardTitle>
                  </div>
                  <Switch
                    checked={config.isActive}
                    onCheckedChange={(checked: boolean) => handleToggle(config.pipelineStage, checked)}
                    aria-label={`Activer ${meta.label}`}
                  />
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    {config.isActive ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-400" />
                    )}
                    <span>
                      {config.isActive ? "Active" : "Desactivee"}
                    </span>
                  </div>
                  <p className="text-sm font-medium">
                    {tasks.length} tache{tasks.length !== 1 ? "s" : ""} configuree{tasks.length !== 1 ? "s" : ""}
                  </p>
                  {tasks.length > 0 && (
                    <ul className="text-xs text-muted-foreground space-y-1">
                      {tasks.map((task, i) => (
                        <li key={i} className="flex items-center gap-1.5">
                          <span className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                          {task.name}
                        </li>
                      ))}
                    </ul>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
