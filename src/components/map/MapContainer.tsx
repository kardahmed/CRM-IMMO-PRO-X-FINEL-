"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { GoogleMap, useJsApiLoader, Marker, InfoWindow, MarkerClusterer } from "@react-google-maps/api";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Home, Ruler, Send, CalendarPlus, Layers } from "lucide-react";
import Image from "next/image";
import type { MapFiltersState } from "./MapFilters";
import { cn } from "@/lib/utils";

const containerStyle = {
  width: "100%",
  height: "100%",
};

const center = {
  lat: 36.7538, // Alger
  lng: 3.0588,
};

export interface MapProperty {
  id: string;
  name: string;
  type: string;
  lat: number;
  lng: number;
  status: "AVAILABLE" | "RESERVED" | "SOLD" | "RENTED";
  price: number;
  area: number;
  rooms: number;
  project: string;
  block: string;
  imageUrl: string;
}

const PIN_COLORS = {
  AVAILABLE: "#22c55e", // green-500
  RESERVED: "#f97316",  // orange-500
  SOLD: "#ef4444",      // red-500
  RENTED: "#3b82f6",    // blue-500
};

interface MapContainerProps {
  filters: MapFiltersState;
  clientCriteria: Partial<MapFiltersState>;
  onMatchCountUpdate: (count: number) => void;
}

