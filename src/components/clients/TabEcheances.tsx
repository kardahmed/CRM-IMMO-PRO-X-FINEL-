"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CalendarDays, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface TabEcheancesProps {
  totalAmount: number;
  paidAmount: number;
}

export function TabEcheances({ totalAmount, paidAmount }: TabEcheancesProps) {
  // Mock échéancier généré dynamiquement en fonction du paiement global
  const balance = totalAmount - paidAmount;
  
  const tranches = [
    { title: "Tranche 1 (Fondations)", amount: totalAmount * 0.2, date: new Date(Date.now() + 1000 * 60 * 60 * 24 * 60), status: "PENDING" },
    { title: "Tranche 2 (Hors d'eau)", amount: totalAmount * 0.35, date: new Date(Date.now() + 1000 * 60 * 60 * 24 * 180), status: "PENDING" },
    { title: "Tranche 3 (Menuiseries)", amount: totalAmount * 0.25, date: new Date(Date.now() + 1000 * 60 * 60 * 24 * 300), status: "PENDING" },
    { title: "Tranche 4 (Remise des clés)", amount: totalAmount * 0.2, date: new Date(Date.now() + 1000 * 60 * 60 * 24 * 400), status: "PENDING" },
  ];

  const formatDA = (val: number) => new Intl.NumberFormat("fr-DZ").format(val) + " DA";

  return (
    <Card className="shadow-sm border-neutral-100 dark:border-neutral-800">
      <CardHeader className="flex flex-row items-center justify-between pb-4">
        <div className="space-y-1">
          <CardTitle className="flex items-center gap-2 text-base font-black">
            <CalendarDays className="h-5 w-5 text-amber-500" />
            Échéancier Prévisionnel
          </CardTitle>
          <p className="text-xs text-muted-foreground">Calendrier des appels de fonds futurs.</p>
        </div>
        <div className="text-right">
          <p className="text-sm font-bold text-muted-foreground">Reste à financer</p>
          <p className="text-lg font-black text-amber-600">{formatDA(balance)}</p>
        </div>
      </CardHeader>
      <CardContent>
        {totalAmount === 0 ? (
          <div className="text-center py-6 text-muted-foreground text-sm">
            <AlertCircle className="h-6 w-6 mx-auto mb-2 opacity-50" />
            Aucun échéancier généré. Le prix du bien n&apos;est pas défini.
          </div>
        ) : (
          <div className="relative border-l-2 border-accent ml-3 mt-4 space-y-8 pb-4">
            {tranches.map((tranche, idx) => (
              <div key={idx} className="relative pl-6">
                <div className="absolute -left-[9px] top-1.5 h-4 w-4 rounded-full border-2 border-white bg-amber-500" />
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h4 className="font-bold text-sm">{tranche.title}</h4>
                    <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5">
                      <CalendarDays className="h-3 w-3" />
                      Prévu vers le {format(tranche.date, "MMMM yyyy", { locale: fr })}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-black text-sm">{formatDA(tranche.amount)}</span>
                    <Badge variant="outline" className="text-[10px] font-bold text-muted-foreground">A VENIR</Badge>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
