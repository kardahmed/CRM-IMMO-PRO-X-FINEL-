"use client";

import { useState, useEffect } from "react";
import { ProjectCard } from "@/components/projects/ProjectCard";
import { FolderKanban, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface Project {
  id: string;
  name: string;
  address: string | null;
  wilaya: string | null;
  commune: string | null;
  status: string;
  progressPercentage: number;
  deliveryDate: string | null;
  createdAt: string;
  properties?: Array<{
    id: string;
    status?: string;
  }>;
}

const STATUS_COLORS: Record<string, string> = {
  PLANNING: "bg-blue-100 text-blue-700",
  IN_PROGRESS: "bg-amber-100 text-amber-700",
  DELIVERED: "bg-green-100 text-green-700",
  CANCELLED: "bg-red-100 text-red-700",
};

const STATUS_LABELS: Record<string, string> = {
  PLANNING: "Planification",
  IN_PROGRESS: "En cours",
  DELIVERED: "Livré",
  CANCELLED: "Annulé",
};

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchProjects() {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch("/api/v1/projects?limit=100");
        if (!res.ok) throw new Error(`Erreur ${res.status}`);
        const json = await res.json();
        if (!json.success) throw new Error(json.error || "Erreur inconnue");
        setProjects(json.data.projects);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erreur lors du chargement");
      } finally {
        setLoading(false);
      }
    }
    fetchProjects();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-500">
            <FolderKanban className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight uppercase">Projets de Promotion</h1>
            <p className="text-sm text-muted-foreground font-medium">
              Suivi et commercialisation de vos projets immobiliers
            </p>
          </div>
        </div>

        <Button className="bg-amber-500 hover:bg-amber-600 font-bold text-white shadow-md">
          + Nouveau Projet
        </Button>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
          <span className="ml-3 text-muted-foreground font-medium">Chargement des projets...</span>
        </div>
      )}

      {/* Error */}
      {error && !loading && (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <AlertCircle className="h-10 w-10 text-red-500" />
          <p className="text-red-600 font-medium">{error}</p>
          <Button
            variant="outline"
            onClick={() => window.location.reload()}
            className="mt-2"
          >
            Réessayer
          </Button>
        </div>
      )}

      {/* Empty */}
      {!loading && !error && projects.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 gap-3 text-muted-foreground">
          <FolderKanban className="h-10 w-10" />
          <p className="font-medium">Aucun projet pour le moment</p>
        </div>
      )}

      {/* Project Cards */}
      {!loading && !error && projects.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pt-4">
          {projects.map((project) => {
            const totalUnits = project.properties?.length ?? 0;
            const availableUnits = project.properties?.filter(
              (p) => !p.status || p.status === "AVAILABLE"
            ).length ?? 0;

            return (
              <ProjectCard
                key={project.id}
                id={project.id}
                name={project.name}
                location={[project.commune, project.wilaya].filter(Boolean).join(", ") || project.address || "Non renseigné"}
                availableUnits={availableUnits}
                totalUnits={totalUnits}
                progress={project.progressPercentage}
                status={project.status}
                imageUrl={`https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&q=80`}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
