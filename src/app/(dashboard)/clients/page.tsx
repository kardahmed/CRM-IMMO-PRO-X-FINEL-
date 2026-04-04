"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { Users, Plus, Search, Loader2, UserX } from "lucide-react";
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

interface IClient {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  source: string;
  pipelineStage: string;
  assignedAgent: { firstName: string; lastName: string } | null;
  createdAt: string;
}

const STAGE_COLORS: Record<string, string> = {
  NEW: "bg-blue-100 text-blue-800",
  CONTACTED: "bg-indigo-100 text-indigo-800",
  QUALIFIED: "bg-purple-100 text-purple-800",
  VISIT_SCHEDULED: "bg-cyan-100 text-cyan-800",
  VISITED: "bg-teal-100 text-teal-800",
  NEGOTIATION: "bg-amber-100 text-amber-800",
  RESERVED: "bg-orange-100 text-orange-800",
  SIGNED: "bg-emerald-100 text-emerald-800",
  CLOSED: "bg-green-100 text-green-800",
};

const STAGE_LABELS: Record<string, string> = {
  NEW: "Nouveau",
  CONTACTED: "Contacte",
  QUALIFIED: "Qualifie",
  VISIT_SCHEDULED: "Visite planifiee",
  VISITED: "Visite",
  NEGOTIATION: "Negociation",
  RESERVED: "Reserve",
  SIGNED: "Signe",
  CLOSED: "Cloture",
};

export default function ClientsPage() {
  const [clients, setClients] = useState<IClient[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [stageFilter, setStageFilter] = useState<string>("ALL");

  useEffect(() => {
    async function fetchClients() {
      try {
        const res = await fetch("/api/v1/clients");
        if (!res.ok) throw new Error("Erreur");
        const json = await res.json();
        if (json.success) setClients(json.data);
      } catch {
        console.error("Impossible de charger les clients");
      } finally {
        setLoading(false);
      }
    }
    fetchClients();
  }, []);

  const filtered = clients.filter((c) => {
    const matchSearch =
      !search ||
      `${c.firstName} ${c.lastName}`.toLowerCase().includes(search.toLowerCase()) ||
      c.phone.includes(search) ||
      c.email?.toLowerCase().includes(search.toLowerCase());
    const matchStage = stageFilter === "ALL" || c.pipelineStage === stageFilter;
    return matchSearch && matchStage;
  });

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
            <Users className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight uppercase">
              Clients
            </h1>
            <p className="text-sm text-muted-foreground font-medium">
              Gerez vos clients et suivez leur progression dans le pipeline
            </p>
          </div>
        </div>
        <Link href="/clients/new">
          <Button>
            <Plus className="h-4 w-4 mr-1" />
            Nouveau client
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher par nom, telephone, email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button
            variant={stageFilter === "ALL" ? "default" : "outline"}
            size="sm"
            onClick={() => setStageFilter("ALL")}
          >
            Tous
          </Button>
          {Object.entries(STAGE_LABELS).map(([key, label]) => (
            <Button
              key={key}
              variant={stageFilter === key ? "default" : "outline"}
              size="sm"
              onClick={() => setStageFilter(key)}
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
            <UserX className="h-12 w-12 text-muted-foreground" />
            <p className="text-lg font-semibold text-muted-foreground">
              Aucun client trouve
            </p>
            <p className="text-sm text-muted-foreground">
              {search || stageFilter !== "ALL"
                ? "Essayez de modifier vos filtres"
                : "Commencez par ajouter votre premier client"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>{filtered.length} client{filtered.length > 1 ? "s" : ""}</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nom</TableHead>
                  <TableHead>Telephone</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Etape Pipeline</TableHead>
                  <TableHead>Agent</TableHead>
                  <TableHead>Date creation</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((client) => (
                  <TableRow key={client.id}>
                    <TableCell>
                      <Link
                        href={`/clients/${client.id}`}
                        className="font-medium text-primary hover:underline"
                      >
                        {client.firstName} {client.lastName}
                      </Link>
                    </TableCell>
                    <TableCell>{client.phone}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {client.email || "\u2014"}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{client.source || "\u2014"}</Badge>
                    </TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          STAGE_COLORS[client.pipelineStage] || "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {STAGE_LABELS[client.pipelineStage] || client.pipelineStage}
                      </span>
                    </TableCell>
                    <TableCell>
                      {client.assignedAgent
                        ? `${client.assignedAgent.firstName} ${client.assignedAgent.lastName}`
                        : "\u2014"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDistanceToNow(new Date(client.createdAt), {
                        addSuffix: true,
                        locale: fr,
                      })}
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
