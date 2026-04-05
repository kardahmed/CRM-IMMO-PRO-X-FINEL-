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
import { DollarSign, RefreshCw, AlertCircle, TrendingUp, Clock, CheckCircle2 } from "lucide-react";

interface CommissionPayment {
  id: string;
  agentName: string;
  clientName: string;
  propertyName: string;
  amount: number;
  status: "PENDING" | "COMPLETED" | "FAILED";
  date: string;
}

const formatAmount = (amount: number) =>
  new Intl.NumberFormat("fr-DZ", { style: "currency", currency: "DZD", minimumFractionDigits: 0 }).format(amount);

const statusConfig: Record<CommissionPayment["status"], { label: string; className: string }> = {
  PENDING: { label: "En attente", className: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400" },
  COMPLETED: { label: "Termine", className: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" },
  FAILED: { label: "Echoue", className: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400" },
};

export default function CommissionsPage() {
  const [payments, setPayments] = useState<CommissionPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  async function fetchCommissions() {
    setLoading(true);
    setError(false);
    try {
      const res = await fetch("/api/v1/payments?type=COMMISSION");
      if (!res.ok) throw new Error("Failed to fetch");
      const json = await res.json();
      if (json.success) {
        const d = json.data;
        setPayments(Array.isArray(d) ? d : d.payments ?? []);
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
    fetchCommissions();
  }, []);

  const totalCommissions = payments.reduce((sum, p) => sum + p.amount, 0);
  const completedCount = payments.filter((p) => p.status === "COMPLETED").length;
  const pendingCount = payments.filter((p) => p.status === "PENDING").length;

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
        <p className="text-xl font-bold">Impossible de charger les commissions</p>
        <Button onClick={fetchCommissions} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" /> Reessayer
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-10">
      <header>
        <h1 className="text-3xl font-black tracking-tight text-foreground uppercase">
          Commissions
        </h1>
        <p className="text-muted-foreground mt-1 font-medium">
          Suivi des paiements de commissions agents.
        </p>
      </header>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Commissions</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatAmount(totalCommissions)}</div>
            <p className="text-xs text-muted-foreground mt-1">{payments.length} paiement(s)</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completees</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedCount}</div>
            <p className="text-xs text-muted-foreground mt-1">Paiements valides</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">En attente</CardTitle>
            <Clock className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingCount}</div>
            <p className="text-xs text-muted-foreground mt-1">A traiter</p>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Historique des commissions</CardTitle>
          <Button onClick={fetchCommissions} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" /> Actualiser
          </Button>
        </CardHeader>
        <CardContent>
          {payments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <TrendingUp className="h-12 w-12 mb-4 opacity-40" />
              <p className="text-lg font-medium">Aucune commission enregistree</p>
              <p className="text-sm">Les commissions apparaitront ici apres les transactions.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Agent / Client</TableHead>
                  <TableHead>Bien</TableHead>
                  <TableHead>Montant</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{payment.agentName}</p>
                        <p className="text-xs text-muted-foreground">{payment.clientName}</p>
                      </div>
                    </TableCell>
                    <TableCell>{payment.propertyName}</TableCell>
                    <TableCell className="font-semibold">{formatAmount(payment.amount)}</TableCell>
                    <TableCell>
                      <Badge className={statusConfig[payment.status].className}>
                        {statusConfig[payment.status].label}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(payment.date).toLocaleDateString("fr-FR")}
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
