"use client";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

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
  status: "AVAILABLE" | "RESERVED" | "SOLD" | "RENTED";
}

interface UnitGridProps {
  units: ProjectUnit[];
  onUnitClick: (unit: ProjectUnit) => void;
}

const STATUS_COLORS = {
  AVAILABLE: "bg-emerald-500 hover:bg-emerald-600 border-emerald-600",
  RESERVED: "bg-amber-500 hover:bg-amber-600 border-amber-600",
  SOLD: "bg-blue-500 hover:bg-blue-600 border-blue-600",
  RENTED: "bg-indigo-500 hover:bg-indigo-600 border-indigo-600",
};

export function UnitGrid({ units, onUnitClick }: UnitGridProps) {
  // Extract unique blocks
  const blocks = Array.from(new Set(units.map((u) => u.block))).sort();

  return (
    <div className="space-y-8">
      {blocks.map((block) => {
        const blockUnits = units.filter((u) => u.block === block);
        // Extract unique floors for this block, sorted descending
        const floors = Array.from(new Set(blockUnits.map((u) => u.floor))).sort((a, b) => b - a);

        return (
          <div key={block} className="space-y-3">
            <h3 className="text-lg font-black flex items-center gap-2 text-foreground">
              <span className="p-1 px-2.5 bg-accent/50 border border-border rounded-lg text-sm">Bloc {block}</span>
            </h3>

            <div className="border border-border rounded-[24px] bg-card p-4 shadow-stripe overflow-x-auto">
              <table className="w-full border-collapse">
                <tbody>
                  {floors.map((floor) => {
                    const floorUnits = blockUnits.filter((u) => u.floor === floor).sort((a, b) => a.name.localeCompare(b.name));

                    return (
                      <tr key={floor} className="border-b last:border-0 border-border">
                        {/* Floor Label */}
                        <td className="w-20 py-3 pr-4 align-middle border-r border-border">
                          <div className="text-[10px] font-black uppercase text-muted-foreground text-right w-full tracking-wider">
                            {floor === 0 ? "RDC" : `${floor}er Etage`}
                          </div>
                        </td>

                        {/* Units */}
                        <td className="pl-4 py-3">
                          <div className="flex flex-wrap gap-2">
                            <TooltipProvider delay={200}>
                              {floorUnits.map((unit) => (
                                <Tooltip key={unit.id}>
                                  <TooltipTrigger>
                                    <button
                                      onClick={() => onUnitClick(unit)}
                                      className={cn(
                                        "w-[42px] h-[42px] rounded-xl border-b-2 text-white font-black text-xs transition-all hover:-translate-y-1 hover:shadow-lg shadow-sm flex items-center justify-center",
                                        STATUS_COLORS[unit.status]
                                      )}
                                    >
                                      {unit.name.replace(`${block}-`, '')}
                                    </button>
                                  </TooltipTrigger>
                                  <TooltipContent side="top" className="p-3 text-sm font-medium space-y-1.5 shadow-xl rounded-xl">
                                    <p className="font-black border-b border-border pb-1 mb-1 text-foreground">
                                      {unit.name} ({unit.type})
                                    </p>
                                    <p className="text-xs text-muted-foreground">Surface: {unit.area} m&sup2;</p>
                                    <p className="text-xs text-muted-foreground">Prix: {new Intl.NumberFormat("fr-DZ").format(unit.price)} DA</p>
                                    <Badge variant="secondary" className="mt-2 text-[9px] uppercase font-black">
                                      {unit.status === "AVAILABLE" && "Disponible"}
                                      {unit.status === "RESERVED" && "Reserve"}
                                      {unit.status === "SOLD" && "Vendu"}
                                      {unit.status === "RENTED" && "Loue"}
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
            </div>
          </div>
        );
      })}

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 p-4 rounded-[24px] bg-card border border-border shadow-sm mt-8">
        <div className="flex items-center gap-2"><div className="w-4 h-4 rounded-lg bg-emerald-500 border-b-2 border-emerald-600" /><span className="text-xs font-bold uppercase text-foreground">Disponible</span></div>
        <div className="flex items-center gap-2"><div className="w-4 h-4 rounded-lg bg-amber-500 border-b-2 border-amber-600" /><span className="text-xs font-bold uppercase text-foreground">Reserve</span></div>
        <div className="flex items-center gap-2"><div className="w-4 h-4 rounded-lg bg-blue-500 border-b-2 border-blue-600" /><span className="text-xs font-bold uppercase text-foreground">Vendu</span></div>
        <div className="flex items-center gap-2"><div className="w-4 h-4 rounded-lg bg-indigo-500 border-b-2 border-indigo-600" /><span className="text-xs font-bold uppercase text-foreground">Loue</span></div>
      </div>
    </div>
  );
}
