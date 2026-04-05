"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Clock,
  User,
  MapPin,
  Home,
  CheckCircle2,
  XCircle,
  CalendarClock,
  Eye,
} from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import type { PlanningVisit } from "./types";

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  PLANNED: { label: "Programmée", color: "bg-blue-100 text-blue-700 border-blue-200" },
  CONFIRMED: { label: "Confirmée", color: "bg-green-100 text-green-700 border-green-200" },
  DONE: { label: "Terminée", color: "bg-gray-100 text-gray-700 border-gray-200" },
  CANCELLED: { label: "Annulée", color: "bg-red-100 text-red-700 border-red-200" },
  POSTPONED: { label: "Reportée", color: "bg-orange-100 text-orange-700 border-orange-200" },
};

interface VisitDetailPopupProps {
  visit: PlanningVisit | null;
  open: boolean;
  onClose: () => void;
  onAction: (visitId: string, action: string) => void;
}

export function VisitDetailPopup({ visit, open, onClose, onAction }: VisitDetailPopupProps) {
  if (!visit) return null;
  const status = STATUS_CONFIG[visit.status] || STATUS_CONFIG.PLANNED;

  return (
    <Dialog open={open} onOpenChange={(o: boolean) => !o && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-1">
            <div className="p-2 rounded-xl bg-primary/10 text-primary">
              <Eye className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-black">Détails de la visite</DialogTitle>
              <DialogDescription>
                {format(new Date(visit.scheduledAt), "EEEE dd MMMM yyyy 'à' HH:mm", { locale: fr })}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="flex items-center justify-between">
            <Badge variant="outline" className={cn("text-xs font-black uppercase", status.color)}>
              {status.label}
            </Badge>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <User className="h-4 w-4 text-blue-500 shrink-0" />
                <div>
                  <p className="text-xs font-bold text-muted-foreground uppercase">Client</p>
                  <p className="font-bold">{visit.clientName}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Home className="h-4 w-4 text-indigo-500 shrink-0" />
                <div>
                  <p className="text-xs font-bold text-muted-foreground uppercase">Bien</p>
                  <p className="font-medium">{visit.propertyName}</p>
                </div>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="h-4 w-4 text-green-500 shrink-0" />
                <div>
                  <p className="text-xs font-bold text-muted-foreground uppercase">Agent</p>
                  <p className="font-medium">{visit.agentName}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4 text-amber-500 shrink-0" />
                <div>
                  <p className="text-xs font-bold text-muted-foreground uppercase">Heure</p>
                  <p className="font-mono font-bold">{format(new Date(visit.scheduledAt), "HH:mm")}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          {visit.status !== "DONE" && visit.status !== "CANCELLED" && (
            <>
              <Button
                size="sm"
                onClick={() => onAction(visit.id, "CONFIRMED")}
                className="gap-1.5 font-bold bg-green-600 hover:bg-green-700 text-white"
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                Confirmer
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => onAction(visit.id, "DONE")}
                className="gap-1.5 font-bold border-gray-300"
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                Terminée
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => onAction(visit.id, "POSTPONED")}
                className="gap-1.5 font-bold border-orange-300 text-orange-700 hover:bg-orange-50"
              >
                <CalendarClock className="h-3.5 w-3.5" />
                Reporter
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => onAction(visit.id, "CANCELLED")}
                className="gap-1.5 font-bold border-red-300 text-red-700 hover:bg-red-50"
              >
                <XCircle className="h-3.5 w-3.5" />
                Annuler
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
