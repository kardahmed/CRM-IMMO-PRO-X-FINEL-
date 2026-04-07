"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import {
  ArrowLeft,
  Building,
  HardHat,
  FileText,
  Image as ImageIcon,
  Loader2,
  AlertCircle,
  Upload,
  Plus,
  Building2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { UnitGrid, type ProjectUnit } from "@/components/projects/UnitGrid";
import { CreditSimulator } from "@/components/shared/CreditSimulator";
import { cn } from "@/lib/utils";

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
  PLANNING: { label: "Planifie", className: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-none" },
  IN_PROGRESS: { label: "En cours", className: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-none" },
  DELIVERED: { label: "Livre", className: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-none" },
  CANCELLED: { label: "Annule", className: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-none" },
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
  const [updatingProgress, setUpdatingProgress] = useState(false);
  const [progressForm, setProgressForm] = useState({ percentage: "", note: "" });

  const fetchProject = useCallback(async () => {
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
  }, [projectId]);

  useEffect(() => {
    if (projectId) fetchProject();
  }, [projectId, fetchProject]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="space-y-4 text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
          <p className="text-sm text-muted-foreground font-medium">Chargement du projet...</p>
        </div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-6">
        <div className="p-8 rounded-[32px] bg-rose-50 dark:bg-rose-500/5 border border-rose-100 dark:border-rose-500/10 shadow-stripe text-center">
          <AlertCircle className="h-12 w-12 text-rose-500 mx-auto mb-4" />
          <p className="text-lg font-black text-foreground tracking-tight">Projet introuvable</p>
        </div>
        <Button onClick={() => router.back()} variant="outline" className="rounded-full font-bold px-8">
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
    <div className="space-y-6 pb-10 animate-in fade-in duration-700 slide-in-from-bottom-4">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => router.back()}
        className="gap-1.5 text-muted-foreground hover:text-foreground mb-2 rounded-xl"
      >
        <ArrowLeft className="h-4 w-4" />
        Retour aux projets
      </Button>

      {/* Header Profile */}
      <Card className="relative overflow-hidden rounded-[32px] border-border shadow-stripe">
        <div className="flex flex-col md:flex-row gap-6 p-6">
          {imageUrl && (
            <div
              className="absolute inset-0 opacity-5 bg-cover bg-center"
              style={{ backgroundImage: `url(${imageUrl})` }}
            />
          )}

          {imageUrl && (
            <div className="relative z-10 w-full md:w-64 h-48 shrink-0 rounded-2xl overflow-hidden shadow-stripe">
              <Image
                src={imageUrl}
                alt={project.name}
                className="w-full h-full object-cover"
                fill
                unoptimized
              />
            </div>
          )}

          <div className="relative z-10 flex-1 space-y-4">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-black uppercase tracking-[0.2em]">
                  <Building2 className="h-3 w-3" /> Projet
                </div>
                <h1 className="text-3xl font-black uppercase tracking-tighter text-foreground">
                  {project.name}
                </h1>
                {location && (
                  <p className="text-sm text-muted-foreground font-medium">
                    {location}
                  </p>
                )}
              </div>
              <Badge className={cn("font-black uppercase text-xs", statusCfg.className)}>
                {statusCfg.label}
              </Badge>
            </div>

            {project.description && (
              <p className="text-sm border-l-2 border-primary/50 pl-3 max-w-2xl text-muted-foreground">
                {project.description}
              </p>
            )}
          </div>
        </div>
      </Card>

      {/* Progress Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="rounded-[24px] border-border shadow-stripe">
          <div className="p-5 space-y-3">
            <div className="flex justify-between items-center text-sm font-bold">
              <span className="uppercase text-muted-foreground text-xs flex items-center gap-1.5 tracking-wider">
                <Building className="h-4 w-4 text-primary" /> Commercialisation
              </span>
              <span className="text-foreground">{sellRatio}% vendu</span>
            </div>
            <Progress value={sellRatio} className="h-2.5 bg-accent" />
            <p className="text-xs font-medium text-right text-muted-foreground tabular-nums">
              {soldUnits} sur {totalUnits} unites
            </p>
          </div>
        </Card>

        <Card className="rounded-[24px] border-border shadow-stripe">
          <div className="p-5 space-y-3">
            <div className="flex justify-between items-center text-sm font-bold">
              <span className="uppercase text-muted-foreground text-xs flex items-center gap-1.5 tracking-wider">
                <HardHat className="h-4 w-4 text-amber-500" /> Avancement chantier
              </span>
              <span className="text-foreground">{project.progressPercentage}%</span>
            </div>
            <Progress
              value={project.progressPercentage}
              className="h-2.5 bg-accent [&_[data-slot=progress-indicator]]:bg-amber-500"
            />
          </div>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="disponibilites" className="w-full">
        <TabsList className="w-full justify-start border-b border-border bg-transparent h-auto p-0 rounded-none gap-0">
          <TabsTrigger
            value="disponibilites"
            className="gap-1.5 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none font-bold px-6 py-3 text-muted-foreground data-[state=active]:text-foreground"
          >
            <Building className="h-4 w-4" /> Disponibilites ({totalUnits})
          </TabsTrigger>
          <TabsTrigger
            value="mises-a-jour"
            className="gap-1.5 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none font-bold px-6 py-3 text-muted-foreground data-[state=active]:text-foreground"
          >
            <HardHat className="h-4 w-4" /> Mises a jour
          </TabsTrigger>
          <TabsTrigger
            value="galerie"
            className="gap-1.5 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none font-bold px-6 py-3 text-muted-foreground data-[state=active]:text-foreground"
          >
            <ImageIcon className="h-4 w-4" /> Galerie & Plans
          </TabsTrigger>
          <TabsTrigger
            value="cadastre"
            className="gap-1.5 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none font-bold px-6 py-3 text-muted-foreground data-[state=active]:text-foreground"
          >
            <FileText className="h-4 w-4" /> Cadastre & Docs
          </TabsTrigger>
        </TabsList>

        <div className="mt-6">
          <TabsContent value="disponibilites">
            {units.length > 0 ? (
              <UnitGrid units={units} onUnitClick={handleUnitClick} />
            ) : (
              <Card className="p-12 text-center rounded-[24px] border-border shadow-sm">
                <Building2 className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
                <p className="text-muted-foreground font-medium">Aucune unite ajoutee a ce projet.</p>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="mises-a-jour">
            <div className="space-y-6">
              {/* Progress Update Form */}
              <Card className="rounded-[24px] border-border shadow-stripe">
                <CardContent className="p-5 space-y-4">
                  <h3 className="font-black text-xs uppercase text-muted-foreground tracking-[0.2em]">Mettre a jour l&apos;avancement</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                    <div className="space-y-2">
                      <label className="text-xs font-black text-muted-foreground uppercase tracking-wider">Pourcentage (%)</label>
                      <Input
                        type="number"
                        min={0}
                        max={100}
                        placeholder={`Actuel: ${project.progressPercentage}%`}
                        value={progressForm.percentage}
                        onChange={(e) => setProgressForm((p) => ({ ...p, percentage: e.target.value }))}
                        className="h-12 rounded-xl border-border"
                      />
                    </div>
                    <div className="space-y-2 md:col-span-1">
                      <label className="text-xs font-black text-muted-foreground uppercase tracking-wider">Note (optionnel)</label>
                      <Input
                        placeholder="Ex: Gros oeuvre termine"
                        value={progressForm.note}
                        onChange={(e) => setProgressForm((p) => ({ ...p, note: e.target.value }))}
                        className="h-12 rounded-xl border-border"
                      />
                    </div>
                    <Button
                      className="bg-primary hover:bg-primary/90 text-primary-foreground font-black rounded-xl h-12"
                      disabled={updatingProgress || !progressForm.percentage}
                      onClick={async () => {
                        setUpdatingProgress(true);
                        try {
                          const res = await fetch(`/api/v1/projects/${projectId}`, {
                            method: "PATCH",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                              progressPercentage: parseInt(progressForm.percentage),
                            }),
                          });
                          const json = await res.json();
                          if (!json.success) throw new Error(json.error ?? "Erreur");
                          toast.success("Avancement mis a jour");
                          setProgressForm({ percentage: "", note: "" });
                          fetchProject();
                        } catch (err) {
                          toast.error(err instanceof Error ? err.message : "Erreur");
                        } finally {
                          setUpdatingProgress(false);
                        }
                      }}
                    >
                      {updatingProgress ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
                      Enregistrer
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Current Status */}
              <Card className="rounded-[24px] border-border shadow-stripe">
                <CardContent className="p-5">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-900/20 text-amber-600">
                      <HardHat className="h-5 w-5" />
                    </div>
                    <h3 className="font-black text-sm text-foreground">Etat actuel du chantier</h3>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm font-bold text-foreground">
                      <span>Avancement global</span>
                      <span className="tabular-nums">{project.progressPercentage}%</span>
                    </div>
                    <Progress value={project.progressPercentage} className="h-3 bg-accent [&_[data-slot=progress-indicator]]:bg-amber-500" />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Statut: <Badge className={cn("font-bold text-[10px] ml-1", statusCfg.className)}>{statusCfg.label}</Badge></span>
                      <span className="tabular-nums">{soldUnits}/{totalUnits} vendues</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="galerie">
            {project.images && project.images.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {project.images.map((img, i) => (
                  <div
                    key={i}
                    className="aspect-video rounded-2xl overflow-hidden border border-border relative shadow-sm hover:shadow-stripe transition-all duration-300"
                  >
                    <Image
                      src={img}
                      alt={`${project.name} - ${i + 1}`}
                      className="w-full h-full object-cover"
                      fill
                      unoptimized
                    />
                  </div>
                ))}
              </div>
            ) : (
              <Card className="p-12 text-center rounded-[24px] border-border shadow-sm">
                <ImageIcon className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
                <p className="text-muted-foreground font-medium">Aucune image disponible.</p>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="cadastre">
            <Card className="rounded-[24px] border-border shadow-stripe">
              <CardContent className="p-5 space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-primary/10 text-primary">
                      <FileText className="h-5 w-5" />
                    </div>
                    <h3 className="font-black text-sm text-foreground">Documents du projet</h3>
                  </div>
                  <Button variant="outline" size="sm" className="font-bold gap-1.5 rounded-xl border-border" onClick={() => toast.info("Upload de documents bientot disponible")}>
                    <Upload className="h-3.5 w-3.5" /> Ajouter
                  </Button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {[
                    { name: "Permis de construire", type: "PDF", status: "requis" },
                    { name: "Livret foncier", type: "PDF", status: "requis" },
                    { name: "Plan cadastral", type: "PDF", status: "optionnel" },
                    { name: "Etude de sol", type: "PDF", status: "optionnel" },
                    { name: "Assurance decennale", type: "PDF", status: "requis" },
                    { name: "Plans architecte", type: "DWG/PDF", status: "optionnel" },
                  ].map((doc) => (
                    <div key={doc.name} className="flex items-center justify-between p-3 rounded-2xl border border-border bg-accent/30 hover:bg-accent/50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-primary/10">
                          <FileText className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-foreground">{doc.name}</p>
                          <p className="text-[10px] text-muted-foreground uppercase font-bold">{doc.type}</p>
                        </div>
                      </div>
                      <Badge variant={doc.status === "requis" ? "default" : "secondary"} className="text-[10px] font-bold uppercase">
                        {doc.status === "requis" ? "Non fourni" : "Optionnel"}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </div>
      </Tabs>

      {/* Unit Detail Simulator Modal */}
      <Dialog open={isUnitOpen} onOpenChange={setIsUnitOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader className="mb-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-black uppercase tracking-[0.2em] w-fit mb-2">
              <Building className="h-3 w-3" /> Unite
            </div>
            <DialogTitle className="text-2xl font-black uppercase tracking-tight text-foreground flex items-center gap-2">
              Unite {selectedUnit?.name}{" "}
              <Badge className="bg-primary/10 text-primary border-none font-bold">{selectedUnit?.type}</Badge>
            </DialogTitle>
            <DialogDescription className="text-sm font-bold flex items-center gap-2 mt-1 text-muted-foreground">
              <span>Bloc {selectedUnit?.block}</span> •{" "}
              <span>
                Etage{" "}
                {selectedUnit?.floor === 0 ? "RDC" : selectedUnit?.floor}
              </span>{" "}
              • <span>{selectedUnit?.area} m&sup2;</span>
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
