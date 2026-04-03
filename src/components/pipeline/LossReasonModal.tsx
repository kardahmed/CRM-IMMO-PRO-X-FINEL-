"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { AlertTriangle } from "lucide-react";
import { useState } from "react";

const LOSS_REASONS = [
  "Budget insuffisant",
  "A trouvé ailleurs",
  "Injoignable",
  "Pas intéressé finalement",
  "Délai trop long",
  "Problème de financement",
  "Autre",
];

interface LossReasonModalProps {
  open: boolean;
  clientName: string;
  onConfirm: (reason: string, details?: string) => void;
  onCancel: () => void;
}

export function LossReasonModal({
  open,
  clientName,
  onConfirm,
  onCancel,
}: LossReasonModalProps) {
  const [reason, setReason] = useState("");
  const [details, setDetails] = useState("");

  const handleConfirm = () => {
    if (!reason) return;
    onConfirm(reason, details || undefined);
    setReason("");
    setDetails("");
  };

  const handleCancel = () => {
    setReason("");
    setDetails("");
    onCancel();
  };

  return (
    <Dialog open={open} onOpenChange={(o: boolean) => !o && handleCancel()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-1">
            <div className="p-2 rounded-full bg-red-100 text-red-600">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <DialogTitle className="text-lg font-black">
              Marquer comme perdu
            </DialogTitle>
          </div>
          <DialogDescription>
            Vous déplacez <strong className="text-foreground">{clientName}</strong> vers
            &quot;Perdue&quot;. La raison est obligatoire.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <label className="text-sm font-bold">
              Raison de la perte <span className="text-red-500">*</span>
            </label>
            <Select value={reason} onValueChange={setReason}>
              <SelectTrigger className="border-neutral-200 dark:border-neutral-800">
                <SelectValue placeholder="Sélectionner une raison" />
              </SelectTrigger>
              <SelectContent>
                {LOSS_REASONS.map((r) => (
                  <SelectItem key={r} value={r}>
                    {r}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">
              Détails (optionnel)
            </label>
            <Textarea
              placeholder="Commentaires supplémentaires..."
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              rows={3}
              className="resize-none border-neutral-200 dark:border-neutral-800"
            />
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={handleCancel}>
            Annuler
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={!reason}
            className="font-bold"
          >
            Confirmer la perte
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
