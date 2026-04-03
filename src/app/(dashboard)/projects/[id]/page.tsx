"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Building, HardHat, FileText, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { UnitGrid, type ProjectUnit } from "@/components/projects/UnitGrid";

// MOCK DATA
const MOCK_PROJECT = {
  id: "p1",
  name: "Résidence Riviera",
  location: "Alger Centre",
  status: "IN_PROGRESS",
  progress: 65,
  description: "Résidence haut de standing avec vue sur mer, matériaux premiums et espaces verts.",
  imageUrl: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&q=80",
  amenities: ["Parking S-S", "Ascenseur", "Sécurité H24", "Espaces verts"],
  units: [
    { id: "u1", name: "A-01", block: "A", floor: 0, type: "F3", area: 85, price: 12000000, status: "SOLD" },
    { id: "u2", name: "A-02", block: "A", floor: 0, type: "Local", area: 45, price: 9000000, status: "RENTED" },
    { id: "u3", name: "A-11", block: "A", floor: 1, type: "F3", area: 85, price: 12500000, status: "AVAILABLE" },
    { id: "u4", name: "A-12", block: "A", floor: 1, type: "F4", area: 110, price: 16500000, status: "RESERVED" },
    { id: "u5", name: "A-21", block: "A", floor: 2, type: "F4", area: 115, price: 17500000, status: "AVAILABLE" },
    { id: "u6", name: "A-22", block: "A", floor: 2, type: "F5", area: 140, price: 21500000, status: "AVAILABLE" },
    { id: "u7", name: "B-01", block: "B", floor: 0, type: "F2", area: 65, price: 9500000, status: "SOLD" },
    { id: "u8", name: "B-11", block: "B", floor: 1, type: "F3", area: 90, price: 13500000, status: "AVAILABLE" },
    { id: "u9", name: "B-21", block: "B", floor: 2, type: "F3", area: 90, price: 14000000, status: "AVAILABLE" },
  ] as ProjectUnit[],
};

export default function ProjectDetailPage() {
  const router = useRouter();
  const project = MOCK_PROJECT; // Simplified fetch
  const totalUnits = project.units.length;
  const soldUnits = project.units.filter((u) => u.status === "SOLD").length;
  const sellRatio = Math.round((soldUnits / totalUnits) * 100);

  const handleUnitClick = (unit: ProjectUnit) => {
    // Fiche Bien Modal logic here
    alert(`Ouverture fiche bien: ${unit.name} (${unit.status})`);
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
        {/* Background Image blurry */}
        <div 
          className="absolute inset-0 opacity-10 bg-cover bg-center" 
          style={{ backgroundImage: `url(${project.imageUrl})` }}
        />

        <div className="relative z-10 w-full md:w-64 h-48 shrink-0 rounded-xl overflow-hidden shadow-md">
          <img src={project.imageUrl} alt={project.name} className="w-full h-full object-cover" />
        </div>

        <div className="relative z-10 flex-1 space-y-4">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-black uppercase tracking-tight">{project.name}</h1>
              <p className="text-muted-foreground font-medium flex items-center gap-1 mt-1">
                {project.location}
              </p>
            </div>
            <Badge className="bg-amber-100 text-amber-700 bg-opacity-90 font-black uppercase text-xs">
              En cours
            </Badge>
          </div>

          <p className="text-sm border-l-2 border-primary/50 pl-3 max-w-2xl">{project.description}</p>

          <div className="flex flex-wrap gap-2 pt-2">
            {project.amenities.map(a => (
              <Badge key={a} variant="outline" className="text-[10px] font-bold bg-accent/30">{a}</Badge>
            ))}
          </div>
        </div>
      </div>

      {/* Progress Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-5 rounded-xl border bg-card space-y-3">
          <div className="flex justify-between items-center text-sm font-bold">
            <span className="uppercase text-muted-foreground text-xs flex items-center gap-1.5"><Building className="h-4 w-4 text-primary" /> Commercialisation</span>
            <span>{sellRatio}% vendu</span>
          </div>
          <Progress value={sellRatio} className="h-2 bg-neutral-200 dark:bg-neutral-800" />
          <p className="text-xs font-medium text-right text-muted-foreground">{soldUnits} sur {totalUnits} unités</p>
        </div>

        <div className="p-5 rounded-xl border bg-card space-y-3">
          <div className="flex justify-between items-center text-sm font-bold">
            <span className="uppercase text-muted-foreground text-xs flex items-center gap-1.5"><HardHat className="h-4 w-4 text-amber-500" /> État d'avancement (Chantier)</span>
            <span>{project.progress}%</span>
          </div>
          <Progress value={project.progress} className="h-2 bg-neutral-200 dark:bg-neutral-800 [&_[data-slot=progress-indicator]]:bg-amber-500" />
          <p className="text-xs font-medium text-right text-muted-foreground">Mise à jour: Il y a 3 jours</p>
        </div>
      </div>

      {/* Tabs Menu */}
      <Tabs defaultValue="disponibilites" className="w-full">
        <TabsList className="w-full justify-start border-b bg-transparent h-auto p-0 rounded-none gap-0">
          <TabsTrigger
            value="disponibilites"
            className="gap-1.5 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none font-bold px-6 py-3"
          >
            <Building className="h-4 w-4" /> Disponibilités
          </TabsTrigger>
          <TabsTrigger
            value="mises-a-jour"
            className="gap-1.5 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none font-bold px-6 py-3"
          >
            <HardHat className="h-4 w-4" /> Mises à jour
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
            <UnitGrid units={project.units} onUnitClick={handleUnitClick} />
          </TabsContent>

          <TabsContent value="mises-a-jour">
            <div className="p-12 text-center text-muted-foreground italic border rounded-xl bg-card">
              Timeline de chantier à venir...
            </div>
          </TabsContent>

          <TabsContent value="galerie">
            <div className="p-12 text-center text-muted-foreground italic border rounded-xl bg-card">
              Galerie d'images et plans 3D...
            </div>
          </TabsContent>

          <TabsContent value="cadastre">
            <div className="p-12 text-center text-muted-foreground italic border rounded-xl bg-card">
              Documents notariés, permis de construire, livret foncier...
            </div>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
