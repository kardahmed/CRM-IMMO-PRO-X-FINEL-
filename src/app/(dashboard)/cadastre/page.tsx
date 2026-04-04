"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { MapPin, RefreshCw, AlertCircle, Landmark, FileText } from "lucide-react";

interface Property {
  id: string;
  name: string;
  type: string;
  cadastralRef: string | null;
  lotNumber: string | null;
  titleDeedNumber: string | null;
  commune: string | null;
  status: string;
}

export default function CadastrePage() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  async function fetchProperties() {
    setLoading(true);
    setError(false);
    try {
      const res = await fetch("/api/v1/properties");
      if (!res.ok) throw new Error("Failed to fetch");
      const json = await res.json();
      if (json.success) {
        const d = json.data;
        setProperties(Array.isArray(d) ? d : d.properties ?? []);
      } else {
        throw new Error("API error");
      }
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchProperties();
  }, []);

  const propertiesWithCadastral = properties.filter(
    (p) => p.cadastralRef || p.lotNumber || p.titleDeedNumber
  );
  const propertiesWithoutCadastral = properties.filter(
    (p) => !p.cadastralRef && !p.lotNumber && !p.titleDeedNumber
  );

  if (loading) {
    return (
      <div className="space-y-8 animate-pulse">
        <Skeleton className="h-10 w-[300px]" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-[400px] rounded-xl" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
        <AlertCircle className="h-12 w-12 text-red-500" />
        <p className="text-xl font-bold">Impossible de charger les donnees cadastrales</p>
        <Button onClick={fetchProperties} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" /> Reessayer
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-10">
      <header>
        <h1 className="text-3xl font-black tracking-tight text-neutral-900 dark:text-neutral-100 uppercase">
          Cadastre
        </h1>
        <p className="text-muted-foreground mt-1 font-medium">
          Gestion des references cadastrales des biens immobiliers.
        </p>
      </header>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Biens</CardTitle>
            <Landmark className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{properties.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Biens enregistres</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avec Cadastre</CardTitle>
            <FileText className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{propertiesWithCadastral.length}</div>
            <p className="text-xs text-muted-foreground mt-1">References renseignees</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sans Cadastre</CardTitle>
            <MapPin className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{propertiesWithoutCadastral.length}</div>
            <p className="text-xs text-muted-foreground mt-1">A completer</p>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>References cadastrales</CardTitle>
          <Button onClick={fetchProperties} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" /> Actualiser
          </Button>
        </CardHeader>
        <CardContent>
          {properties.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Landmark className="h-12 w-12 mb-4 opacity-40" />
              <p className="text-lg font-medium">Aucun bien enregistre</p>
              <p className="text-sm">Les donnees cadastrales apparaitront ici.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Bien</TableHead>
                  <TableHead>Ref Cadastrale</TableHead>
                  <TableHead>Numero Lot</TableHead>
                  <TableHead>Titre Foncier</TableHead>
                  <TableHead>Commune</TableHead>
                  <TableHead>Statut</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {properties.map((property) => (
                  <TableRow key={property.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{property.name}</p>
                        <p className="text-xs text-muted-foreground">{property.type}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      {property.cadastralRef ? (
                        <span className="font-mono text-sm">{property.cadastralRef}</span>
                      ) : (
                        <span className="text-muted-foreground text-sm">--</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {property.lotNumber ? (
                        <span className="font-mono text-sm">{property.lotNumber}</span>
                      ) : (
                        <span className="text-muted-foreground text-sm">--</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {property.titleDeedNumber ? (
                        <span className="font-mono text-sm">{property.titleDeedNumber}</span>
                      ) : (
                        <span className="text-muted-foreground text-sm">--</span>
                      )}
                    </TableCell>
                    <TableCell>{property.commune || <span className="text-muted-foreground text-sm">--</span>}</TableCell>
                    <TableCell>
                      {property.cadastralRef || property.lotNumber || property.titleDeedNumber ? (
                        <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                          Complet
                        </Badge>
                      ) : (
                        <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400">
                          Incomplet
                        </Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
