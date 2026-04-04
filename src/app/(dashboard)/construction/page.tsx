"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Building2,
  XCircle,
  Loader2,
  MapPin,
  CalendarDays,
  Home,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Progress,
  ProgressLabel,
  ProgressValue,
} from "@/components/ui/progress";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface Project {
  id: string;
  name: string;
  address: string;
  wilaya: string;
  status: string;
  progressPercentage: number;
  deliveryDate: string | null;
  _count: {
    properties: number;
  };
}

// ---------------------------------------------------------------------------
// Status config
// ---------------------------------------------------------------------------
const STATUS_META: Record<string, { label: string; color: string }> = {
  PLANNING: { label: "Planification", color: "bg-blue-500/15 text-blue-700" },
  IN_PROGRESS: {
    label: "En cours",
    color: "bg-amber-500/15 text-amber-700",
  },
  DELIVERED: { label: "Livre", color: "bg-green-500/15 text-green-700" },
  CANCELLED: { label: "Annule", color: "bg-red-500/15 text-red-700" },
};

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
export default function ConstructionPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProjects = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/v1/projects");
      const json = await res.json();
      if (json.success) {
        setProjects(json.data);
      } else {
        setError(json.error ?? "Erreur lors du chargement des projets");
      }
    } catch {
      setError("Impossible de contacter le serveur");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  // -------------------------------------------------------------------------
  // Helpers
  // -------------------------------------------------------------------------
  const formatDate = (dateStr: string | null): string => {
    if (!dateStr) return "Non definie";
    try {
      return new Intl.DateTimeFormat("fr-FR", {
        day: "numeric",
        month: "long",
        year: "numeric",
      }).format(new Date(dateStr));
    } catch {
      return dateStr;
    }
  };

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------
  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
          <Building2 className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-2xl font-black tracking-tight uppercase">
            Suivi construction
          </h1>
          <p className="text-sm text-muted-foreground font-medium">
            Suivez l&apos;avancement de vos programmes immobiliers
          </p>
        </div>
      </div>

      {/* Loading state */}
      {loading && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-5 w-40" />
              </CardHeader>
              <CardContent className="space-y-3">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-2 w-full" />
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
      {!loading && !error && projects.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 gap-3 text-muted-foreground">
            <Building2 className="h-10 w-10" />
            <p>Aucun projet de construction</p>
          </CardContent>
        </Card>
      )}

      {/* Projects grid */}
      {!loading && !error && projects.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => {
            const meta = STATUS_META[project.status] ?? {
              label: project.status,
              color: "bg-muted text-muted-foreground",
            };

            return (
              <Card key={project.id}>
                <CardHeader className="flex flex-row items-start justify-between gap-2">
                  <div className="min-w-0">
                    <CardTitle className="truncate text-base">
                      {project.name}
                    </CardTitle>
                    <div className="flex items-center gap-1.5 mt-1 text-xs text-muted-foreground">
                      <MapPin className="h-3.5 w-3.5 shrink-0" />
                      <span className="truncate">
                        {project.address}
                        {project.wilaya ? `, ${project.wilaya}` : ""}
                      </span>
                    </div>
                  </div>
                  <Badge variant="secondary" className={meta.color}>
                    {meta.label}
                  </Badge>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Progress */}
                  <Progress value={project.progressPercentage}>
                    <ProgressLabel>Avancement</ProgressLabel>
                    <ProgressValue />
                  </Progress>

                  {/* Meta info */}
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                      <CalendarDays className="h-3.5 w-3.5" />
                      <span>Livraison : {formatDate(project.deliveryDate)}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Home className="h-3.5 w-3.5" />
                      <span>
                        {project._count.properties} bien
                        {project._count.properties !== 1 ? "s" : ""}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
