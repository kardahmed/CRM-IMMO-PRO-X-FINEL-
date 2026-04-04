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
import { Globe, RefreshCw, AlertCircle, Send, Users, ShieldCheck } from "lucide-react";

interface Client {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  portalToken: string | null;
  portalTokenActive: boolean;
  pipelineStage: string;
}

const pipelineLabels: Record<string, string> = {
  NEW: "Nouveau",
  CONTACTED: "Contacte",
  QUALIFIED: "Qualifie",
  VISIT_SCHEDULED: "Visite programmee",
  VISITED: "Visite effectuee",
  NEGOTIATION: "Negociation",
  RESERVED: "Reserve",
  SIGNED: "Signe",
  CLOSED: "Cloture",
};

export default function PortalManagerPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [sendingId, setSendingId] = useState<string | null>(null);

  async function fetchClients() {
    setLoading(true);
    setError(false);
    try {
      const res = await fetch("/api/v1/clients");
      if (!res.ok) throw new Error("Failed to fetch");
      const json = await res.json();
      if (json.success) {
        const d = json.data;
        setClients(Array.isArray(d) ? d : d.clients ?? []);
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
    fetchClients();
  }, []);

  async function handleSendLink(clientId: string) {
    setSendingId(clientId);
    try {
      await fetch("/api/v1/portal/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId }),
      });
    } catch {
      // Silently handle - visual only for now
    } finally {
      setSendingId(null);
    }
  }

  const portalClients = clients.filter((c) => c.portalToken);
  const activePortals = portalClients.filter((c) => c.portalTokenActive);

  if (loading) {
    return (
      <div className="space-y-8 animate-pulse">
        <Skeleton className="h-10 w-[350px]" />
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
        <p className="text-xl font-bold">Impossible de charger les donnees du portail</p>
        <Button onClick={fetchClients} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" /> Reessayer
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-10">
      <header>
        <h1 className="text-3xl font-black tracking-tight text-neutral-900 dark:text-neutral-100 uppercase">
          Gestionnaire de Portail
        </h1>
        <p className="text-muted-foreground mt-1 font-medium">
          Administration des acces au portail client.
        </p>
      </header>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Clients</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{clients.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Clients enregistres</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Portails Crees</CardTitle>
            <Globe className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{portalClients.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Acces portail generes</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Portails Actifs</CardTitle>
            <ShieldCheck className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activePortals.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Actuellement actifs</p>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Acces portail clients</CardTitle>
          <Button onClick={fetchClients} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" /> Actualiser
          </Button>
        </CardHeader>
        <CardContent>
          {clients.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Globe className="h-12 w-12 mb-4 opacity-40" />
              <p className="text-lg font-medium">Aucun client enregistre</p>
              <p className="text-sm">Les clients avec acces portail apparaitront ici.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Client</TableHead>
                  <TableHead>Etape Pipeline</TableHead>
                  <TableHead>Token Status</TableHead>
                  <TableHead>Lien</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clients.map((client) => (
                  <TableRow key={client.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">
                          {client.firstName} {client.lastName}
                        </p>
                        <p className="text-xs text-muted-foreground">{client.email}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {pipelineLabels[client.pipelineStage] || client.pipelineStage}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {client.portalToken ? (
                        client.portalTokenActive ? (
                          <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                            Actif
                          </Badge>
                        ) : (
                          <Badge className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">
                            Inactif
                          </Badge>
                        )
                      ) : (
                        <Badge className="bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400">
                          Non genere
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSendLink(client.id)}
                        disabled={sendingId === client.id}
                      >
                        <Send className="h-3 w-3 mr-1" />
                        {sendingId === client.id ? "Envoi..." : "Envoyer le lien"}
                      </Button>
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
