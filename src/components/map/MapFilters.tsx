"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Filter, Home, DollarSign, Ruler, Layers } from "lucide-react";
import { useState } from "react";

export interface MapFiltersState {
  type: string;
  minPrice: string;
  maxPrice: string;
  minArea: string;
  maxArea: string;
  rooms: string;
  status: string;
  project: string;
  block: string;
}

interface MapFiltersProps {
  filters: MapFiltersState;
  onChange: (f: MapFiltersState) => void;
  className?: string;
}

export function MapFilters({ filters, onChange, className }: MapFiltersProps) {
  const update = (key: keyof MapFiltersState, value: string) => {
    onChange({ ...filters, [key]: value });
  };

  const reset = () => {
    onChange({
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
  };

  return (
    <Card className={className}>
      <CardHeader className="py-4 border-b">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-black flex items-center gap-2">
            <Filter className="h-4 w-4 text-primary" />
            Filtres de recherche
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={reset} className="h-6 text-[10px] uppercase font-bold text-muted-foreground">
            Réinitialiser
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="p-4 space-y-6 overflow-y-auto max-h-[calc(100vh-250px)]">
        {/* Typologie */}
        <div className="space-y-3">
          <h4 className="text-xs font-black uppercase text-muted-foreground flex items-center gap-1.5">
            <Home className="h-3.5 w-3.5" /> Typologie
          </h4>
          <div className="space-y-2">
            <Select value={filters.type} onValueChange={(v: string | null) => update("type", v ?? "all")}>
              <SelectTrigger className="text-sm">
                <SelectValue placeholder="Type de bien" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les types</SelectItem>
                <SelectItem value="APPARTEMENT">Appartement</SelectItem>
                <SelectItem value="VILLA">Villa</SelectItem>
                <SelectItem value="STUDIO">Studio</SelectItem>
                <SelectItem value="LOCAL">Local commercial</SelectItem>
                <SelectItem value="TERRAIN">Terrain</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex items-center gap-2">
              <Select value={filters.rooms} onValueChange={(v: string | null) => update("rooms", v ?? "all")}>
                <SelectTrigger className="text-sm">
                  <SelectValue placeholder="Pièces" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Nb. Pièces</SelectItem>
                  <SelectItem value="1">F1</SelectItem>
                  <SelectItem value="2">F2</SelectItem>
                  <SelectItem value="3">F3</SelectItem>
                  <SelectItem value="4">F4</SelectItem>
                  <SelectItem value="5">F5+</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Budget & Surface */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-black uppercase text-muted-foreground flex items-center gap-1.5">
              <DollarSign className="h-3.5 w-3.5" /> Budget (DA)
            </h4>
          </div>
          <div className="flex items-center gap-2">
            <Input 
              type="number" 
              placeholder="Min" 
              value={filters.minPrice} 
              onChange={(e) => update("minPrice", e.target.value)} 
              className="text-sm h-9"
            />
            <span className="text-muted-foreground">-</span>
            <Input 
              type="number" 
              placeholder="Max" 
              value={filters.maxPrice} 
              onChange={(e) => update("maxPrice", e.target.value)} 
              className="text-sm h-9"
            />
          </div>

          <h4 className="text-xs font-black uppercase text-muted-foreground flex items-center gap-1.5 mt-4">
            <Ruler className="h-3.5 w-3.5" /> Superficie (m²)
          </h4>
          <div className="flex items-center gap-2">
            <Input 
              type="number" 
              placeholder="Min" 
              value={filters.minArea} 
              onChange={(e) => update("minArea", e.target.value)} 
              className="text-sm h-9"
            />
            <span className="text-muted-foreground">-</span>
            <Input 
              type="number" 
              placeholder="Max" 
              value={filters.maxArea} 
              onChange={(e) => update("maxArea", e.target.value)} 
              className="text-sm h-9"
            />
          </div>
        </div>

        {/* Promotion */}
        <div className="space-y-3 pt-4 border-t">
          <h4 className="text-xs font-black uppercase text-muted-foreground flex items-center gap-1.5">
            <Layers className="h-3.5 w-3.5" /> Promotion & Projets
          </h4>
          <div className="space-y-2">
            <Select value={filters.project} onValueChange={(v: string | null) => update("project", v ?? "all")}>
              <SelectTrigger className="text-sm">
                <SelectValue placeholder="Projet" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les projets</SelectItem>
                <SelectItem value="residence-riviera">Résidence Riviera</SelectItem>
                <SelectItem value="horizon-bay">Horizon Bay</SelectItem>
                <SelectItem value="les-palmiers">Les Palmiers</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filters.status} onValueChange={(v: string | null) => update("status", v ?? "all")}>
              <SelectTrigger className="text-sm">
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="AVAILABLE">Disponible (Vert)</SelectItem>
                <SelectItem value="RESERVED">Réservé (Orange)</SelectItem>
                <SelectItem value="SOLD">Vendu (Rouge)</SelectItem>
                <SelectItem value="RENTED">Loué (Bleu)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

      </CardContent>
    </Card>
  );
}
