"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  MapPin,
  Building,
  Home,
  Eye,
  LayoutGrid,
  MoreVertical,
  Calendar,
  DollarSign,
  Pencil,
  Trash2,
  Copy,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ProjectCardProps {
  id: string;
  code: string;
  name: string;
  location: string;
  status: string;
  deliveryDate: string | null;
  totalUnits: number;
  soldUnits: number;
  reservedUnits: number;
  availableUnits: number;
  averagePrice: number;
  progress: number;
  onViewUnits?: (id: string) => void;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
}

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  PLANNING: { label: "Planification", className: "bg-blue-100 text-blue-700 border-blue-200" },
  IN_PROGRESS: { label: "Active", className: "bg-emerald-100 text-emerald-700 border-emerald-200" },
  DELIVERED: { label: "Livre", className: "bg-gray-100 text-gray-700 border-gray-200" },
  CANCELLED: { label: "Annule", className: "bg-red-100 text-red-700 border-red-200" },
};

function formatPrice(price: number): string {
  if (price >= 1_000_000) return `${(price / 1_000_000).toFixed(1)} M DA`;
  if (price >= 1_000) return `${(price / 1_000).toFixed(0)} K DA`;
  return `${price} DA`;
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "Non definie";
  const d = new Date(dateStr);
  return d.toLocaleDateString("fr-FR", { month: "short", year: "numeric" });
}

export function ProjectCard({
  id,
  code,
  name,
  location,
  status,
  deliveryDate,
  totalUnits,
  soldUnits,
  reservedUnits,
  availableUnits,
  averagePrice,
  progress,
  onViewUnits,
  onEdit,
  onDelete,
}: ProjectCardProps) {
  const sc = STATUS_CONFIG[status] || STATUS_CONFIG.IN_PROGRESS;
  const sellRatio = totalUnits > 0 ? Math.round((soldUnits / totalUnits) * 100) : 0;

  return (
    <Card className="overflow-hidden group hover:shadow-lg transition-all hover:-translate-y-0.5 border relative">
      {/* 3-dot menu */}
      <div className="absolute top-3 right-3 z-20">
        <DropdownMenu>
          <DropdownMenuTrigger className="h-8 w-8 rounded-lg bg-white/90 dark:bg-neutral-800/90 backdrop-blur-sm border shadow-sm flex items-center justify-center hover:bg-white transition-colors">
            <MoreVertical className="h-4 w-4 text-muted-foreground" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" side="bottom" sideOffset={4}>
            <DropdownMenuItem onClick={() => onEdit?.(id)} className="gap-2 text-sm font-medium">
              <Pencil className="h-3.5 w-3.5" /> Modifier
            </DropdownMenuItem>
            <DropdownMenuItem className="gap-2 text-sm font-medium">
              <Copy className="h-3.5 w-3.5" /> Dupliquer
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => onDelete?.(id)}
              className="gap-2 text-sm font-medium text-red-600"
              variant="destructive"
            >
              <Trash2 className="h-3.5 w-3.5" /> Supprimer
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <CardContent className="p-5 space-y-4">
        {/* Header: Badge + Code */}
        <div className="flex items-start justify-between pr-8">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <Badge className={cn("text-[10px] font-black uppercase border", sc.className)}>
                {sc.label}
              </Badge>
              <span className="text-[10px] font-mono font-bold text-muted-foreground uppercase">
                {code}
              </span>
            </div>
            <h3 className="text-base font-black leading-tight">{name}</h3>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <MapPin className="h-3 w-3 shrink-0" /> {location}
            </p>
          </div>
        </div>

        {/* Info Row: Prix moyen + Livraison */}
        <div className="grid grid-cols-2 gap-3">
          <div className="flex items-center gap-2 p-2.5 rounded-lg bg-accent/30 border">
            <DollarSign className="h-4 w-4 text-emerald-600 shrink-0" />
            <div>
              <p className="text-[9px] font-bold uppercase text-muted-foreground">Prix moy./unite</p>
              <p className="text-xs font-black text-emerald-700">
                {averagePrice > 0 ? formatPrice(averagePrice) : "N/A"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 p-2.5 rounded-lg bg-accent/30 border">
            <Calendar className="h-4 w-4 text-blue-600 shrink-0" />
            <div>
              <p className="text-[9px] font-bold uppercase text-muted-foreground">Livraison</p>
              <p className="text-xs font-black text-blue-700">{formatDate(deliveryDate)}</p>
            </div>
          </div>
        </div>

        {/* Stats: VENDUES / DISPO / TOTAL */}
        <div className="grid grid-cols-3 gap-2">
          <div className="text-center p-2 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-100 dark:border-red-900">
            <p className="text-[9px] font-black uppercase text-red-600">Vendues</p>
            <p className="text-lg font-black text-red-700">{soldUnits}</p>
          </div>
          <div className="text-center p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900">
            <p className="text-[9px] font-black uppercase text-emerald-600">Dispo</p>
            <p className="text-lg font-black text-emerald-700">{availableUnits}</p>
          </div>
          <div className="text-center p-2 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900">
            <p className="text-[9px] font-black uppercase text-blue-600">Total</p>
            <p className="text-lg font-black text-blue-700">{totalUnits}</p>
          </div>
        </div>

        {/* Progress: % vendues */}
        <div>
          <div className="flex justify-between text-xs font-bold mb-1.5">
            <span className="text-muted-foreground text-[10px] uppercase">Vendues</span>
            <span className="text-emerald-700">{sellRatio}%</span>
          </div>
          <Progress
            value={sellRatio}
            className="h-2 bg-neutral-200 dark:bg-neutral-800 [&_[data-slot=progress-indicator]]:bg-emerald-500"
          />
        </div>

        {/* 2 Buttons */}
        <div className="grid grid-cols-2 gap-2 pt-1">
          <Link
            href={`/projects/${id}`}
            className="flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-bold rounded-lg border hover:bg-accent/50 transition-colors"
          >
            <Eye className="h-3.5 w-3.5" /> Voir details
          </Link>
          <button
            onClick={() => onViewUnits?.(id)}
            className="flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-bold rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition-colors"
          >
            <LayoutGrid className="h-3.5 w-3.5" /> Voir unites
          </button>
        </div>
      </CardContent>
    </Card>
  );
}
