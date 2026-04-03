"use client";

import { useState } from "react";
import { User, Mail, Phone, MapPin, Building2, Wallet, Layers, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface ClientInfoPanelProps {
  client: {
    firstName: string;
    lastName: string;
    phone: string;
    email: string;
    address?: string;
    city?: string;
    budget?: number;
    budgetMax?: number;
    propertyType?: string;
    minArea?: number;
    desiredLocation?: string;
    minRooms?: number;
    notes?: string;
  };
}

export function ClientInfoPanel({ client }: ClientInfoPanelProps) {
  const [isOpen, setIsOpen] = useState(true);

  const formatDA = (val?: number) => {
    if (!val) return "-";
    return new Intl.NumberFormat("fr-DZ", { maximumFractionDigits: 0 }).format(Math.round(val)) + " DA";
  };

  return (
    <div className="w-full bg-white dark:bg-card border rounded-2xl overflow-hidden shadow-sm transition-all duration-300">
      {/* Header Accordion */}
      <div 
        className="px-6 py-4 flex items-center justify-between cursor-pointer bg-neutral-50/50 dark:bg-transparent hover:bg-neutral-100/50 transition-colors"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center gap-2 font-bold text-sm">
          <User className="h-4 w-4 text-primary" /> Informations du Dossier
        </div>
        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
          {isOpen ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
        </Button>
      </div>

      {/* Body */}
      {isOpen && (
        <div className="px-6 pb-6 pt-2 border-t grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          
          {/* Col 1 : Contact & Base */}
          <div className="space-y-4">
            <h3 className="text-[10px] font-black uppercase text-muted-foreground mb-3 tracking-widest border-b pb-1">Identité & Contact</h3>
            <div className="flex gap-3">
              <div className="h-8 w-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                <User className="h-4 w-4" />
              </div>
              <div className="flex flex-col">
                <span className="text-xs text-muted-foreground font-medium">Nom complet</span>
                <span className="text-sm font-bold">{client.firstName} {client.lastName}</span>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="h-8 w-8 rounded-full bg-green-50 text-green-600 flex items-center justify-center shrink-0">
                <Phone className="h-4 w-4" />
              </div>
              <div className="flex flex-col">
                <span className="text-xs text-muted-foreground font-medium">Téléphone</span>
                <span className="text-sm font-bold">{client.phone}</span>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="h-8 w-8 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                <Mail className="h-4 w-4" />
              </div>
              <div className="flex flex-col">
                <span className="text-xs text-muted-foreground font-medium">Email</span>
                <span className="text-sm font-bold truncate max-w-[200px]">{client.email || "-"}</span>
              </div>
            </div>
          </div>

          {/* Col 2 : Localisation & Notes */}
          <div className="space-y-4">
            <h3 className="text-[10px] font-black uppercase text-muted-foreground mb-3 tracking-widest border-b pb-1">Localisation & Notes</h3>
            <div className="flex gap-3">
              <div className="h-8 w-8 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                <MapPin className="h-4 w-4" />
              </div>
              <div className="flex flex-col">
                <span className="text-xs text-muted-foreground font-medium">Adresse Actuelle</span>
                <span className="text-sm font-bold">{client.address || "-"} <span className="text-xs font-normal text-muted-foreground">{client.city}</span></span>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="h-8 w-8 rounded-full bg-gray-100 text-gray-500 flex items-center justify-center shrink-0">
                <Layers className="h-4 w-4" />
              </div>
              <div className="flex flex-col">
                <span className="text-xs text-muted-foreground font-medium">Remarques (Notes)</span>
                <span className="text-sm font-medium text-muted-foreground line-clamp-2">{client.notes || "Aucune note."}</span>
              </div>
            </div>
          </div>

          {/* Col 3 : Critères de recherche */}
          <div className="space-y-4">
            <h3 className="text-[10px] font-black uppercase text-muted-foreground mb-3 tracking-widest border-b pb-1">Critères de recherche</h3>
            <div className="flex gap-3">
              <div className="h-8 w-8 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                <Wallet className="h-4 w-4" />
              </div>
              <div className="flex flex-col">
                <span className="text-xs text-muted-foreground font-medium">Budget Envisagé</span>
                <span className="text-sm font-bold">{formatDA(client.budget)} → {formatDA(client.budgetMax)}</span>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="h-8 w-8 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                <Building2 className="h-4 w-4" />
              </div>
              <div className="flex flex-col">
                <span className="text-xs text-muted-foreground font-medium">Type recherché</span>
                <span className="text-sm font-bold">
                  {client.propertyType || "-"} 
                  {client.minRooms ? ` • ${client.minRooms} Pièces` : ''}
                  {client.minArea ? ` • ${client.minArea}m²` : ''}
                </span>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="h-8 w-8 rounded-full bg-teal-50 text-teal-600 flex items-center justify-center shrink-0">
                <MapPin className="h-4 w-4" />
              </div>
              <div className="flex flex-col">
                <span className="text-xs text-muted-foreground font-medium">Zone souhaitée</span>
                <span className="text-sm font-bold">{client.desiredLocation || "-"}</span>
              </div>
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
