"use client";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { useMemo } from "react";

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export interface ProjectUnit {
  id: string;
  name: string; // e.g. "A-12"
  block: string;
  floor: number;
  type: string;
  area: number;
  price: number;
  status: "AVAILABLE" | "RESERVED" | "SOLD" | "RENTED" | "BLOCKED";
  linkedClientName?: string;
  linkedClientStage?: string;
}

interface UnitGridProps {
  units: ProjectUnit[];
  onUnitClick: (unit: ProjectUnit) => void;
}

const STATUS_COLORS: Record<string, string> = {
  AVAILABLE: "bg-emerald-500 hover:bg-emerald-600 border-emerald-600",
  RESERVED: "bg-amber-500 hover:bg-amber-600 border-amber-600 animate-pulse",
  SOLD: "bg-rose-500 hover:bg-rose-600 border-rose-600",
  RENTED: "bg-indigo-500 hover:bg-indigo-600 border-indigo-600",
  BLOCKED: "bg-neutral-400 hover:bg-neutral-500 border-neutral-500 opacity-50",
};

const STATUS_LABELS: Record<string, string> = {
  AVAILABLE: "Disponible",
  RESERVED: "Reserve",
  SOLD: "Vendu",
  RENTED: "Loue",
  BLOCKED: "Bloque",
};

