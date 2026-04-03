"use client";

import { ProjectCard } from "@/components/projects/ProjectCard";
import { FolderKanban } from "lucide-react";
import { Button } from "@/components/ui/button";

const MOCK_PROJECTS = [
  {
    id: "p1",
    name: "Résidence Riviera",
    location: "Alger Centre",
    availableUnits: 15,
    totalUnits: 60,
    progress: 75,
    status: "IN_PROGRESS",
    imageUrl: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&q=80",
  },
  {
    id: "p2",
    name: "Horizon Bay Villas",
    location: "Aïn Benian, Alger",
    availableUnits: 2,
    totalUnits: 12,
    progress: 95,
    status: "IN_PROGRESS",
    imageUrl: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&q=80",
  },
  {
    id: "p3",
    name: "Les Palmiers",
    location: "Oran",
    availableUnits: 40,
    totalUnits: 120,
    progress: 30,
    status: "LAUNCHING",
    imageUrl: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&q=80",
  },
  {
    id: "p4",
    name: "Tour d'Ivoire",
    location: "Bab Ezzouar",
    availableUnits: 0,
    totalUnits: 45,
    progress: 100,
    status: "DELIVERED",
    imageUrl: "https://images.unsplash.com/photo-1588196749597-9ff0c29b71e1?w=800&q=80",
  },
];

export default function ProjectsPage() {
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pt-4">
        {MOCK_PROJECTS.map((project) => (
          <ProjectCard key={project.id} {...project} />
        ))}
      </div>
    </div>
  );
}
