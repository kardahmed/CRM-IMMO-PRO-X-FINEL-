"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Receipt, Check, Clock, Plus } from "lucide-react";

interface Charge {
  id: string;
  label: string;
  amount: number;
  status: string;
}

interface TabChargesProps {
  charges: Charge[];
}

export function TabCharges({ charges }: TabChargesProps) {
  const formatDA = (val: number) => new Intl.NumberFormat("fr-DZ").format(val) + " DA";
  const totalCharges = charges.reduce((acc, c) => acc + c.amount, 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-black flex items-center gap-2">
            <Receipt className="h-5 w-5 text-rose-500" />
            Charges & Frais Annexes
          </h3>
          <p className="text-xs text-muted-foreground mt-1">Total généré : <span className="font-bold text-foreground">{formatDA(totalCharges)}</span></p>
        </div>
        <Button size="sm" className="gap-2 font-bold rounded-full">
          <Plus className="h-4 w-4" />
          Ajouter
        </Button>
      </div>

      <Card className="shadow-sm border-neutral-100 dark:border-neutral-800">
        <CardContent className="p-0">
          {charges.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground text-sm">
              <Receipt className="h-8 w-8 mx-auto mb-3 opacity-20" />
              Aucun frais annexe facturé à ce client.
            </div>
          ) : (
            <div className="divide-y border-t rounded-b-xl overflow-hidden">
              {charges.map((charge) => (
                <div key={charge.id} className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-accent flex items-center justify-center">
                      <Receipt className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="font-bold text-sm">{charge.label}</p>
                      <p className="text-xs font-black text-rose-500 mt-0.5">{formatDA(charge.amount)}</p>
                    </div>
                  </div>
                  {charge.status === "PAID" ? (
                    <Badge variant="outline" className="gap-1 border-green-200 text-green-700 bg-green-50">
                      <Check className="h-3 w-3" /> Payé
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="gap-1 border-amber-200 text-amber-700 bg-amber-50">
                      <Clock className="h-3 w-3" /> En attente
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
