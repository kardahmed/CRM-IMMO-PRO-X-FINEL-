"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, FileCheck, Building2 } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface TabReservationProps {
  reservation: {
    contractId: string;
    date: string;
    property: {
      id: string;
      name: string;
      unit: string;
    };
    amount: number;
    deposit: number;
    status: string;
  } | null;
}

export function TabReservation({ reservation }: TabReservationProps) {
  if (!reservation) {
    return (
      <Card className="border-dashed shadow-sm">
        <CardContent className="flex flex-col items-center justify-center h-48 text-muted-foreground p-6 text-center">
          <FileCheck className="h-10 w-10 mb-4 opacity-20" />
          <p className="font-medium text-lg text-foreground">Aucune réservation</p>
          <p className="text-sm mt-1">Ce client n&apos;a pas encore signé de contrat de réservation.</p>
        </CardContent>
      </Card>
    );
  }

  const formatDA = (val: number) => {
    return new Intl.NumberFormat("fr-DZ", { maximumFractionDigits: 0 }).format(val) + " DA";
  };

  return (
    <Card className="shadow-sm border-neutral-100 dark:border-neutral-800">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base font-black">
            <FileCheck className="h-5 w-5 text-green-600" />
            Contrat de Réservation
          </CardTitle>
          <Badge className="bg-green-600 text-white font-bold">{reservation.status}</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="space-y-1">
            <p className="text-[10px] uppercase font-black tracking-wider text-muted-foreground">Numéro de Contrat</p>
            <p className="font-mono text-sm font-bold bg-accent/30 w-fit px-2 py-1 rounded">{reservation.contractId}</p>
          </div>
          
          <div className="space-y-1">
            <p className="text-[10px] uppercase font-black tracking-wider text-muted-foreground">Date de signature</p>
            <p className="flex items-center gap-1.5 text-sm font-bold">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              {format(new Date(reservation.date), "dd MMMM yyyy", { locale: fr })}
            </p>
          </div>

          <div className="space-y-1">
            <p className="text-[10px] uppercase font-black tracking-wider text-muted-foreground">Bien Réserve</p>
            <p className="flex items-center gap-1.5 text-sm font-bold">
              <Building2 className="h-4 w-4 text-muted-foreground" />
              {reservation.property.name} <span className="text-muted-foreground font-normal">({reservation.property.unit})</span>
            </p>
          </div>

          <div className="space-y-1">
            <p className="text-[10px] uppercase font-black tracking-wider text-muted-foreground">Finance</p>
            <div className="flex flex-col gap-0.5">
              <span className="flex items-center gap-1.5 text-sm font-bold">
                <span className="text-muted-foreground font-normal w-12 text-xs">Vente :</span> {formatDA(reservation.amount)}
              </span>
              <span className="flex items-center gap-1.5 text-sm font-bold text-green-600">
                <span className="text-muted-foreground font-normal w-12 text-xs">Dépôt :</span> {formatDA(reservation.deposit)}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
