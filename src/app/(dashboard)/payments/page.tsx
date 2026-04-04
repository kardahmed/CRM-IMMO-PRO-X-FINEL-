"use client";

import { useEffect, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import {
  CreditCard,
  Search,
  Loader2,
  BanknoteIcon,
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

interface IPayment {
  id: string;
  type: string;
  amount: number;
  status: string;
  createdAt: string;
  client: { firstName: string; lastName: string };
  property: { name: string };
}

const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-800",
  COMPLETED: "bg-green-100 text-green-800",
  FAILED: "bg-red-100 text-red-800",
  REFUNDED: "bg-gray-100 text-gray-800",
};

const STATUS_LABELS: Record<string, string> = {
  PENDING: "En attente",
  COMPLETED: "Complété",
  FAILED: "Échoué",
  REFUNDED: "Remboursé",
};

const TYPE_LABELS: Record<string, string> = {
  DEPOSIT: "Acompte",
  INSTALLMENT: "Versement",
  FINAL: "Solde",
  COMMISSION: "Commission",
  REFUND: "Remboursement",
};

const formatAmount = (amount: number) =>
  new Intl.NumberFormat("fr-DZ", {
    style: "currency",
    currency: "DZD",
    maximumFractionDigits: 0,
  }).format(amount);

export default function PaymentsPage() {
  const [payments, setPayments] = useState<IPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  useEffect(() => {
    async function fetchPayments() {
      try {
        const res = await fetch("/api/v1/payments");
        if (!res.ok) throw new Error("Erreur");
        const json = await res.json();
        if (json.success) setPayments(json.data);
      } catch {
        console.error("Impossible de charger les paiements");
      } finally {
        setLoading(false);
      }
    }
    fetchPayments();
  }, []);

  const filtered = payments.filter((p) => {
    const matchSearch =
      !search ||
      `${p.client.firstName} ${p.client.lastName}`
        .toLowerCase()
        .includes(search.toLowerCase()) ||
      p.property.name.toLowerCase().includes(search.toLowerCase());
    const matchStatus =
      statusFilter === "ALL" || p.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const totalAmount = filtered
    .filter((p) => p.status === "COMPLETED")
    .reduce((sum, p) => sum + p.amount, 0);

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
            <CreditCard className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight uppercase">
              Paiements
            </h1>
            <p className="text-sm text-muted-foreground font-medium">
              Suivez les paiements et transactions financières
            </p>
          </div>
        </div>
        {totalAmount > 0 && (
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Total encaissé</p>
            <p className="text-xl font-bold text-green-600">
              {formatAmount(totalAmount)}
            </p>
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher par client ou bien..."
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
            <BanknoteIcon className="h-12 w-12 text-muted-foreground" />
            <p className="text-lg font-semibold text-muted-foreground">
              Aucun paiement trouvé
            </p>
            <p className="text-sm text-muted-foreground">
              {search || statusFilter !== "ALL"
                ? "Essayez de modifier vos filtres"
                : "Les paiements apparaîtront ici une fois enregistrés"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>
              {filtered.length} paiement{filtered.length > 1 ? "s" : ""}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Client</TableHead>
                  <TableHead>Bien</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Montant</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell className="font-medium">
                      {payment.client.firstName} {payment.client.lastName}
                    </TableCell>
                    <TableCell>{payment.property.name}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {TYPE_LABELS[payment.type] || payment.type}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-semibold">
                      {formatAmount(payment.amount)}
                    </TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          STATUS_COLORS[payment.status] ||
                          "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {STATUS_LABELS[payment.status] || payment.status}
                      </span>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDistanceToNow(new Date(payment.createdAt), {
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
