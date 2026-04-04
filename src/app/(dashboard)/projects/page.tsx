"use client";

import { useState, useEffect, useCallback } from "react";
import { ProjectCard } from "@/components/projects/ProjectCard";
import { FolderKanban, Loader2, AlertCircle, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

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
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [projectForm, setProjectForm] = useState({
    name: "",
    address: "",
    wilaya: "",
    commune: "",
    status: "PLANNING",
  });

  const fetchProjects = useCallback(async () => {
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
  }, []);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const handleCreateProject = async () => {
    if (!projectForm.name.trim()) {
      toast.error("Le nom du projet est requis");
      return;
    }
    setCreating(true);
    try {
      const res = await fetch("/api/v1/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: projectForm.name,
          address: projectForm.address || null,
          wilaya: projectForm.wilaya || null,
          commune: projectForm.commune || null,
          status: projectForm.status,
        }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error ?? "Erreur");
      toast.success("Projet cree avec succes");
      setIsCreateOpen(false);
      setProjectForm({ name: "", address: "", wilaya: "", commune: "", status: "PLANNING" });
      fetchProjects();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur lors de la creation");
    } finally {
      setCreating(false);
    }
  };

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

        <Button
          className="bg-amber-500 hover:bg-amber-600 font-bold text-white shadow-md"
          onClick={() => { setIsCreateOpen(true); setProjectForm({ name: "", address: "", wilaya: "", commune: "", status: "PLANNING" }); }}
        >
          <Plus className="h-4 w-4 mr-1.5" /> Nouveau Projet
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
                location={[project.commune, project.wilaya].filter(Boolean).join(", ") || project.address || "Non renseigne"}
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

      {/* Create Project Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-black flex items-center gap-2">
              <FolderKanban className="h-5 w-5 text-amber-500" /> Nouveau Projet
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase text-muted-foreground">Nom du projet</label>
              <Input
                placeholder="Ex: Residence Les Oliviers"
                value={projectForm.name}
                onChange={(e) => setProjectForm((p) => ({ ...p, name: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-muted-foreground">Wilaya</label>
                <Input
                  placeholder="Ex: Alger"
                  value={projectForm.wilaya}
                  onChange={(e) => setProjectForm((p) => ({ ...p, wilaya: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-muted-foreground">Commune</label>
                <Input
                  placeholder="Ex: Bab Ezzouar"
                  value={projectForm.commune}
                  onChange={(e) => setProjectForm((p) => ({ ...p, commune: e.target.value }))}
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase text-muted-foreground">Adresse</label>
              <Input
                placeholder="Adresse complete"
                value={projectForm.address}
                onChange={(e) => setProjectForm((p) => ({ ...p, address: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase text-muted-foreground">Statut initial</label>
              <Select value={projectForm.status} onValueChange={(v: string | null) => setProjectForm((p) => ({ ...p, status: v ?? "PLANNING" }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PLANNING">Planification</SelectItem>
                  <SelectItem value="IN_PROGRESS">En cours</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button className="w-full bg-amber-500 hover:bg-amber-600 text-white font-bold" onClick={handleCreateProject} disabled={creating}>
            {creating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Creer le projet
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
