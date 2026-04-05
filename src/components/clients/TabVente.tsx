"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Scale, User } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface TabVenteProps {
  vente: {
    notary: string;
    promesseDate: string | null;
    acteDate: string | null;
    status: string;
    percentCompleted: number;
  } | null;
}

export function TabVente({ vente }: TabVenteProps) {
  if (!vente) {
    return (
      <Card className="border-dashed shadow-sm">
        <CardContent className="flex flex-col items-center justify-center h-48 text-muted-foreground p-6 text-center">
          <Scale className="h-10 w-10 mb-4 opacity-20" />
          <p className="font-medium text-lg text-foreground">Aucune vente encours</p>
          <p className="text-sm mt-1">L&apos;acte notarié n&apos;a pas encore été initialisé.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-sm border-neutral-100 dark:border-neutral-800">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base font-black">
            <Scale className="h-5 w-5 text-indigo-500" />
            Suivi Notarié (Vente)
          </CardTitle>
          <Badge variant="outline" className="font-bold border-indigo-200 text-indigo-700 bg-indigo-50">
            {vente.status.replace(/_/g, " ")}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <div className="space-y-1">
            <p className="text-xs uppercase font-black tracking-wider text-muted-foreground">Notaire chargé</p>
            <p className="flex items-center gap-1.5 text-sm font-bold">
              <User className="h-4 w-4 text-muted-foreground" />
              {vente.notary}
            </p>
          </div>
          
          <div className="space-y-1">
            <p className="text-xs uppercase font-black tracking-wider text-muted-foreground">Promesse prévue</p>
            <p className="flex items-center gap-1.5 text-sm font-medium">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              {vente.promesseDate ? format(new Date(vente.promesseDate), "dd MMMM yyyy", { locale: fr }) : "Non défini"}
            </p>
          </div>

          <div className="space-y-1">
            <p className="text-xs uppercase font-black tracking-wider text-muted-foreground">Acte final prévu</p>
            <p className="flex items-center gap-1.5 text-sm font-medium">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              {vente.acteDate ? format(new Date(vente.acteDate), "dd MMMM yyyy", { locale: fr }) : "Non défini"}
            </p>
          </div>
        </div>

        {/* Barre de progression dossier notaire */}
        <div className="space-y-2 pt-4 border-t">
          <div className="flex items-center justify-between text-xs font-bold text-muted-foreground">
            <span>Avancement administratif</span>
            <span>{vente.percentCompleted}%</span>
          </div>
          <div className="w-full bg-accent/50 rounded-full h-2.5 overflow-hidden">
            <div 
              className="bg-indigo-500 h-2.5 rounded-full transition-all duration-1000" 
              style={{ width: `${vente.percentCompleted}%` }}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