export function MapContainer({ filters, clientCriteria, onMatchCountUpdate }: MapContainerProps) {
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "dummy",
  });

  const [, setMap] = useState<google.maps.Map | null>(null);
  const [selectedProp, setSelectedProp] = useState<MapProperty | null>(null);
  const [properties, setProperties] = useState<MapProperty[]>([]);

  useEffect(() => {
    async function fetchProperties() {
      try {
        const res = await fetch("/api/v1/properties?limit=200");
        if (!res.ok) return;
        const json = await res.json();
        if (!json.success) return;
        const items = (json.data ?? json.properties ?? []) as Array<Record<string, unknown>>;
        setProperties(
          items
            .filter((p) => p.latitude != null && p.longitude != null)
            .map((p) => ({
              id: p.id as string,
              name: (p.name as string) || "Bien",
              type: (p.type as string) || "APARTMENT",
              lat: p.latitude as number,
              lng: p.longitude as number,
              status: (p.status as MapProperty["status"]) || "AVAILABLE",
              price: Number(p.price) || 0,
              area: (p.surface as number) || 0,
              rooms: (p.rooms as number) || 0,
              project: (p.projectId as string) || "",
              block: "",
              imageUrl: ((p.images as string[]) ?? [])[0] || "",
            })),
        );
      } catch {
        // Silently fail — map will be empty
      }
    }
    fetchProperties();
  }, []);

  const onLoad = useCallback(function callback(map: google.maps.Map) {
    setMap(map);
  }, []);

  const onUnmount = useCallback(function callback() {
    setMap(null);
  }, []);

  // Compute matched items
  const propertiesWithMatch = useMemo(() => {
    let matchedItems = 0;

    const result = properties.map((prop) => {
      let isVisible = true;
      let isDimmed = false;

      // 1. Hard filters (Hide from map)
      if (filters.type !== "all" && prop.type !== filters.type) isVisible = false;
      if (filters.status !== "all" && prop.status !== filters.status) isVisible = false;
      if (filters.project !== "all" && prop.project !== filters.project) isVisible = false;
      
      const minP = parseFloat(filters.minPrice);
      const maxP = parseFloat(filters.maxPrice);
      if (!isNaN(minP) && prop.price < minP) isVisible = false;
      if (!isNaN(maxP) && prop.price > maxP) isVisible = false;

      const minA = parseFloat(filters.minArea);
      const maxA = parseFloat(filters.maxArea);
      if (!isNaN(minA) && prop.area < minA) isVisible = false;
      if (!isNaN(maxA) && prop.area > maxA) isVisible = false;

      if (filters.rooms !== "all" && prop.rooms !== parseInt(filters.rooms)) {
        if (filters.rooms === "5" && prop.rooms >= 5) { /* ok */ }
        else isVisible = false;
      }

      // 2. Client Matcher filters (Dim instead of hide)
      if (isVisible && Object.keys(clientCriteria).length > 0) {
        if (clientCriteria.type && prop.type !== clientCriteria.type) isDimmed = true;
        
        if (clientCriteria.minPrice && prop.price < parseFloat(clientCriteria.minPrice)) isDimmed = true;
        if (clientCriteria.maxPrice && prop.price > parseFloat(clientCriteria.maxPrice)) isDimmed = true;
        
        if (clientCriteria.minArea && prop.area < parseFloat(clientCriteria.minArea)) isDimmed = true;
        if (clientCriteria.rooms) {
          if (clientCriteria.rooms === "5" && prop.rooms < 5) isDimmed = true;
          else if (clientCriteria.rooms !== "5" && prop.rooms !== parseInt(clientCriteria.rooms)) isDimmed = true;
        }
      }

      if (isVisible && !isDimmed && prop.status === "AVAILABLE") {
        matchedItems++;
      }

      return { prop, isVisible, isDimmed };
    });

    onMatchCountUpdate(matchedItems);
    return result;
  }, [properties, filters, clientCriteria, onMatchCountUpdate]);

  if (!isLoaded) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-neutral-100 dark:bg-neutral-900 animate-pulse rounded-xl border">
        <p className="text-muted-foreground font-bold">Chargement de la carte...</p>
      </div>
    );
  }

  // Create SVG Marker inline
  const getMarkerIcon = (status: keyof typeof PIN_COLORS, isDimmed: boolean) => {
    const color = PIN_COLORS[status];
    const opacity = isDimmed ? 0.3 : 1;
    // URL encoded SVG
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="${color}" fill-opacity="${opacity}" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3" fill="white"></circle></svg>`;
    return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
  };

  return (
    <GoogleMap
      mapContainerStyle={containerStyle}
      center={center}
      zoom={12}
      onLoad={onLoad}
      onUnmount={onUnmount}
      options={{
        disableDefaultUI: true,
        zoomControl: true,
        mapTypeControl: false,
        streetViewControl: false,
        styles: [
          // Light clean style
          { featureType: "poi", stylers: [{ visibility: "off" }] },
        ]
      }}
      onClick={() => setSelectedProp(null)}
    >
      <MarkerClusterer
        options={{
          imagePath: "https://developers.google.com/maps/documentation/javascript/examples/markerclusterer/m",
        }}
      >
        {(clusterer) => (
          <>
            {propertiesWithMatch.map(({ prop, isVisible, isDimmed }) => {
              if (!isVisible) return null;
              return (
                <Marker
                  key={prop.id}
                  position={{ lat: prop.lat, lng: prop.lng }}
                  clusterer={clusterer}
                  icon={getMarkerIcon(prop.status, isDimmed)}
                  onClick={() => setSelectedProp(prop)}
                  zIndex={isDimmed ? 1 : 100}
                />
              );
            })}
          </>
        )}
      </MarkerClusterer>

      {selectedProp && (
        <InfoWindow
          position={{ lat: selectedProp.lat, lng: selectedProp.lng }}
          onCloseClick={() => setSelectedProp(null)}
          options={{
            pixelOffset: new window.google.maps.Size(0, -35),
            disableAutoPan: false,
          }}
        >
          <Card className="w-[300px] border-none shadow-none m--2">
            <div className="relative h-[140px] w-full">
              <Image src={selectedProp.imageUrl} alt={selectedProp.name} className="w-full h-full object-cover rounded-t-xl" width={300} height={140} />
              <div className="absolute top-2 right-2">
                <Badge className={cn("text-[10px] font-black uppercase text-white shadow-sm border-none")} style={{ backgroundColor: PIN_COLORS[selectedProp.status] }}>
                  {selectedProp.status === "AVAILABLE" && "Disponible"}
                  {selectedProp.status === "RESERVED" && "Réservé"}
                  {selectedProp.status === "SOLD" && "Vendu"}
                  {selectedProp.status === "RENTED" && "Loué"}
                </Badge>
              </div>
            </div>
            <CardContent className="p-4 space-y-3">
              <h4 className="font-black text-sm">{selectedProp.name}</h4>
              
              <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><Home className="h-3 w-3" /> {selectedProp.type}</span>
                <span className="flex items-center gap-1"><Ruler className="h-3 w-3" /> {selectedProp.area} m²</span>
                {selectedProp.rooms > 0 && <span className="flex items-center gap-1"><Layers className="h-3 w-3" /> {selectedProp.rooms} pcs</span>}
              </div>

              <div className="pt-2 border-t flex items-center justify-between">
                <span className="text-primary font-black text-base">{new Intl.NumberFormat("fr-DZ").format(selectedProp.price)} DA</span>
              </div>

              <div className="flex flex-col gap-2 pt-2">
                <Button size="sm" className="w-full font-bold gap-1.5"><Home className="h-3.5 w-3.5" /> Fiche Bien</Button>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" className="flex-1 font-bold gap-1"><Send className="h-3 w-3" /> Envoyer</Button>
                  <Button size="sm" variant="outline" className="flex-1 font-bold gap-1"><CalendarPlus className="h-3 w-3" /> Visite</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </InfoWindow>
      )}
    </GoogleMap>
  );
}


