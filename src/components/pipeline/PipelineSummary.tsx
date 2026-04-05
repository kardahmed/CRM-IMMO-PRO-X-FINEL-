"use client";

import { Card } from "@/components/ui/card";
import { 
  TrendingUp, 
  Users, 
  Target, 
  BarChart3,
  Wallet,
  ArrowUpRight
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { PipelineClient } from "./KanbanCard";

interface PipelineSummaryProps {
  clients: PipelineClient[];
  className?: string;
}

function formatCurrency(amount: number): string {
  if (amount >= 1_000_000_000) {
    return `${(amount / 1_000_000_000).toFixed(2)}Md DA`;
  }
  if (amount >= 1_000_000) {
    return `${(amount / 1_000_000).toFixed(1)}M DA`;
  }
  return `${(amount / 1_000).toFixed(0)}k DA`;
}

export function PipelineSummary({ clients, className }: PipelineSummaryProps) {
  const totalValue = clients.reduce((acc, c) => acc + (c.budget || 0), 0);
  const totalLeads = clients.length;
  
  // Calculate average value
  const avgValue = totalLeads > 0 ? totalValue / totalLeads : 0;

  // Calculate "Hot" leads (those in advanced stages)
  const advancedStages = ["VISIT_SCHEDULED", "VISITED", "NEGOTIATION", "RESERVED", "SIGNED"];
  const hotLeads = clients.filter(c => advancedStages.includes(c.stage)).length;
  const hotPercentage = totalLeads > 0 ? Math.round((hotLeads / totalLeads) * 100) : 0;

  const stats = [
    {
      label: "Valeur Totale",
      value: formatCurrency(totalValue),
      icon: Wallet,
      color: "text-emerald-600",
      bg: "bg-emerald-50 dark:bg-emerald-900/20",
      description: "Valeur cumulée du pipeline"
    },
    {
      label: "Prospects Actifs",
      value: totalLeads.toString(),
      icon: Users,
      color: "text-blue-600",
      bg: "bg-blue-50 dark:bg-blue-900/20",
      description: "Total des leads gérés"
    },
    {
      label: "Panier Moyen",
      value: formatCurrency(avgValue),
      icon: BarChart3,
      color: "text-indigo-600",
      bg: "bg-indigo-50 dark:bg-indigo-900/20",
      description: "Budget moyen par prospect"
    },
    {
      label: "Leads Qualifiés",
      value: `${hotPercentage}%`,
      icon: Target,
      color: "text-orange-600",
      bg: "bg-orange-50 dark:bg-orange-900/20",
      description: "Progrès vers la conversion"
    }
  ];

  return (
    <div className={cn("grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4", className)}>
      {stats.map((stat, idx) => (
        <Card 
          key={idx} 
          className="relative overflow-hidden border-none shadow-sm bg-white dark:bg-neutral-900 group"
        >
          <div className="p-5">
            <div className="flex items-center justify-between mb-4">
              <div className={cn("p-2.5 rounded-xl transition-transform group-hover:scale-110", stat.bg, stat.color)}>
                <stat.icon className="h-5 w-5" />
              </div>
              <div className="flex items-center gap-1 text-xs font-bold text-muted-foreground uppercase tracking-wider">
                Direct <ArrowUpRight className="h-3 w-3" />
              </div>
            </div>
            
            <div className="space-y-1">
              <h3 className="text-2xl font-black tracking-tight text-foreground tabular-nums">
                {stat.value}
              </h3>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-tight">
                {stat.label}
              </p>
            </div>

            <div className="mt-4 pt-4 border-t border-neutral-50 dark:border-neutral-800">
              <p className="text-xs text-muted-foreground/80 font-medium italic">
                {stat.description}
              </p>
            </div>
          </div>
          
          {/* Decorative element */}
          <div className={cn(
            "absolute -right-4 -bottom-4 h-24 w-24 rounded-full opacity-[0.03] group-hover:opacity-[0.06] transition-opacity",
            stat.bg
          )} />
        </Card>
      ))}
    </div>
  );
}
