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
          className="relative overflow-hidden bg-card border-border shadow-stripe hover:shadow-stripe-lg hover:-translate-y-1 transition-all duration-500 rounded-[24px] group"
        >
          <div className="p-5">
            <div className="flex items-center justify-between mb-4">
              <div className={cn("p-3 rounded-2xl border transition-all duration-500 group-hover:scale-110 group-hover:rotate-3 shadow-sm", stat.bg, stat.color)}>
                <stat.icon className="h-5 w-5" />
              </div>
              <div className="flex items-center gap-1 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                Direct <ArrowUpRight className="h-3 w-3" />
              </div>
            </div>

            <div className="space-y-1">
              <h3 className="text-2xl font-black tracking-tighter text-foreground tabular-nums">
                {stat.value}
              </h3>
              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">
                {stat.label}
              </p>
            </div>

            <div className="mt-4 pt-3 border-t border-border/50">
              <p className="text-[10px] text-muted-foreground/60 font-medium">
                {stat.description}
              </p>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
