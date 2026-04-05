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
  AVAILABLE: "bg-green-500 hover:bg-green-600 border-green-600",
  RESERVED: "bg-orange-400 hover:bg-orange-500 border-orange-500",
  SOLD: "bg-red-500 hover:bg-red-600 border-red-600",
  RENTED: "bg-blue-500 hover:bg-blue-600 border-blue-600",
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
            <h3 className="text-lg font-black flex items-center gap-2">
              <span className="p-1 px-2.5 bg-accent/50 border rounded-lg text-sm">Bloc {block}</span>
            </h3>

            <div className="border rounded-xl bg-white dark:bg-neutral-900 p-4 shadow-sm overflow-x-auto">
              <table className="w-full border-collapse">
                <tbody>
                  {floors.map((floor) => {
                    const floorUnits = blockUnits.filter((u) => u.floor === floor).sort((a, b) => a.name.localeCompare(b.name));
                    
                    return (
                      <tr key={floor} className="border-b last:border-0 border-neutral-100 dark:border-neutral-800">
                        {/* Floor Label */}
                        <td className="w-20 py-3 pr-4 align-middle border-r border-neutral-100 dark:border-neutral-800">
                          <div className="text-xs font-black uppercase text-muted-foreground text-right w-full">
                            {floor === 0 ? "RDC" : `${floor}er Étage`}
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
                                        "w-[42px] h-[42px] rounded-lg border-b-2 text-white font-black text-xs transition-transform hover:-translate-y-1 shadow-sm flex items-center justify-center",
                                        STATUS_COLORS[unit.status]
                                      )}
                                    >
                                      {unit.name.replace(`${block}-`, '')}
                                    </button>
                                  </TooltipTrigger>
                                  <TooltipContent side="top" className="p-3 text-sm font-medium space-y-1.5 shadow-xl">
                                    <p className="font-black border-b border-white/20 pb-1 mb-1">
                                      {unit.name} ({unit.type})
                                    </p>
                                    <p className="text-xs">Surface: {unit.area} m²</p>
                                    <p className="text-xs">Prix: {new Intl.NumberFormat("fr-DZ").format(unit.price)} DA</p>
                                    <Badge variant="secondary" className="mt-2 text-xs uppercase font-black">
                                      {unit.status === "AVAILABLE" && "Disponible"}
                                      {unit.status === "RESERVED" && "Réservé"}
                                      {unit.status === "SOLD" && "Vendu"}
                                      {unit.status === "RENTED" && "Loué"}
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
      <div className="flex flex-wrap items-center gap-4 p-4 rounded-xl bg-accent/30 border mt-8">
        <div className="flex items-center gap-2"><div className="w-4 h-4 rounded bg-green-500 border-b-2 border-green-600" /><span className="text-xs font-bold uppercase">Disponible</span></div>
        <div className="flex items-center gap-2"><div className="w-4 h-4 rounded bg-orange-400 border-b-2 border-orange-500" /><span className="text-xs font-bold uppercase">Réservé</span></div>
        <div className="flex items-center gap-2"><div className="w-4 h-4 rounded bg-red-500 border-b-2 border-red-600" /><span className="text-xs font-bold uppercase">Vendu</span></div>
        <div className="flex items-center gap-2"><div className="w-4 h-4 rounded bg-blue-500 border-b-2 border-blue-600" /><span className="text-xs font-bold uppercase">Loué</span></div>
      </div>
    </div>
  );
}
