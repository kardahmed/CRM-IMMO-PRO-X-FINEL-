"use client";

import { useState } from "react";
import { MapContainer } from "@/components/map/MapContainer";
import { MapFilters, type MapFiltersState } from "@/components/map/MapFilters";
import { MapClientMatcher } from "@/components/map/MapClientMatcher";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { SlidersHorizontal } from "lucide-react";

export default function GeoMapPage() {
  const [filters, setFilters] = useState<MapFiltersState>({
    type: "all",
    minPrice: "",
    maxPrice: "",
    minArea: "",
    maxArea: "",
    rooms: "all",
    status: "all",
    project: "all",
    block: "all",
  });

  const [clientCriteria, setClientCriteria] = useState<Partial<MapFiltersState>>({});
  const [matchedCount, setMatchedCount] = useState(0);
  const [filtersOpen, setFiltersOpen] = useState(false);

  return (
    <div className="flex flex-col h-[calc(100vh-6rem)] gap-4">
      {/* Top Bar Matrix */}
      <div className="flex items-center gap-3">
        <div className="flex-1">
          <MapClientMatcher onMatch={setClientCriteria} matchedCount={matchedCount} />
        </div>
        {/* Mobile filter trigger */}
        <Button
          variant="outline"
          size="sm"
          className="md:hidden shrink-0 gap-2 font-bold"
          onClick={() => setFiltersOpen(true)}
        >
          <SlidersHorizontal className="h-4 w-4" />
          Filtres
        </Button>
      </div>

      <div className="flex flex-1 gap-6 min-h-0">
        {/* Desktop: Filters panel */}
        <div className="w-[300px] shrink-0 h-full overflow-hidden hidden md:block">
          <MapFilters filters={filters} onChange={setFilters} className="h-full" />
        </div>

        {/* Mobile: Filters drawer */}
        <Sheet open={filtersOpen} onOpenChange={setFiltersOpen}>
          <SheetContent side="left" className="w-[320px] p-0 overflow-y-auto">
            <SheetHeader className="p-4 border-b">
              <SheetTitle className="font-black text-lg">Filtres</SheetTitle>
            </SheetHeader>
            <div className="p-4">
              <MapFilters filters={filters} onChange={setFilters} className="h-auto" />
            </div>
          </SheetContent>
        </Sheet>

        {/* Map */}
        <div className="flex-1 h-full rounded-xl overflow-hidden border shadow-sm relative">
          <MapContainer
            filters={filters}
            clientCriteria={clientCriteria}
            onMatchCountUpdate={setMatchedCount}
          />
        </div>
      </div>
    </div>
  );
}
