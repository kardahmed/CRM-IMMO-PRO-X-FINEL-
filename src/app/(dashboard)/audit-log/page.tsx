"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollText, Clock, User, FileText, Settings, Loader2 } from "lucide-react";

interface IAuditLog {
  id: string;
  action: string;
  entity: string;
  entityId: string;
  metadata: Record<string, unknown>;
  createdAt: string;
  user: {
    firstName: string;
    lastName: string;
  } | null;
}

const actionConfig: Record<string, { label: string; className: string }> = {
  CREATE: {
    label: "Création",
    className: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  },
  UPDATE: {
    label: "Modification",
    className: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  },
  DELETE: {
    label: "Suppression",
    className: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  },
  TRANSITION: {
    label: "Transition",
    className: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
  },
  ASSIGN: {
    label: "Attribution",
    className: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
  },
};

const entityIcons: Record<string, React.ReactNode> = {
  Client: <User className="h-3 w-3" />,
  Property: <FileText className="h-3 w-3" />,
  Document: <FileText className="h-3 w-3" />,
  Pipeline: <Settings className="h-3 w-3" />,
  Visit: <Clock className="h-3 w-3" />,
  Task: <Settings className="h-3 w-3" />,
  Payment: <FileText className="h-3 w-3" />,
  Objective: <Settings className="h-3 w-3" />,
};

export default function AuditLogPage() {
  const [logs, setLogs] = useState<IAuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [entityFilter, setEntityFilter] = useState<string>("ALL");
  const [actionFilter, setActionFilter] = useState<string>("ALL");

  useEffect(() => {
    async function fetchLogs() {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (entityFilter !== "ALL") params.set("entity", entityFilter);
        if (actionFilter !== "ALL") params.set("action", actionFilter);

        const qs = params.toString();
        const url = `/api/v1/audit-log${qs ? `?${qs}` : ""}`;
        const res = await fetch(url);
        const json = await res.json();
        if (!json.success) {
          setError(json.error ?? "Erreur lors du chargement");
          return;
        }
        setLogs(json.data);
        setError(null);
      } catch {
        setError("Impossible de contacter le serveur");
      } finally {
        setLoading(false);
      }
    }
    fetchLogs();
  }, [entityFilter, actionFilter]);

  // Compute stats from real data
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const weekAgo = new Date(today);
  weekAgo.setDate(weekAgo.getDate() - 7);

  const todayCount = logs.filter((l) => new Date(l.createdAt) >= today).length;
  const weekCount = logs.filter((l) => new Date(l.createdAt) >= weekAgo).length;
  const uniqueUsers = new Set(logs.map((l) => l.user ? `${l.user.firstName} ${l.user.lastName}` : "Système")).size;

  if (loading && logs.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error && logs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <p className="text-destructive font-bold">{error}</p>
        <Button variant="outline" onClick={() => window.location.reload()}>
          Réessayer
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-10">
      <header>
        <h1 className="text-3xl font-black tracking-tight text-foreground uppercase">
          Journal d&apos;audit
        </h1>
        <p className="text-muted-foreground mt-1 font-medium">
          Historique des actions effectuées sur la plateforme.
        </p>
      </header>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Actions aujourd&apos;hui
            </CardTitle>
            <ScrollText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{todayCount}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Événements enregistrés
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Cette semaine
            </CardTitle>
            <Clock className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{weekCount}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Total des actions
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Utilisateurs actifs
            </CardTitle>
            <User className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{uniqueUsers}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Ont effectué des actions
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <div className="w-48">
          <Select value={entityFilter} onValueChange={(v) => setEntityFilter(v ?? "ALL")}>
            <SelectTrigger>
              <SelectValue placeholder="Filtrer par entité" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Toutes les entités</SelectItem>
              <SelectItem value="Client">Client</SelectItem>
              <SelectItem value="Property">Bien</SelectItem>
              <SelectItem value="Visit">Visite</SelectItem>
              <SelectItem value="Task">Tâche</SelectItem>
              <SelectItem value="Payment">Paiement</SelectItem>
              <SelectItem value="Objective">Objectif</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="w-48">
          <Select value={actionFilter} onValueChange={(v) => setActionFilter(v ?? "ALL")}>
            <SelectTrigger>
              <SelectValue placeholder="Filtrer par action" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Toutes les actions</SelectItem>
              <SelectItem value="CREATE">Création</SelectItem>
              <SelectItem value="UPDATE">Modification</SelectItem>
              <SelectItem value="DELETE">Suppression</SelectItem>
              <SelectItem value="TRANSITION">Transition</SelectItem>
              <SelectItem value="ASSIGN">Attribution</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {loading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ScrollText className="h-5 w-5" />
            Historique des activités
          </CardTitle>
        </CardHeader>
        <CardContent>
          {logs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <ScrollText className="h-10 w-10 mb-3 opacity-40" />
              <p className="font-bold">Aucune activité enregistrée</p>
              <p className="text-sm mt-1">Les actions effectuées sur la plateforme apparaîtront ici.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Utilisateur</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Entité</TableHead>
                  <TableHead>ID Entité</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((log) => {
                  const cfg = actionConfig[log.action];
                  return (
                    <TableRow key={log.id}>
                      <TableCell className="text-muted-foreground">
                        <div>
                          <p className="text-sm">
                            {new Date(log.createdAt).toLocaleDateString("fr-FR")}
                          </p>
                          <p className="text-xs">
                            {new Date(log.createdAt).toLocaleTimeString("fr-FR", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <p className="font-medium">
                          {log.user
                            ? `${log.user.firstName} ${log.user.lastName}`
                            : "Système"}
                        </p>
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={
                            cfg?.className ??
                            "bg-neutral-100 text-neutral-800 dark:bg-neutral-800 dark:text-neutral-300"
                          }
                        >
                          {cfg?.label ?? log.action}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          {entityIcons[log.entity] ?? <FileText className="h-3 w-3" />}
                          <span>{log.entity}</span>
                        </div>
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate text-sm text-muted-foreground font-mono">
                        {log.entityId}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
