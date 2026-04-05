"use client";

import { Check, Dot, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

const PIPELINE_STAGES = [
  { id: "ACCUEIL", label: "Accueil" },
  { id: "VISITE_A_GERER", label: "Visite à planifier" },
  { id: "VISITE_CONFIRMEE", label: "Visite confirmée" },
  { id: "VISITE_TERMINEE", label: "Visite terminée" },
  { id: "NEGOCIATION", label: "Négociation" },
  { id: "RESERVATION", label: "Réservation" },
  { id: "VENTE", label: "Vente" },
];

interface PipelineStepperProps {
  currentStage: string;
}

export function PipelineStepper({ currentStage }: PipelineStepperProps) {
  // Exception handling for off-flow states
  if (currentStage === "PERDUE") {
    return (
      <div className="w-full bg-red-50 border border-red-100 rounded-xl p-4 flex items-center justify-center text-red-600 font-bold">
        Ce dossier client est marqué comme perdu (PERDUE).
      </div>
    );
  }
  if (currentStage === "RELANCEMENT") {
    return (
      <div className="w-full bg-orange-50 border border-orange-100 rounded-xl p-4 flex items-center justify-center text-orange-600 font-bold">
        Le client est actuellement en relancement post-échec (RELANCEMENT).
      </div>
    );
  }

  const currentIndex = PIPELINE_STAGES.findIndex((s) => s.id === currentStage);

  return (
    <div className="w-full bg-white dark:bg-card border rounded-2xl p-6 overflow-x-auto no-scrollbar shadow-sm">
      <div className="min-w-[700px] flex items-center justify-between relative px-2">
        {/* Ligne d'arrière-plan */}
        <div className="absolute left-8 right-8 top-4 h-[2px] bg-neutral-100 dark:bg-neutral-800 -z-10" />

        {/* Ligne de progression dynamique */}
        <div 
          className="absolute left-8 top-4 h-[2px] bg-primary -z-10 transition-all duration-500 ease-in-out" 
          style={{ width: `calc(${Math.max(0, currentIndex / (PIPELINE_STAGES.length - 1)) * 100}% - 4rem)` }}
        />

        {PIPELINE_STAGES.map((stage, idx) => {
          const isCompleted = idx < currentIndex;
          const isCurrent = idx === currentIndex;
          
          return (
            <div key={stage.id} className="flex flex-col items-center gap-2 group relative">
              <div
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center transition-all shadow-sm ring-4 ring-white dark:ring-card",
                  isCompleted ? "bg-primary text-white scale-95" : 
                  isCurrent ? "bg-white border-2 border-primary text-primary scale-110 shadow-md" : 
                  "bg-neutral-100 text-neutral-400 dark:bg-neutral-800"
                )}
              >
                {isCompleted ? <Check className="h-4 w-4 stroke-[3]" /> : 
                 isCurrent ? <ArrowRight className="h-4 w-4 stroke-[3] animate-pulse" /> : 
                 <Dot className="h-6 w-6" />}
              </div>
              <span 
                className={cn(
                  "text-xs font-bold uppercase tracking-wider text-center max-w-[90px] leading-tight",
                  isCurrent ? "text-primary" : 
                  isCompleted ? "text-foreground" : "text-muted-foreground"
                )}
              >
                {stage.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
