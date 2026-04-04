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
import {
  Home,
  RefreshCw,
  AlertCircle,
  ArrowUpRight,
  Key,
  DollarSign,
  Building2,
} from "lucide-react";

interface Property {
  id: string;
  name: string;
  type: string;
  transactionType: "SALE" | "RENT";
  price: number;
  status: string;
  address?: string;
}

const formatAmount = (amount: number) =>
  new Intl.NumberFormat("fr-DZ", {
    style: "currency",
    currency: "DZD",
    minimumFractionDigits: 0,
  }).format(amount);

const statusConfig: Record<string, { label: string; className: string }> = {
  AVAILABLE: {
    label: "Disponible",
    className:
      "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  },
  RESERVED: {
    label: "Reserve",
    className:
      "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
  },
  SOLD: {
    label: "Vendu",
    className:
      "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  },
  RENTED: {
    label: "Loue",
    className:
      "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
  },
};

export default function TransactionTypePage() {
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
        setProperties(json.data);
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

  const saleProperties = properties.filter(
    (p) => p.transactionType === "SALE"
  );
  const rentProperties = properties.filter(
    (p) => p.transactionType === "RENT"
  );
  const totalSaleAmount = saleProperties.reduce((sum, p) => sum + p.price, 0);
  const totalRentAmount = rentProperties.reduce((sum, p) => sum + p.price, 0);

  if (loading) {
    return (
      <div className="space-y-8 animate-pulse">
        <Skeleton className="h-10 w-[350px]" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-[300px] rounded-xl" />
        <Skeleton className="h-[300px] rounded-xl" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
        <AlertCircle className="h-12 w-12 text-red-500" />
        <p className="text-xl font-bold">
          Impossible de charger les biens
        </p>
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
          Types de Transaction
        </h1>
        <p className="text-muted-foreground mt-1 font-medium">
          Biens immobiliers classes par type de transaction.
        </p>
      </header>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Vente</CardTitle>
            <ArrowUpRight className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{saleProperties.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Biens en vente
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Location
            </CardTitle>
            <Key className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{rentProperties.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Biens en location
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Montant total
            </CardTitle>
            <DollarSign className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatAmount(totalSaleAmount + totalRentAmount)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Valeur du portefeuille
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Vente Section */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <ArrowUpRight className="h-5 w-5 text-blue-500" />
            Vente
            <Badge variant="secondary">{saleProperties.length}</Badge>
          </CardTitle>
          <Button onClick={fetchProperties} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" /> Actualiser
          </Button>
        </CardHeader>
        <CardContent>
          {saleProperties.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Building2 className="h-12 w-12 mb-4 opacity-40" />
              <p className="text-lg font-medium">Aucun bien en vente</p>
              <p className="text-sm">
                Les biens en vente apparaitront dans cette section.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Bien</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Prix</TableHead>
                  <TableHead>Statut</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {saleProperties.map((property) => (
                  <TableRow key={property.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{property.name}</p>
                        {property.address && (
                          <p className="text-xs text-muted-foreground">
                            {property.address}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        <Home className="h-3 w-3 text-muted-foreground" />
                        <span>{property.type}</span>
                      </div>
                    </TableCell>
                    <TableCell className="font-semibold">
                      {formatAmount(property.price)}
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={
                          statusConfig[property.status]?.className ??
                          "bg-neutral-100 text-neutral-800 dark:bg-neutral-800 dark:text-neutral-300"
                        }
                      >
                        {statusConfig[property.status]?.label ??
                          property.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Location Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5 text-purple-500" />
            Location
            <Badge variant="secondary">{rentProperties.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {rentProperties.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Building2 className="h-12 w-12 mb-4 opacity-40" />
              <p className="text-lg font-medium">Aucun bien en location</p>
              <p className="text-sm">
                Les biens en location apparaitront dans cette section.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Bien</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Loyer</TableHead>
                  <TableHead>Statut</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rentProperties.map((property) => (
                  <TableRow key={property.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{property.name}</p>
                        {property.address && (
                          <p className="text-xs text-muted-foreground">
                            {property.address}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        <Home className="h-3 w-3 text-muted-foreground" />
                        <span>{property.type}</span>
                      </div>
                    </TableCell>
                    <TableCell className="font-semibold">
                      {formatAmount(property.price)}
                      <span className="text-xs text-muted-foreground font-normal">
                        /mois
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={
                          statusConfig[property.status]?.className ??
                          "bg-neutral-100 text-neutral-800 dark:bg-neutral-800 dark:text-neutral-300"
                        }
                      >
                        {statusConfig[property.status]?.label ??
                          property.status}
                      </Badge>
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
