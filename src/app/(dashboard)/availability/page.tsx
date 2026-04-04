"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Grid3X3, XCircle, Loader2, Search } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface Property {
  id: string;
  name: string;
  type: string;
  floor: number | null;
  surface: number | null;
  price: number | null;
  status: string;
  project?: {
    id: string;
    name: string;
  } | null;
}

// ---------------------------------------------------------------------------
// Status config
// ---------------------------------------------------------------------------
const STATUS_META: Record<
  string,
  { label: string; bg: string; text: string }
> = {
  AVAILABLE: {
    label: "Disponible",
    bg: "bg-green-50 dark:bg-green-950/30",
    text: "text-green-700 dark:text-green-400",
  },
  RESERVED: {
    label: "Reserve",
    bg: "bg-amber-50 dark:bg-amber-950/30",
    text: "text-amber-700 dark:text-amber-400",
  },
  SOLD: {
    label: "Vendu",
    bg: "bg-red-50 dark:bg-red-950/30",
    text: "text-red-700 dark:text-red-400",
  },
};

const STATUS_BADGE: Record<string, string> = {
  AVAILABLE: "bg-green-500/15 text-green-700",
  RESERVED: "bg-amber-500/15 text-amber-700",
  SOLD: "bg-red-500/15 text-red-700",
};

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
export default function AvailabilityPage() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const fetchProperties = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/v1/properties");
      const json = await res.json();
      if (json.success) {
        setProperties(json.data);
      } else {
        setError(json.error ?? "Erreur lors du chargement des biens");
      }
    } catch {
      setError("Impossible de contacter le serveur");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProperties();
  }, [fetchProperties]);

  // -------------------------------------------------------------------------
  // Filter & group
  // -------------------------------------------------------------------------
  const filtered = useMemo(() => {
    if (!search.trim()) return properties;
    const q = search.toLowerCase();
    return properties.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.type.toLowerCase().includes(q) ||
        (p.project?.name ?? "").toLowerCase().includes(q)
    );
  }, [properties, search]);

  const grouped = useMemo(() => {
    const map = new Map<string, { projectName: string; items: Property[] }>();
    for (const p of filtered) {
      const key = p.project?.id ?? "__no_project__";
      const projectName = p.project?.name ?? "Sans projet";
      if (!map.has(key)) {
        map.set(key, { projectName, items: [] });
      }
      map.get(key)!.items.push(p);
    }
    return Array.from(map.values());
  }, [filtered]);

  // -------------------------------------------------------------------------
  // Helpers
  // -------------------------------------------------------------------------
  const formatPrice = (price: number | null): string => {
    if (price == null) return "-";
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "DZD",
      maximumFractionDigits: 0,
    }).format(price);
  };

  const formatSurface = (surface: number | null): string => {
    if (surface == null) return "-";
    return `${surface} m\u00B2`;
  };

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------
  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
          <Grid3X3 className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-2xl font-black tracking-tight uppercase">
            Grille de disponibilite
          </h1>
          <p className="text-sm text-muted-foreground font-medium">
            Consultez la disponibilite des biens par programme
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Rechercher un bien, type ou projet..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Loading state */}
      {loading && (
        <Card>
          <CardContent className="space-y-3 py-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </CardContent>
        </Card>
      )}

      {/* Error state */}
      {!loading && error && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 gap-3 text-muted-foreground">
            <XCircle className="h-10 w-10 text-red-400" />
            <p>{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Empty state */}
      {!loading && !error && filtered.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 gap-3 text-muted-foreground">
            <Grid3X3 className="h-10 w-10" />
            <p>
              {properties.length === 0
                ? "Aucun bien enregistre"
                : "Aucun bien ne correspond a votre recherche"}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Grouped tables */}
      {!loading &&
        !error &&
        grouped.map((group) => (
          <Card key={group.projectName}>
            <CardHeader>
              <CardTitle className="text-base">{group.projectName}</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Bien</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead className="text-center">Etage</TableHead>
                    <TableHead className="text-right">Surface</TableHead>
                    <TableHead className="text-right">Prix</TableHead>
                    <TableHead className="text-center">Statut</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {group.items.map((property) => {
                    const statusMeta = STATUS_META[property.status];
                    const badgeColor =
                      STATUS_BADGE[property.status] ??
                      "bg-muted text-muted-foreground";
                    const rowBg = statusMeta?.bg ?? "";

                    return (
                      <TableRow key={property.id} className={rowBg}>
                        <TableCell className="font-medium">
                          {property.name}
                        </TableCell>
                        <TableCell>{property.type}</TableCell>
                        <TableCell className="text-center">
                          {property.floor != null ? property.floor : "-"}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatSurface(property.surface)}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatPrice(property.price)}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge
                            variant="secondary"
                            className={badgeColor}
                          >
                            {statusMeta?.label ?? property.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        ))}

      {/* Summary */}
      {!loading && !error && properties.length > 0 && (
        <div className="flex flex-wrap gap-3">
          {(["AVAILABLE", "RESERVED", "SOLD"] as const).map((status) => {
            const count = properties.filter((p) => p.status === status).length;
            const meta = STATUS_META[status];
            const badgeColor = STATUS_BADGE[status];
            return (
              <Badge key={status} variant="secondary" className={badgeColor}>
                {meta.label} : {count}
              </Badge>
            );
          })}
          <Badge variant="outline">Total : {properties.length}</Badge>
        </div>
      )}
    </div>
  );
}
