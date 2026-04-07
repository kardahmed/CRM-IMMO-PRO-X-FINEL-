"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { ProjectCard } from "@/components/projects/ProjectCard";
import { UnitGrid, type ProjectUnit } from "@/components/projects/UnitGrid";
import { CreditSimulator } from "@/components/shared/CreditSimulator";
import {
  FolderKanban,
  Loader2,
  AlertCircle,
  Plus,
  Building,
  LayoutGrid,
  Search,
  Filter,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

interface IProperty {
  id: string;
  name: string;
  type: string;
  floor: number | null;
  rooms: number | null;
  surface: number | null;
  price: number | string | null;
  status: string;
}

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
  properties?: IProperty[];
}

const STATUS_FILTER_OPTIONS = [
  { value: "all", label: "Tous les statuts" },
  { value: "PLANNING", label: "Planification" },
  { value: "IN_PROGRESS", label: "En cours" },
  { value: "DELIVERED", label: "Livre" },
  { value: "CANCELLED", label: "Annule" },
];

const UNIT_STATUS_LABELS: Record<string, string> = {
  AVAILABLE: "Disponible",
  RESERVED: "Reserve",
  SOLD: "Vendu",
  RENTED: "Loue",
  BLOCKED: "Bloque",
};

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("projets");

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Availability tab filters
  const [selectedProjectId, setSelectedProjectId] = useState("all");
  const [unitStatusFilter, setUnitStatusFilter] = useState("all");

  // Create project dialog
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [projectForm, setProjectForm] = useState({
    name: "",
    address: "",
    wilaya: "",
    commune: "",
    status: "PLANNING",
  });

  // Unit detail dialog
  const [selectedUnit, setSelectedUnit] = useState<ProjectUnit | null>(null);
  const [isUnitOpen, setIsUnitOpen] = useState(false);
  const [unitProjectName, setUnitProjectName] = useState("");

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

  // Filtered projects for the cards tab
  const filteredProjects = useMemo(() => {
    return projects.filter((p) => {
      if (statusFilter !== "all" && p.status !== statusFilter) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matchName = p.name.toLowerCase().includes(q);
        const matchLocation = [p.commune, p.wilaya, p.address]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(q);
        if (!matchName && !matchLocation) return false;
      }
      return true;
    });
  }, [projects, statusFilter, searchQuery]);

  // All units across all projects for the availability tab
  const allUnits = useMemo(() => {
    const projectsToShow =
      selectedProjectId === "all"
        ? projects
        : projects.filter((p) => p.id === selectedProjectId);

    const units: (ProjectUnit & { projectName: string })[] = [];

    for (const project of projectsToShow) {
      if (!project.properties) continue;
      for (const prop of project.properties) {
        if (unitStatusFilter !== "all" && prop.status !== unitStatusFilter) continue;
        units.push({
          id: prop.id,
          name: prop.name,
          block: prop.name.split("-")[0] || "A",
          floor: prop.floor ?? 0,
          type: prop.type,
          area: prop.surface ?? 0,
          price: Number(prop.price) || 0,
          status: prop.status as ProjectUnit["status"],
          projectName: project.name,
        });
      }
    }
    return units;
  }, [projects, selectedProjectId, unitStatusFilter]);

  // Stats for availability tab
  const availabilityStats = useMemo(() => {
    const allProps = projects.flatMap((p) => p.properties || []);
    return {
      total: allProps.length,
      available: allProps.filter((p) => p.status === "AVAILABLE").length,
      reserved: allProps.filter((p) => p.status === "RESERVED").length,
      sold: allProps.filter((p) => p.status === "SOLD").length,
      rented: allProps.filter((p) => p.status === "RENTED").length,
    };
  }, [projects]);

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

  const handleUnitClick = (unit: ProjectUnit) => {
    setSelectedUnit(unit);
    // Find which project this unit belongs to
    const project = projects.find((p) =>
      p.properties?.some((prop) => prop.id === unit.id)
    );
    setUnitProjectName(project?.name ?? "");
    setIsUnitOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-500">
            <FolderKanban className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight uppercase">
              Projets de Promotion
            </h1>
            <p className="text-sm text-muted-foreground font-medium">
              Suivi et commercialisation de vos projets immobiliers
            </p>
          </div>
        </div>

        <Button
          className="bg-amber-500 hover:bg-amber-600 font-bold text-white shadow-md"
          onClick={() => {
            setIsCreateOpen(true);
            setProjectForm({ name: "", address: "", wilaya: "", commune: "", status: "PLANNING" });
          }}
        >
          <Plus className="h-4 w-4 mr-1.5" /> Nouveau Projet
        </Button>
      </div>

      {/* Tabs: Projets + Disponibilites */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(String(v ?? "projets"))} className="w-full">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <TabsList className="w-fit">
            <TabsTrigger value="projets" className="gap-1.5 font-bold text-xs">
              <FolderKanban className="h-3.5 w-3.5" />
              Projets
              {!loading && (
                <Badge variant="secondary" className="ml-1 text-[10px] px-1.5 py-0">
                  {projects.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="disponibilites" className="gap-1.5 font-bold text-xs">
              <LayoutGrid className="h-3.5 w-3.5" />
              Grille Disponibilites
              {!loading && (
                <Badge variant="secondary" className="ml-1 text-[10px] px-1.5 py-0">
                  {availabilityStats.total}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          {/* Filters for Projets tab */}
          {activeTab === "projets" && (
            <div className="flex items-center gap-2 flex-wrap">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  placeholder="Rechercher un projet..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 w-[220px] text-sm"
                />
              </div>
              <Select value={statusFilter} onValueChange={(v: string | null) => setStatusFilter(v ?? "all")}>
                <SelectTrigger className="w-[170px] text-sm">
                  <Filter className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_FILTER_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Filters for Disponibilites tab */}
          {activeTab === "disponibilites" && (
            <div className="flex items-center gap-2 flex-wrap">
              <Select value={selectedProjectId} onValueChange={(v: string | null) => setSelectedProjectId(v ?? "all")}>
                <SelectTrigger className="w-[200px] text-sm">
                  <Building className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les projets</SelectItem>
                  {projects.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={unitStatusFilter} onValueChange={(v: string | null) => setUnitStatusFilter(v ?? "all")}>
                <SelectTrigger className="w-[170px] text-sm">
                  <Filter className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les statuts</SelectItem>
                  {Object.entries(UNIT_STATUS_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
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
            <Button variant="outline" onClick={fetchProjects} className="mt-2">
              Reessayer
            </Button>
          </div>
        )}

        {/* -------- Tab: Projets -------- */}
        {!loading && !error && (
          <TabsContent value="projets" className="mt-6">
            {filteredProjects.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 gap-3 text-muted-foreground">
                <FolderKanban className="h-10 w-10" />
                <p className="font-medium">
                  {projects.length === 0
                    ? "Aucun projet pour le moment"
                    : "Aucun projet ne correspond aux filtres"}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredProjects.map((project) => {
                  const totalUnits = project.properties?.length ?? 0;
                  const availableUnits =
                    project.properties?.filter(
                      (p) => !p.status || p.status === "AVAILABLE"
                    ).length ?? 0;

                  return (
                    <ProjectCard
                      key={project.id}
                      id={project.id}
                      name={project.name}
                      location={
                        [project.commune, project.wilaya].filter(Boolean).join(", ") ||
                        project.address ||
                        "Non renseigne"
                      }
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
          </TabsContent>
        )}

        {/* -------- Tab: Disponibilites -------- */}
        {!loading && !error && (
          <TabsContent value="disponibilites" className="mt-6">
            {/* Availability Stats Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
              <div className="p-4 rounded-xl border bg-card text-center">
                <p className="text-[10px] font-black uppercase text-muted-foreground mb-1">
                  Disponibles
                </p>
                <p className="text-2xl font-black text-green-600">
                  {availabilityStats.available}
                </p>
              </div>
              <div className="p-4 rounded-xl border bg-card text-center">
                <p className="text-[10px] font-black uppercase text-muted-foreground mb-1">
                  Reserves
                </p>
                <p className="text-2xl font-black text-orange-500">
                  {availabilityStats.reserved}
                </p>
              </div>
              <div className="p-4 rounded-xl border bg-card text-center">
                <p className="text-[10px] font-black uppercase text-muted-foreground mb-1">
                  Vendus
                </p>
                <p className="text-2xl font-black text-red-500">
                  {availabilityStats.sold}
                </p>
              </div>
              <div className="p-4 rounded-xl border bg-card text-center">
                <p className="text-[10px] font-black uppercase text-muted-foreground mb-1">
                  Loues
                </p>
                <p className="text-2xl font-black text-blue-500">
                  {availabilityStats.rented}
                </p>
              </div>
            </div>

            {allUnits.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 gap-3 text-muted-foreground">
                <LayoutGrid className="h-10 w-10" />
                <p className="font-medium">Aucune unite trouvee</p>
              </div>
            ) : (
              <UnitGrid units={allUnits} onUnitClick={handleUnitClick} />
            )}
          </TabsContent>
        )}
      </Tabs>

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
              <label className="text-xs font-bold uppercase text-muted-foreground">
                Nom du projet
              </label>
              <Input
                placeholder="Ex: Residence Les Oliviers"
                value={projectForm.name}
                onChange={(e) => setProjectForm((p) => ({ ...p, name: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-muted-foreground">
                  Wilaya
                </label>
                <Input
                  placeholder="Ex: Alger"
                  value={projectForm.wilaya}
                  onChange={(e) => setProjectForm((p) => ({ ...p, wilaya: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-muted-foreground">
                  Commune
                </label>
                <Input
                  placeholder="Ex: Bab Ezzouar"
                  value={projectForm.commune}
                  onChange={(e) => setProjectForm((p) => ({ ...p, commune: e.target.value }))}
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase text-muted-foreground">
                Adresse
              </label>
              <Input
                placeholder="Adresse complete"
                value={projectForm.address}
                onChange={(e) => setProjectForm((p) => ({ ...p, address: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase text-muted-foreground">
                Statut initial
              </label>
              <Select
                value={projectForm.status}
                onValueChange={(v: string | null) =>
                  setProjectForm((p) => ({ ...p, status: v ?? "PLANNING" }))
                }
              >
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
          <Button
            className="w-full bg-amber-500 hover:bg-amber-600 text-white font-bold"
            onClick={handleCreateProject}
            disabled={creating}
          >
            {creating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Creer le projet
          </Button>
        </DialogContent>
      </Dialog>

      {/* Unit Detail + Credit Simulator Modal */}
      <Dialog open={isUnitOpen} onOpenChange={setIsUnitOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader className="mb-4">
            <DialogTitle className="text-2xl font-black uppercase flex items-center gap-2">
              Unite {selectedUnit?.name} <Badge>{selectedUnit?.type}</Badge>
            </DialogTitle>
            <DialogDescription className="text-sm font-bold flex items-center gap-2 mt-1">
              {unitProjectName && <span>{unitProjectName}</span>}
              {unitProjectName && <span>-</span>}
              <span>Bloc {selectedUnit?.block}</span> -{" "}
              <span>
                Etage {selectedUnit?.floor === 0 ? "RDC" : selectedUnit?.floor}
              </span>{" "}
              - <span>{selectedUnit?.area} m2</span>
            </DialogDescription>
          </DialogHeader>

          {selectedUnit && <CreditSimulator initialPrixBien={selectedUnit.price} />}
        </DialogContent>
      </Dialog>
    </div>
  );
}
