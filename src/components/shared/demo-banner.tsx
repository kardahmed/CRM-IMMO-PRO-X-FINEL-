"use client";

import { useState } from "react";
import { AlertTriangle, Clock, ArrowRight, Phone, Mail, CheckCircle2, Crown, Zap, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

// ---- Super Admin contact info ----
const SUPER_ADMIN = {
  name: "Ahmed KARD",
  email: "contact@immopro-x.dz",
  phone: "+213 555 123 456",
};

// ---- Plans ----
const PLANS = [
  {
    id: "STARTER",
    name: "Starter",
    price: "9 900 DA/mois",
    icon: Zap,
    color: "text-blue-500",
    bg: "bg-blue-500/10",
    border: "border-blue-500/30",
    features: ["10 clients", "5 biens", "2 utilisateurs", "Support email"],
  },
  {
    id: "PRO",
    name: "Pro",
    price: "24 900 DA/mois",
    icon: Crown,
    color: "text-purple-500",
    bg: "bg-purple-500/10",
    border: "border-purple-500/30",
    popular: true,
    features: ["Clients illimites", "Biens illimites", "10 utilisateurs", "Support prioritaire", "Automatisations"],
  },
  {
    id: "BUSINESS",
    name: "Business",
    price: "49 900 DA/mois",
    icon: Building2,
    color: "text-amber-500",
    bg: "bg-amber-500/10",
    border: "border-amber-500/30",
    features: ["Tout illimite", "Utilisateurs illimites", "API access", "Support dedie", "Formation incluse"],
  },
];

interface DemoBannerProps {
  expiresAt?: string | null;
}

export function DemoBanner({ expiresAt }: DemoBannerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);

  const daysLeft = expiresAt
    ? Math.max(0, Math.ceil((new Date(expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : null;

  const isExpiring = daysLeft !== null && daysLeft <= 3;

  return (
    <>
      <div
        className={`flex items-center justify-between gap-4 px-4 py-2.5 text-sm font-medium ${
          isExpiring
            ? "bg-amber-500/10 border-b border-amber-500/20 text-amber-300"
            : "bg-emerald-500/10 border-b border-emerald-500/20 text-emerald-300"
        }`}
      >
        <div className="flex items-center gap-2 min-w-0">
          {isExpiring ? (
            <AlertTriangle className="h-4 w-4 shrink-0" />
          ) : (
            <Clock className="h-4 w-4 shrink-0" />
          )}
          <span className="truncate">
            <span className="font-bold">Version Demo</span>
            {daysLeft !== null && (
              <span className="hidden sm:inline">
                {" "}&mdash; {daysLeft === 0
                  ? "Expire aujourd'hui"
                  : `${daysLeft} jour${daysLeft > 1 ? "s" : ""} restant${daysLeft > 1 ? "s" : ""}`}
              </span>
            )}
            <span className="hidden md:inline text-xs opacity-70 ml-2">
              (5 clients, 3 biens, 1 utilisateur max)
            </span>
          </span>
        </div>
        <Button
          size="sm"
          onClick={() => setIsOpen(true)}
          className={`h-7 text-xs font-bold rounded-full px-3 gap-1 shrink-0 ${
            isExpiring
              ? "bg-amber-500 hover:bg-amber-600 text-black"
              : "bg-primary hover:bg-primary/90 text-white"
          }`}
        >
          Passer au Pro <ArrowRight className="h-3 w-3" />
        </Button>
      </div>

      {/* Upgrade Dialog */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black flex items-center gap-2">
              <Crown className="h-6 w-6 text-purple-500" /> Passer au plan payant
            </DialogTitle>
            <DialogDescription>
              Choisissez le plan qui correspond a vos besoins. Contactez-nous pour activer votre abonnement.
            </DialogDescription>
          </DialogHeader>

          {/* Plans Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-4">
            {PLANS.map((plan) => {
              const Icon = plan.icon;
              const isSelected = selectedPlan === plan.id;
              return (
                <button
                  key={plan.id}
                  onClick={() => setSelectedPlan(plan.id)}
                  className={`relative p-4 rounded-xl border-2 text-left transition-all hover:shadow-md ${
                    isSelected
                      ? `${plan.border} ${plan.bg} shadow-md`
                      : "border-border hover:border-muted-foreground/30"
                  }`}
                >
                  {plan.popular && (
                    <Badge className="absolute -top-2.5 right-3 bg-purple-600 text-white text-xs font-black uppercase">
                      Populaire
                    </Badge>
                  )}
                  <div className="flex items-center gap-2 mb-3">
                    <div className={`p-1.5 rounded-lg ${plan.bg}`}>
                      <Icon className={`h-4 w-4 ${plan.color}`} />
                    </div>
                    <span className="font-black text-sm">{plan.name}</span>
                  </div>
                  <p className="text-lg font-black mb-3">{plan.price}</p>
                  <ul className="space-y-1.5">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <CheckCircle2 className={`h-3 w-3 shrink-0 ${plan.color}`} />
                        {f}
                      </li>
                    ))}
                  </ul>
                </button>
              );
            })}
          </div>

          {/* Contact Section */}
          <div className="mt-4 p-4 rounded-xl bg-accent/50 border space-y-3">
            <p className="text-sm font-black">Contactez-nous pour activer votre plan</p>
            <p className="text-xs text-muted-foreground">
              {selectedPlan
                ? `Vous avez selectionne le plan ${PLANS.find((p) => p.id === selectedPlan)?.name}. Contactez-nous pour finaliser votre abonnement.`
                : "Selectionnez un plan ci-dessus, puis contactez-nous par telephone ou email."}
            </p>
            <div className="flex flex-col sm:flex-row gap-2">
              <a
                href={`tel:${SUPER_ADMIN.phone.replace(/\s/g, "")}`}
                className="flex-1"
              >
                <Button variant="outline" className="w-full gap-2 font-bold text-sm h-10">
                  <Phone className="h-4 w-4 text-green-500" />
                  {SUPER_ADMIN.phone}
                </Button>
              </a>
              <a
                href={`mailto:${SUPER_ADMIN.email}?subject=${encodeURIComponent(
                  `Demande upgrade ${selectedPlan ? `plan ${selectedPlan}` : ""} - IMMO PRO X`
                )}`}
                className="flex-1"
              >
                <Button variant="outline" className="w-full gap-2 font-bold text-sm h-10">
                  <Mail className="h-4 w-4 text-blue-500" />
                  {SUPER_ADMIN.email}
                </Button>
              </a>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
