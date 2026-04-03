"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { User, Sparkles, Send } from "lucide-react";
import { useState } from "react";
import type { MapFiltersState } from "./MapFilters";

const MOCK_CLIENTS = [
  {
    id: "c1",
    name: "Karim Benmohamed",
    criteria: {
      type: "APPARTEMENT",
      minPrice: "10000000",
      maxPrice: "15000000",
      rooms: "3",
      minArea: "70",
    },
  },
  {
    id: "c2",
    name: "Amira Hadj",
    criteria: {
      type: "VILLA",
      minPrice: "20000000",
      maxPrice: "35000000",
      rooms: "5",
      minArea: "150",
    },
  },
];

interface MapClientMatcherProps {
  onMatch: (filters: Partial<MapFiltersState>) => void;
  matchedCount: number;
}

export function MapClientMatcher({ onMatch, matchedCount }: MapClientMatcherProps) {
  const [selectedClient, setSelectedClient] = useState<string>("none");
  const [sending, setSending] = useState(false);

  const handleClientChange = (val: string) => {
    setSelectedClient(val);
    if (val === "none") {
      onMatch({}); // Reset Matcher
    } else {
      const client = MOCK_CLIENTS.find((c) => c.id === val);
      if (client) {
        onMatch(client.criteria);
      }
    }
  };

  const handleSend = () => {
    setSending(true);
    setTimeout(() => {
      setSending(false);
      alert(`Sélection de ${matchedCount} bien(s) envoyée au client !`);
    }, 1000);
  };

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-3 bg-white dark:bg-neutral-900 border rounded-xl shadow-sm">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 rounded-lg shrink-0">
          <Sparkles className="h-5 w-5" />
        </div>
        <div>
          <h3 className="text-sm font-black uppercase">Matcher un client</h3>
          <p className="text-[10px] font-medium text-muted-foreground">Filtre auto avec transparence</p>
        </div>
      </div>

      <div className="flex items-center gap-2 w-full sm:w-auto">
        <Select value={selectedClient} onValueChange={(v: string | null) => handleClientChange(v ?? "none")}>
          <SelectTrigger className="w-full sm:w-[220px] bg-accent/20">
            <User className="h-4 w-4 mr-2 text-muted-foreground" />
            <SelectValue placeholder="Sélectionner un client..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">Aucun client</SelectItem>
            {MOCK_CLIENTS.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {selectedClient !== "none" && (
          <Button 
            size="sm" 
            onClick={handleSend}
            disabled={sending || matchedCount === 0}
            className="gap-1.5 font-bold whitespace-nowrap bg-indigo-600 hover:bg-indigo-700 text-white"
          >
            {sending ? (
              <span className="h-4 w-4 rounded-full border-2 border-t-white border-white/30 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            Envoyer ({matchedCount})
          </Button>
        )}
      </div>
    </div>
  );
}
