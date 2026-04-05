"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { MapPin, Building, Home, ArrowRight } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";

interface ProjectCardProps {
  id: string;
  name: string;
  location: string;
  availableUnits: number;
  totalUnits: number;
  progress: number;
  status: string;
  imageUrl: string;
}

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  PLANNING: { label: "Planification", color: "bg-blue-100 text-blue-700 bg-opacity-90" },
  IN_PROGRESS: { label: "En cours", color: "bg-amber-100 text-amber-700 bg-opacity-90" },
  DELIVERED: { label: "Livré", color: "bg-green-100 text-green-700 bg-opacity-90" },
  CANCELLED: { label: "Annulé", color: "bg-red-100 text-red-700 bg-opacity-90" },
};

export function ProjectCard({ id, name, location, availableUnits, totalUnits, progress, status, imageUrl }: ProjectCardProps) {
  const sc = STATUS_CONFIG[status] || STATUS_CONFIG.IN_PROGRESS;
  const soldUnits = totalUnits - availableUnits;
  const sellRatio = Math.round((soldUnits / totalUnits) * 100);

  return (
    <Link href={`/projects/${id}`}>
      <Card className="overflow-hidden cursor-pointer group hover:shadow-lg transition-all hover:-translate-y-1 border-neutral-100 dark:border-neutral-800">
        {/* Cover */}
        <div className="relative h-48 w-full">
          <Image src={imageUrl} alt={name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" fill sizes="(max-width: 768px) 100vw, 400px" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          <div className="absolute top-3 right-3">
            <Badge className={cn("text-[10px] font-black uppercase text-white shadow-sm border-none backdrop-blur-md", sc.color)}>
              {sc.label}
            </Badge>
          </div>
          <div className="absolute bottom-3 left-3 right-3 text-white">
            <h3 className="text-lg font-black leading-tight shadow-black drop-shadow-md">{name}</h3>
            <p className="text-white/80 text-xs font-medium flex items-center gap-1 mt-0.5 shadow-black drop-shadow-md">
              <MapPin className="h-3 w-3" /> {location}
            </p>
          </div>
        </div>

        {/* Info */}
        <CardContent className="p-4 space-y-4 bg-card">
          {/* Blocks / Units */}
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="flex flex-col gap-1 p-2 rounded-lg bg-accent/30 border text-center">
              <span className="text-xs text-muted-foreground font-bold uppercase"><Home className="h-3 w-3 inline mr-1" />Disponibles</span>
              <span className="font-black text-primary text-xl">{availableUnits}</span>
            </div>
            <div className="flex flex-col gap-1 p-2 rounded-lg bg-accent/30 border text-center">
              <span className="text-xs text-muted-foreground font-bold uppercase"><Building className="h-3 w-3 inline mr-1" />Total Biens</span>
              <span className="font-black text-xl">{totalUnits}</span>
            </div>
          </div>

          {/* Progress Section */}
          <div className="space-y-3 pt-2 border-t">
            {/* Commercialisation */}
            <div>
              <div className="flex justify-between text-xs font-bold mb-1.5">
                <span className="text-muted-foreground uppercase text-[10px]">Commercialisation</span>
                <span>{sellRatio}% vendu</span>
              </div>
              <Progress value={sellRatio} className="h-1.5 bg-neutral-200 dark:bg-neutral-800" />
            </div>

            {/* Chantier */}
            <div>
              <div className="flex justify-between text-xs font-bold mb-1.5">
                <span className="text-muted-foreground uppercase text-[10px]">Chantier</span>
                <span>{progress}%</span>
              </div>
              <Progress value={progress} className="h-1.5 bg-neutral-200 dark:bg-neutral-800 [&_[data-slot=progress-indicator]]:bg-amber-500" />
            </div>
          </div>

          <div className="pt-2 flex items-center text-xs font-bold text-primary group-hover:underline">
            Voir les détails du projet <ArrowRight className="h-3 w-3 ml-1 group-hover:translate-x-1 transition-transform" />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