export function UnitGrid({ units, onUnitClick }: UnitGridProps) {
  const blocks = Array.from(new Set(units.map((u) => u.block))).sort();

  // Stats per status
  const stats = useMemo(() => {
    const available = units.filter(u => u.status === "AVAILABLE").length;
    const reserved = units.filter(u => u.status === "RESERVED").length;
    const sold = units.filter(u => u.status === "SOLD").length;
    const rented = units.filter(u => u.status === "RENTED").length;
    const blocked = units.filter(u => u.status === "BLOCKED").length;
    return { available, reserved, sold, rented, blocked, total: units.length };
  }, [units]);

  return (
    <div className="space-y-6">
      {/* Stats Bar */}
      <Card className="p-4 rounded-[24px] border-border shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-[10px] font-black uppercase text-muted-foreground tracking-[0.2em]">Plan de Masse</h4>
          <span className="text-[10px] font-bold text-muted-foreground tabular-nums">{stats.total} unites</span>
        </div>
        <div className="h-2.5 w-full bg-accent rounded-full overflow-hidden flex">
          <div className="h-full bg-emerald-500 transition-all duration-700" style={{ width: `${(stats.available / (stats.total || 1)) * 100}%` }} />
          <div className="h-full bg-amber-500 transition-all duration-700" style={{ width: `${(stats.reserved / (stats.total || 1)) * 100}%` }} />
          <div className="h-full bg-rose-500 transition-all duration-700" style={{ width: `${(stats.sold / (stats.total || 1)) * 100}%` }} />
          <div className="h-full bg-indigo-500 transition-all duration-700" style={{ width: `${(stats.rented / (stats.total || 1)) * 100}%` }} />
        </div>
        <div className="flex items-center gap-4 mt-2 flex-wrap">
          <span className="text-[10px] font-bold text-emerald-600">{stats.available} dispo</span>
          <span className="text-[10px] font-bold text-amber-600">{stats.reserved} reserves</span>
          <span className="text-[10px] font-bold text-rose-600">{stats.sold} vendus</span>
          {stats.rented > 0 && <span className="text-[10px] font-bold text-indigo-600">{stats.rented} loues</span>}
          {stats.blocked > 0 && <span className="text-[10px] font-bold text-neutral-500">{stats.blocked} bloques</span>}
        </div>
      </Card>

      {blocks.map((block) => {
        const blockUnits = units.filter((u) => u.block === block);
        const floors = Array.from(new Set(blockUnits.map((u) => u.floor))).sort((a, b) => b - a);
        const blockSold = blockUnits.filter(u => u.status === "SOLD").length;
        const blockRatio = blockUnits.length > 0 ? Math.round((blockSold / blockUnits.length) * 100) : 0;

        return (
          <div key={block} className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-black flex items-center gap-2 text-foreground">
                <span className="p-1 px-2.5 bg-accent/50 border border-border rounded-lg text-sm">Bloc {block}</span>
              </h3>
              <Badge variant="outline" className="text-[10px] font-bold border-border tabular-nums">
                {blockSold}/{blockUnits.length} vendus ({blockRatio}%)
              </Badge>
            </div>

            <Card className="border-border rounded-[24px] p-4 shadow-stripe overflow-x-auto">
              <table className="w-full border-collapse">
                <tbody>
                  {floors.map((floor) => {
                    const floorUnits = blockUnits.filter((u) => u.floor === floor).sort((a, b) => a.name.localeCompare(b.name));

                    return (
                      <tr key={floor} className="border-b last:border-0 border-border">
                        <td className="w-20 py-3 pr-4 align-middle border-r border-border">
                          <div className="text-[10px] font-black uppercase text-muted-foreground text-right w-full tracking-wider">
                            {floor === 0 ? "RDC" : `${floor}e`}
                          </div>
                        </td>
                        <td className="pl-4 py-3">
                          <div className="flex flex-wrap gap-2">
                            <TooltipProvider delay={200}>
                              {floorUnits.map((unit) => (
                                <Tooltip key={unit.id}>
                                  <TooltipTrigger>
                                    <button
                                      onClick={() => onUnitClick(unit)}
                                      className={cn(
                                        "w-[44px] h-[44px] rounded-xl border-b-2 text-white font-black text-xs transition-all hover:-translate-y-1.5 hover:shadow-lg shadow-sm flex items-center justify-center relative",
                                        STATUS_COLORS[unit.status] || STATUS_COLORS.AVAILABLE
                                      )}
                                    >
                                      {unit.name.replace(`${block}-`, '')}
                                      {/* Client indicator dot */}
                                      {unit.linkedClientName && (
                                        <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-white border-2 border-current" />
                                      )}
                                    </button>
                                  </TooltipTrigger>
                                  <TooltipContent side="top" className="p-3 text-sm font-medium space-y-1.5 shadow-xl rounded-xl max-w-[200px]">
                                    <p className="font-black border-b border-border pb-1 mb-1 text-foreground">
                                      {unit.name} ({unit.type})
                                    </p>
                                    <p className="text-xs text-muted-foreground">Surface: {unit.area} m&sup2;</p>
                                    <p className="text-xs text-muted-foreground">Prix: {new Intl.NumberFormat("fr-DZ").format(unit.price)} DA</p>
                                    {unit.linkedClientName && (
                                      <p className="text-xs text-primary font-bold">Client: {unit.linkedClientName}</p>
                                    )}
                                    {unit.linkedClientStage && (
                                      <p className="text-[10px] text-muted-foreground uppercase">Phase: {unit.linkedClientStage}</p>
                                    )}
                                    <Badge variant="secondary" className={cn(
                                      "mt-2 text-[9px] uppercase font-black",
                                      unit.status === "AVAILABLE" && "bg-emerald-500/10 text-emerald-600",
                                      unit.status === "RESERVED" && "bg-amber-500/10 text-amber-600",
                                      unit.status === "SOLD" && "bg-rose-500/10 text-rose-600",
                                    )}>
                                      {STATUS_LABELS[unit.status] || unit.status}
                                    </Badge>
                                  </TooltipContent>
                                </Tooltip>
                              ))}
                            </TooltipProvider>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </Card>
          </div>
        );
      })}

      {/* Legend */}
      <Card className="flex flex-wrap items-center gap-5 p-4 rounded-[24px] border-border shadow-sm">
        <div className="flex items-center gap-2"><div className="w-4 h-4 rounded-lg bg-emerald-500 border-b-2 border-emerald-600" /><span className="text-xs font-bold uppercase text-foreground">Disponible</span></div>
        <div className="flex items-center gap-2"><div className="w-4 h-4 rounded-lg bg-amber-500 border-b-2 border-amber-600" /><span className="text-xs font-bold uppercase text-foreground">Reserve (Option)</span></div>
        <div className="flex items-center gap-2"><div className="w-4 h-4 rounded-lg bg-rose-500 border-b-2 border-rose-600" /><span className="text-xs font-bold uppercase text-foreground">Vendu</span></div>
        <div className="flex items-center gap-2"><div className="w-4 h-4 rounded-lg bg-indigo-500 border-b-2 border-indigo-600" /><span className="text-xs font-bold uppercase text-foreground">Loue</span></div>
        <div className="flex items-center gap-2"><div className="w-4 h-4 rounded-lg bg-neutral-400 border-b-2 border-neutral-500 opacity-50" /><span className="text-xs font-bold uppercase text-foreground">Bloque</span></div>
        <div className="flex items-center gap-2 ml-auto"><div className="w-3 h-3 rounded-full bg-white border-2 border-primary" /><span className="text-[10px] font-bold text-muted-foreground">Client lie</span></div>
      </Card>
    </div>
  );
}
