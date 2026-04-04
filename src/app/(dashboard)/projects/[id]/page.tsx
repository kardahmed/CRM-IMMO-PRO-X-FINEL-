"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Building,
  HardHat,
  FileText,
  Image as ImageIcon,
  Loader2,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { UnitGrid, type ProjectUnit } from "@/components/projects/UnitGrid";
import { CreditSimulator } from "@/components/shared/CreditSimulator";

interface IProperty {
  id: string;
  name: string;
  type: string;
  floor: number | null;
  rooms: number | null;
  surface: number | null;
  price: number | string | null;
  status: string;
  transactionType: string | null;
}

interface IProject {
  id: string;
  name: string;
  address: string | null;
  wilaya: string | null;
  status: string;
  description: string | null;
  images: string[];
  progressPercentage: number;
  totalLots: number | null;
  properties: IProperty[];
}

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  PLANNING: { label: "Planifie", className: "bg-blue-100 text-blue-700" },
  IN_PROGRESS: { label: "En cours", className: "bg-amber-100 text-amber-700" },
  DELIVERED: { label: "Livre", className: "bg-green-100 text-green-700" },
  CANCELLED: { label: "Annule", className: "bg-red-100 text-red-700" },
};

export default function ProjectDetailPage() {
  const router = useRouter();
  const params = useParams();
  const projectId = params.id as string;

  const [project, setProject] = useState<IProject | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const [selectedUnit, setSelectedUnit] = useState<ProjectUnit | null>(null);
  const [isUnitOpen, setIsUnitOpen] = useState(false);

  async function fetchProject() {
    setLoading(true);
    setError(false);
    try {
      const res = await fetch(`/api/v1/projects/${projectId}`);
      if (!res.ok) throw new Error("Failed");
      const json = await res.json();
      if (json.success) setProject(json.data);
      else throw new Error(json.error);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (projectId) fetchProject();
  }, [projectId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
        <AlertCircle className="h-12 w-12 text-destructive" />
        <p className="text-xl font-bold">Projet introuvable</p>
        <Button onClick={() => router.back()} variant="outline">
          <ArrowLeft className="h-4 w-4 mr-2" /> Retour
        </Button>
      </div>
    );
  }

  // Map properties to units for UnitGrid
  const units: ProjectUnit[] = project.properties.map((p) => ({
    id: p.id,
    name: p.name,
    block: p.name.split("-")[0] || "A",
    floor: p.floor ?? 0,
    type: p.type,
    area: p.surface ?? 0,
    price: Number(p.price) || 0,
    status: p.status as ProjectUnit["status"],
  }));

  const totalUnits = units.length;
  const soldUnits = units.filter((u) => u.status === "SOLD").length;
  const sellRatio = totalUnits > 0 ? Math.round((soldUnits / totalUnits) * 100) : 0;
  const statusCfg = STATUS_CONFIG[project.status] ?? STATUS_CONFIG.PLANNING;
  const location = [project.address, project.wilaya].filter(Boolean).join(", ");
  const imageUrl = project.images?.[0] ?? null;

  const handleUnitClick = (unit: ProjectUnit) => {
    setSelectedUnit(unit);
    setIsUnitOpen(true);
  };

  return (
    <div className="space-y-6 pb-10">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => router.back()}
        className="gap-1.5 text-muted-foreground hover:text-foreground mb-2"
      >
        <ArrowLeft className="h-4 w-4" />
        Retour aux projets
      </Button>

      {/* Header Profile */}
      <div className="flex flex-col md:flex-row gap-6 relative p-6 rounded-2xl border bg-card shadow-sm overflow-hidden">
        {imageUrl && (
          <div
            className="absolute inset-0 opacity-10 bg-cover bg-center"
            style={{ backgroundImage: `url(${imageUrl})` }}
          />
        )}

        {imageUrl && (
          <div className="relative z-10 w-full md:w-64 h-48 shrink-0 rounded-xl overflow-hidden shadow-md">
            <img
              src={imageUrl}
              alt={project.name}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        <div className="relative z-10 flex-1 space-y-4">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-black uppercase tracking-tight">
                {project.name}
              </h1>
              {location && (
                <p className="text-muted-foreground font-medium mt-1">
                  {location}
                </p>
              )}
            </div>
            <Badge className={`${statusCfg.className} font-black uppercase text-xs`}>
              {statusCfg.label}
            </Badge>
          </div>

          {project.description && (
            <p className="text-sm border-l-2 border-primary/50 pl-3 max-w-2xl">
              {project.description}
            </p>
          )}
        </div>
      </div>

      {/* Progress Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-5 rounded-xl border bg-card space-y-3">
          <div className="flex justify-between items-center text-sm font-bold">
            <span className="uppercase text-muted-foreground text-xs flex items-center gap-1.5">
              <Building className="h-4 w-4 text-primary" /> Commercialisation
            </span>
            <span>{sellRatio}% vendu</span>
          </div>
          <Progress value={sellRatio} className="h-2 bg-neutral-200 dark:bg-neutral-800" />
          <p className="text-xs font-medium text-right text-muted-foreground">
            {soldUnits} sur {totalUnits} unites
          </p>
        </div>

        <div className="p-5 rounded-xl border bg-card space-y-3">
          <div className="flex justify-between items-center text-sm font-bold">
            <span className="uppercase text-muted-foreground text-xs flex items-center gap-1.5">
              <HardHat className="h-4 w-4 text-amber-500" /> Avancement chantier
            </span>
            <span>{project.progressPercentage}%</span>
          </div>
          <Progress
            value={project.progressPercentage}
            className="h-2 bg-neutral-200 dark:bg-neutral-800 [&_[data-slot=progress-indicator]]:bg-amber-500"
          />
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="disponibilites" className="w-full">
        <TabsList className="w-full justify-start border-b bg-transparent h-auto p-0 rounded-none gap-0">
          <TabsTrigger
            value="disponibilites"
            className="gap-1.5 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none font-bold px-6 py-3"
          >
            <Building className="h-4 w-4" /> Disponibilites ({totalUnits})
          </TabsTrigger>
          <TabsTrigger
            value="mises-a-jour"
            className="gap-1.5 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none font-bold px-6 py-3"
          >
            <HardHat className="h-4 w-4" /> Mises a jour
          </TabsTrigger>
          <TabsTrigger
            value="galerie"
            className="gap-1.5 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none font-bold px-6 py-3"
          >
            <ImageIcon className="h-4 w-4" /> Galerie & Plans
          </TabsTrigger>
          <TabsTrigger
            value="cadastre"
            className="gap-1.5 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none font-bold px-6 py-3"
          >
            <FileText className="h-4 w-4" /> Cadastre & Docs
          </TabsTrigger>
        </TabsList>

        <div className="mt-6">
          <TabsContent value="disponibilites">
            {units.length > 0 ? (
              <UnitGrid units={units} onUnitClick={handleUnitClick} />
            ) : (
              <div className="p-12 text-center text-muted-foreground italic border rounded-xl bg-card">
                Aucune unite ajoutee a ce projet.
              </div>
            )}
          </TabsContent>

          <TabsContent value="mises-a-jour">
            <div className="p-12 text-center text-muted-foreground italic border rounded-xl bg-card">
              Timeline de chantier a venir...
            </div>
          </TabsContent>

          <TabsContent value="galerie">
            {project.images && project.images.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {project.images.map((img, i) => (
                  <div
                    key={i}
                    className="aspect-video rounded-xl overflow-hidden border"
                  >
                    <img
                      src={img}
                      alt={`${project.name} - ${i + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-12 text-center text-muted-foreground italic border rounded-xl bg-card">
                Aucune image disponible.
              </div>
            )}
          </TabsContent>

          <TabsContent value="cadastre">
            <div className="p-12 text-center text-muted-foreground italic border rounded-xl bg-card">
              Documents notaries, permis de construire, livret foncier...
            </div>
          </TabsContent>
        </div>
      </Tabs>

      {/* Unit Detail Simulator Modal */}
      <Dialog open={isUnitOpen} onOpenChange={setIsUnitOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader className="mb-4">
            <DialogTitle className="text-2xl font-black uppercase flex items-center gap-2">
              Unite {selectedUnit?.name}{" "}
              <Badge>{selectedUnit?.type}</Badge>
            </DialogTitle>
            <DialogDescription className="text-sm font-bold flex items-center gap-2 mt-1">
              <span>Bloc {selectedUnit?.block}</span> •{" "}
              <span>
                Etage{" "}
                {selectedUnit?.floor === 0 ? "RDC" : selectedUnit?.floor}
              </span>{" "}
              • <span>{selectedUnit?.area} m²</span>
            </DialogDescription>
          </DialogHeader>

          {selectedUnit && (
            <CreditSimulator initialPrixBien={selectedUnit.price} />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
