"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { DollarSign, AlertTriangle, CheckCircle2, Clock } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface Payment {
  id: string;
  type: string;
  amount: number;
  dueDate: string;
  status: string;
  paidAt?: string;
}

function formatDA(amount: number): string {
  return new Intl.NumberFormat("fr-DZ", { maximumFractionDigits: 0 }).format(amount) + " DA";
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
  PAID: { label: "Payé", color: "bg-green-100 text-green-700", icon: CheckCircle2 },
  PENDING: { label: "En attente", color: "bg-amber-100 text-amber-700", icon: Clock },
  OVERDUE: { label: "Impayé", color: "bg-red-100 text-red-700", icon: AlertTriangle },
};

interface TabPaiementsProps {
  payments: Payment[];
  totalAmount: number;
  paidAmount: number;
}

export function TabPaiements({ payments, totalAmount, paidAmount }: TabPaiementsProps) {
  const progress = totalAmount > 0 ? Math.round((paidAmount / totalAmount) * 100) : 0;
  const overdueCount = payments.filter((p) => p.status === "OVERDUE").length;

  return (
    <div className="space-y-6">
      {/* Summary Bar */}
      <Card className="border-neutral-100 dark:border-neutral-800 overflow-hidden">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
            <div>
              <h3 className="text-lg font-black flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-primary" />
                Progression des paiements
              </h3>
              <p className="text-sm text-muted-foreground">
                {formatDA(paidAmount)} payé sur {formatDA(totalAmount)}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-3xl font-black text-primary">{progress}%</span>
              {overdueCount > 0 && (
                <Badge variant="destructive" className="font-black gap-1 animate-pulse">
                  <AlertTriangle className="h-3 w-3" />
                  {overdueCount} impayé{overdueCount > 1 ? "s" : ""}
                </Badge>
              )}
            </div>
          </div>
          <Progress value={progress} className="h-3" />
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="border-neutral-100 dark:border-neutral-800">
        <CardHeader>
          <CardTitle className="text-base font-black">Échéancier</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="font-black text-xs uppercase">Type</TableHead>
                <TableHead className="font-black text-xs uppercase">Montant</TableHead>
                <TableHead className="font-black text-xs uppercase">Échéance</TableHead>
                <TableHead className="font-black text-xs uppercase">Statut</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground italic py-8">
                    Aucun paiement enregistré
                  </TableCell>
                </TableRow>
              ) : (
                payments.map((p) => {
                  const status = STATUS_CONFIG[p.status] || STATUS_CONFIG.PENDING;
                  const StatusIcon = status.icon;
                  const isOverdue = p.status === "OVERDUE";
                  return (
                    <TableRow
                      key={p.id}
                      className={cn(isOverdue && "bg-red-50/50 dark:bg-red-950/10")}
                    >
                      <TableCell className="font-medium">{p.type}</TableCell>
                      <TableCell className="font-bold font-mono">{formatDA(p.amount)}</TableCell>
                      <TableCell className="text-sm">
                        {format(new Date(p.dueDate), "dd MMM yyyy", { locale: fr })}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={cn("text-[10px] font-black uppercase gap-1", status.color)}
                        >
                          <StatusIcon className="h-3 w-3" />
                          {status.label}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
