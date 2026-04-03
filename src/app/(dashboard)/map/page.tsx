"use client";

import { useState } from "react";
import { MapContainer } from "@/components/map/MapContainer";
import { MapFilters, type MapFiltersState } from "@/components/map/MapFilters";
import { MapClientMatcher } from "@/components/map/MapClientMatcher";

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

  return (
    <div className="flex flex-col h-[calc(100vh-6rem)] gap-4">
      {/* Top Bar Matrix */}
      <MapClientMatcher onMatch={setClientCriteria} matchedCount={matchedCount} />

      <div className="flex flex-1 gap-6 min-h-0">
        {/* Left: Filters */}
        <div className="w-[300px] shrink-0 h-full overflow-hidden">
          <MapFilters filters={filters} onChange={setFilters} className="h-full" />
        </div>

        {/* Right: Map */}
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
