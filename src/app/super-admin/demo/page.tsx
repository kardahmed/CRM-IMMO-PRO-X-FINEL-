"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, Clock, Mail, Phone, Building } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";

const MOCK_LEADS = [
  { id: "dl1", company: "Emaar Immobilier", name: "Ahmed Yelles", email: "ahmed@emaar.dz", phone: "0550 44 33 22", employees: "50+", status: "NEW", date: new Date(Date.now() - 1000 * 60 * 60 * 2) },
  { id: "dl2", company: "Agence Benboulaid", name: "Karim Ben", email: "contact@benboulaid.com", phone: "0770 11 22 33", employees: "6-20", status: "CONTACTED", date: new Date(Date.now() - 1000 * 60 * 60 * 24) },
  { id: "dl3", company: "Global Promoteur", name: "Sarah Amrani", email: "samrani@global.com", phone: "0661 99 88 77", employees: "21-50", status: "NEW", date: new Date(Date.now() - 1000 * 60 * 60 * 4) }
];

export default function SuperAdminDemoLeads() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <Users className="h-6 w-6 text-rose-400" />
            Leads Entrants (Démo)
          </h1>
          <p className="text-sm text-neutral-400 mt-1">Gérez les agences qui ont soumis le formulaire public sur /demo.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {MOCK_LEADS.map(lead => (
          <Card key={lead.id} className="bg-neutral-900/50 border-neutral-800 backdrop-blur-sm hover:border-neutral-700 transition-colors">
            <CardContent className="p-5 relative">
              <div className="absolute top-5 right-5">
                {lead.status === "NEW" ? (
                  <Badge className="bg-rose-500/10 text-rose-400 border-none font-black uppercase text-[10px] animate-pulse">🔥 NOUVEAU</Badge>
                ) : (
                  <Badge className="bg-neutral-800 text-neutral-400 border-none font-bold uppercase text-[10px]">CONTACTÉ</Badge>
                )}
              </div>
              
              <div className="space-y-4">
                <div>
                  <h3 className="font-black text-lg text-white flex items-center gap-2">
                    <Building className="h-4 w-4 text-neutral-500" />
                    {lead.company}
                  </h3>
                  <p className="text-sm text-neutral-400 font-medium">Par {lead.name}</p>
                </div>

                <div className="space-y-1.5 text-xs">
                  <p className="flex items-center gap-2 text-neutral-300">
                    <Mail className="h-3 w-3 text-neutral-500" /> {lead.email}
                  </p>
                  <p className="flex items-center gap-2 text-neutral-300">
                    <Phone className="h-3 w-3 text-neutral-500" /> {lead.phone}
                  </p>
                  <p className="flex items-center gap-2 text-neutral-500 font-medium pt-2">
                    <Clock className="h-3 w-3 text-neutral-600" /> 
                    Il y a {formatDistanceToNow(lead.date, { locale: fr })}
                  </p>
                </div>

                <div className="pt-2 border-t border-neutral-800 flex items-center gap-2">
                  <Button size="sm" className="w-full bg-white text-black hover:bg-neutral-200 font-bold">
                    Ouvrir fiche
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
