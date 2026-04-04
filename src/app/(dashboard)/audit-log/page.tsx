"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ScrollText, Info, Clock, User, FileText, Settings } from "lucide-react";

const mockAuditLogs = [
  {
    id: "1",
    date: "2026-04-04T14:32:00Z",
    user: "Ahmed Benali",
    action: "Creation",
    entity: "Client",
    details: "Nouveau client ajoute : Mohamed Kaci",
  },
  {
    id: "2",
    date: "2026-04-04T11:15:00Z",
    user: "Sara Mehdaoui",
    action: "Modification",
    entity: "Bien",
    details: "Prix mis a jour pour Appartement F3 Hydra",
  },
  {
    id: "3",
    date: "2026-04-03T17:45:00Z",
    user: "Karim Boudiaf",
    action: "Suppression",
    entity: "Document",
    details: "Document compromis supprime",
  },
  {
    id: "4",
    date: "2026-04-03T09:20:00Z",
    user: "Ahmed Benali",
    action: "Transition",
    entity: "Pipeline",
    details: "Client Amira Zidane passe de QUALIFIED a VISIT_SCHEDULED",
  },
  {
    id: "5",
    date: "2026-04-02T16:00:00Z",
    user: "Sara Mehdaoui",
    action: "Attribution",
    entity: "Lead",
    details: "Lead Facebook assigne au superviseur Equipe Nord",
  },
];

const actionConfig: Record<string, { className: string }> = {
  Creation: {
    className:
      "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  },
  Modification: {
    className:
      "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  },
  Suppression: {
    className:
      "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  },
  Transition: {
    className:
      "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
  },
  Attribution: {
    className:
      "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
  },
};

const entityIcons: Record<string, React.ReactNode> = {
  Client: <User className="h-3 w-3" />,
  Bien: <FileText className="h-3 w-3" />,
  Document: <FileText className="h-3 w-3" />,
  Pipeline: <Settings className="h-3 w-3" />,
  Lead: <User className="h-3 w-3" />,
};

export default function AuditLogPage() {
  return (
    <div className="space-y-8 pb-10">
      <header>
        <h1 className="text-3xl font-black tracking-tight text-neutral-900 dark:text-neutral-100 uppercase">
          Journal d&apos;audit
        </h1>
        <p className="text-muted-foreground mt-1 font-medium">
          Historique des actions effectuees sur la plateforme.
        </p>
      </header>

      {/* Coming Soon Banner */}
      <Card className="border-blue-200 bg-blue-50/50 dark:border-blue-900 dark:bg-blue-950/20">
        <CardContent className="flex items-center gap-4 pt-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/50">
            <Info className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <p className="font-semibold text-blue-900 dark:text-blue-100">
              Bientot disponible
            </p>
            <p className="text-sm text-blue-700 dark:text-blue-300">
              Le journal d&apos;audit complet est en cours de developpement.
              Les donnees ci-dessous sont un apercu de la structure finale.
            </p>
          </div>
        </CardContent>
      </Card>

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
            <div className="text-2xl font-bold">2</div>
            <p className="text-xs text-muted-foreground mt-1">
              Evenements enregistres
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
            <div className="text-2xl font-bold">5</div>
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
            <div className="text-2xl font-bold">3</div>
            <p className="text-xs text-muted-foreground mt-1">
              Ont effectue des actions
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ScrollText className="h-5 w-5" />
            Historique des activites
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Utilisateur</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Entite</TableHead>
                <TableHead>Details</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockAuditLogs.map((log) => (
                <TableRow key={log.id} className="opacity-75">
                  <TableCell className="text-muted-foreground">
                    <div>
                      <p className="text-sm">
                        {new Date(log.date).toLocaleDateString("fr-FR")}
                      </p>
                      <p className="text-xs">
                        {new Date(log.date).toLocaleTimeString("fr-FR", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <p className="font-medium">{log.user}</p>
                  </TableCell>
                  <TableCell>
                    <Badge
                      className={
                        actionConfig[log.action]?.className ??
                        "bg-neutral-100 text-neutral-800 dark:bg-neutral-800 dark:text-neutral-300"
                      }
                    >
                      {log.action}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      {entityIcons[log.entity]}
                      <span>{log.entity}</span>
                    </div>
                  </TableCell>
                  <TableCell className="max-w-[300px] truncate text-sm text-muted-foreground">
                    {log.details}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
