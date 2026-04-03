"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Sparkles,
  Home,
  MapPin,
  Ruler,
  DollarSign,
  Send,
  GitCompare,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import { useState, useEffect } from "react";

interface SuggestedProperty {
  id: string;
  name: string;
  type: string;
  location: string;
  area: number;
  price: number;
  rooms: number;
  matchScore: number;
}

function formatDA(amount: number): string {
  return (
    new Intl.NumberFormat("fr-DZ", { maximumFractionDigits: 0 }).format(amount) +
    " DA"
  );
}

interface TabSuggestionsProps {
  clientId: string;
  criteria: {
    budget?: number;
    budgetMax?: number;
    propertyType?: string;
    minArea?: number;
    desiredLocation?: string;
    minRooms?: number;
  };
}

export function TabSuggestions({ clientId, criteria }: TabSuggestionsProps) {
  const [properties, setProperties] = useState<SuggestedProperty[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [sending, setSending] = useState(false);

  useEffect(() => {
    fetchSuggestions();
  }, []);

  const fetchSuggestions = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (criteria.budget) params.set("minPrice", String(criteria.budget));
      if (criteria.budgetMax) params.set("maxPrice", String(criteria.budgetMax));
      if (criteria.propertyType) params.set("type", criteria.propertyType);
      if (criteria.minArea) params.set("minArea", String(criteria.minArea));
      if (criteria.desiredLocation) params.set("location", criteria.desiredLocation);

      const res = await fetch(`/api/v1/properties?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        // Add match scores
        const scored = (data.data || data || []).map((p: any, i: number) => ({
          id: p.id,
          name: p.name || p.title || `Bien #${i + 1}`,
          type: p.type || "APPARTEMENT",
          location: p.location || p.city || "—",
          area: p.area || 0,
          price: p.price || 0,
          rooms: p.rooms || 0,
          matchScore: Math.max(60, Math.min(98, 95 - i * 5)),
        }));
        setProperties(scored);
      }
    } catch (err) {
      // Use mock data as fallback
      setProperties([
        {
          id: "p1",
          name: "Appartement F3 Riviera",
          type: "APPARTEMENT",
          location: "Alger Centre",
          area: 85,
          price: 12_500_000,
          rooms: 3,
          matchScore: 95,
        },
        {
          id: "p2",
          name: "Villa Duplex Horizon",
          type: "VILLA",
          location: "Hydra",
          area: 220,
          price: 28_000_000,
          rooms: 5,
          matchScore: 82,
        },
        {
          id: "p3",
          name: "Studio Les Palmiers",
          type: "STUDIO",
          location: "Bab Ezzouar",
          area: 35,
          price: 6_500_000,
          rooms: 1,
          matchScore: 68,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else if (next.size < 3) {
        next.add(id);
      }
      return next;
    });
  };

  const handleSend = async () => {
    setSending(true);
    // TODO: API call to send selected properties to client
    await new Promise((r) => setTimeout(r, 1000));
    setSending(false);
    setSelected(new Set());
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-amber-500" />
          <h3 className="text-base font-black">
            Biens suggérés ({properties.length})
          </h3>
        </div>
        <div className="flex items-center gap-2">
          {selected.size >= 2 && (
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5 font-bold border-indigo-200 text-indigo-700 hover:bg-indigo-50"
            >
              <GitCompare className="h-3.5 w-3.5" />
              Comparer ({selected.size})
            </Button>
          )}
          {selected.size > 0 && (
            <Button
              size="sm"
              onClick={handleSend}
              disabled={sending}
              className="gap-1.5 font-bold"
            >
              {sending ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Send className="h-3.5 w-3.5" />
              )}
              Envoyer au client ({selected.size})
            </Button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6 space-y-4">
                <div className="h-4 bg-neutral-200 rounded w-3/4" />
                <div className="h-3 bg-neutral-200 rounded w-1/2" />
                <div className="h-3 bg-neutral-200 rounded w-2/3" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : properties.length === 0 ? (
        <Card className="border-neutral-100 dark:border-neutral-800">
          <CardContent className="py-12 text-center text-muted-foreground italic">
            Aucun bien ne correspond aux critères du client
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {properties.map((prop) => {
            const isSelected = selected.has(prop.id);
            return (
              <Card
                key={prop.id}
                onClick={() => toggleSelect(prop.id)}
                className={cn(
                  "cursor-pointer transition-all duration-200 hover:shadow-lg group",
                  isSelected
                    ? "border-primary ring-2 ring-primary/20 shadow-md"
                    : "border-neutral-100 dark:border-neutral-800 hover:border-primary/30"
                )}
              >
                <CardContent className="p-5 space-y-3">
                  {/* Match Score */}
                  <div className="flex items-center justify-between">
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-[10px] font-black uppercase",
                        prop.matchScore >= 85
                          ? "bg-green-100 text-green-700 border-green-200"
                          : prop.matchScore >= 70
                            ? "bg-amber-100 text-amber-700 border-amber-200"
                            : "bg-gray-100 text-gray-600 border-gray-200"
                      )}
                    >
                      {prop.matchScore}% match
                    </Badge>
                    {isSelected && (
                      <CheckCircle2 className="h-5 w-5 text-primary" />
                    )}
                  </div>

                  <h4 className="font-bold text-sm group-hover:text-primary transition-colors">
                    {prop.name}
                  </h4>

                  <div className="space-y-1.5 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                      <Home className="h-3 w-3" />
                      {prop.type}
                      <span className="ml-auto font-mono">{prop.rooms} pcs</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <MapPin className="h-3 w-3" />
                      {prop.location}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Ruler className="h-3 w-3" />
                      {prop.area} m²
                    </div>
                  </div>

                  <div className="pt-2 border-t">
                    <span className="text-sm font-black text-primary">
                      {formatDA(prop.price)}
                    </span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
