"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect, useState } from "react";
import Link from "next/link";
import { formatDistanceToNow, format } from "date-fns";
import { fr } from "date-fns/locale";
import {
  FileText,
  Plus,
  Search,
  Loader2,
  FileX,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { toast } from "sonner";

interface IMandate {
  id: string;
  type: string;
  commission: number;
  startDate: string;
  endDate: string;
  status: string;
  owner: { firstName: string; lastName: string };
  property: { name: string };
}

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: "bg-green-100 text-green-800",
  EXPIRED: "bg-red-100 text-red-800",
  CANCELLED: "bg-gray-100 text-gray-800",
  COMPLETED: "bg-blue-100 text-blue-800",
};

const STATUS_LABELS: Record<string, string> = {
  ACTIVE: "Actif",
  EXPIRED: "Expiré",
  CANCELLED: "Annulé",
  COMPLETED: "Terminé",
};

const TYPE_LABELS: Record<string, string> = {
  EXCLUSIVE: "Exclusif",
  SIMPLE: "Simple",
  SEMI_EXCLUSIVE: "Semi-exclusif",
};

export default function MandatesPage() {
  const [mandates, setMandates] = useState<IMandate[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  useEffect(() => {
    async function fetchMandates() {
      try {
        const res = await fetch("/api/v1/mandates");
        if (!res.ok) throw new Error("Erreur");
        const json = await res.json();
        if (json.success) {
          const d = json.data;
          setMandates(Array.isArray(d) ? d : d.mandates ?? []);
        }
      } catch (err) {
        Sentry.captureException(err, { tags: { context: "Mandates page" } });
      } finally {
        setLoading(false);
      }
    }
    fetchMandates();
  }, []);

  const filtered = mandates.filter((m) => {
    const matchSearch =
      !search ||
      `${m.owner.firstName} ${m.owner.lastName}`
        .toLowerCase()
        .includes(search.toLowerCase()) ||
      m.property.name.toLowerCase().includes(search.toLowerCase());
    const matchStatus =
      statusFilter === "ALL" || m.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
            <FileText className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight uppercase">
              Mandats
            </h1>
            <p className="text-sm text-muted-foreground font-medium">
              Gérez les mandats de vente et de location
            </p>
          </div>
        </div>
        <Button onClick={() => toast.info("Creation de mandats bientot disponible — creez d'abord un proprietaire et un bien")}>
          <Plus className="h-4 w-4 mr-1" />
          Nouveau mandat
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher par propriétaire ou bien..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button
            variant={statusFilter === "ALL" ? "default" : "outline"}
            size="sm"
            onClick={() => setStatusFilter("ALL")}
          >
            Tous
          </Button>
          {Object.entries(STATUS_LABELS).map(([key, label]) => (
            <Button
              key={key}
              variant={statusFilter === key ? "default" : "outline"}
              size="sm"
              onClick={() => setStatusFilter(key)}
            >
              {label}
            </Button>
          ))}
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 gap-3">
            <FileX className="h-12 w-12 text-muted-foreground" />
            <p className="text-lg font-semibold text-muted-foreground">
              Aucun mandat trouvé
            </p>
            <p className="text-sm text-muted-foreground">
              {search || statusFilter !== "ALL"
                ? "Essayez de modifier vos filtres"
                : "Commencez par ajouter votre premier mandat"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>
              {filtered.length} mandat{filtered.length > 1 ? "s" : ""}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Propriétaire</TableHead>
                  <TableHead>Bien</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Commission</TableHead>
                  <TableHead>Début</TableHead>
                  <TableHead>Fin</TableHead>
                  <TableHead>Statut</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((mandate) => (
                  <TableRow key={mandate.id}>
                    <TableCell>
                      <Link
                        href={`/mandates/${mandate.id}`}
                        className="font-medium text-primary hover:underline"
                      >
                        {mandate.owner.firstName} {mandate.owner.lastName}
                      </Link>
                    </TableCell>
                    <TableCell>{mandate.property.name}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {TYPE_LABELS[mandate.type] || mandate.type}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">
                      {mandate.commission}%
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {format(new Date(mandate.startDate), "dd/MM/yyyy")}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {format(new Date(mandate.endDate), "dd/MM/yyyy")}
                    </TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          STATUS_COLORS[mandate.status] ||
                          "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {STATUS_LABELS[mandate.status] || mandate.status}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
