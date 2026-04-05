"use client";

import { useState } from "react";
import { Clock, Mail, Phone, Crown, Zap, Building2, CheckCircle2, ArrowRight } from "lucide-react";
import Link from "next/link";
import { Logo } from "@/components/ui/Logo";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const SUPER_ADMIN = {
  name: "Ahmed KARD",
  email: "contact@immopro-x.dz",
  phone: "+213 555 123 456",
};

const PLANS = [
  {
    id: "STARTER",
    name: "Starter",
    price: "9 900 DA/mois",
    icon: Zap,
    color: "text-primary",
    bg: "bg-primary/5",
    border: "border-primary/20",
    features: ["10 clients", "5 biens", "2 utilisateurs", "Support email"],
  },
  {
    id: "PRO",
    name: "Pro",
    price: "24 900 DA/mois",
    icon: Crown,
    color: "text-primary",
    bg: "bg-primary/10",
    border: "border-primary/40",
    popular: true,
    features: ["Clients illimités", "Biens illimités", "10 utilisateurs", "Support prioritaire", "Automatisations"],
  },
  {
    id: "BUSINESS",
    name: "Business",
    price: "49 900 DA/mois",
    icon: Building2,
    color: "text-primary",
    bg: "bg-primary/5",
    border: "border-primary/20",
    features: ["Tout illimité", "Utilisateurs illimités", "Accès API", "Support dédié", "Formation incluse"],
  },
];

export default function DemoExpiredPage() {
  const [selectedPlan, setSelectedPlan] = useState<string | null>("PRO");

  return (
    <div className="flex min-h-screen items-center justify-center bg-background text-foreground p-6 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="relative w-full max-w-4xl animate-in fade-in duration-700 slide-in-from-bottom-4">
        <div className="relative bg-card/80 backdrop-blur-xl border border-border p-10 rounded-[40px] shadow-stripe-lg">
          
          <header className="text-center mb-12">
            <Logo width={48} height={48} className="mx-auto justify-center mb-8" />
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-primary/5 border border-primary/10 mb-6">
              <Clock className="w-8 h-8 text-primary animate-pulse" />
            </div>
            <h1 className="text-4xl font-black tracking-tight mb-4 italic uppercase">
              Période d&apos;essai terminée
            </h1>
            <p className="text-muted-foreground max-w-xl mx-auto font-medium">
              Votre espace de démonstration de 14 jours a expiré. Pas d&apos;inquiétude, vos données sont en sécurité et seront restaurées dès l&apos;activation de votre abonnement.
            </p>
          </header>

          {/* Plans */}
          <div className="mb-10">
            <div className="flex items-center justify-between mb-6 px-1">
              <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-[0.3em]">
                Sélectionnez votre solution
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {PLANS.map((plan) => {
                const Icon = plan.icon;
                const isSelected = selectedPlan === plan.id;
                return (
                  <button
                    key={plan.id}
                    onClick={() => setSelectedPlan(plan.id)}
                    className={cn(
                      "relative p-6 rounded-[32px] border-2 text-left transition-all duration-500 hover:shadow-stripe group",
                      isSelected
                        ? "border-primary bg-primary/5 shadow-stripe"
                        : "border-border hover:border-primary/20 bg-accent/5"
                    )}
                  >
                    {plan.popular && (
                      <span className="absolute -top-3 right-6 bg-primary text-white text-[10px] font-black uppercase px-3 py-1 rounded-full shadow-stripe">
                        Populaire
                      </span>
                    )}
                    <div className="flex items-center gap-3 mb-4">
                      <div className={cn("p-2 rounded-xl border border-primary/10 transition-transform group-hover:scale-110 duration-500", plan.bg)}>
                        <Icon className={cn("h-5 w-5", plan.color)} />
                      </div>
                      <span className="font-bold text-sm tracking-tight">{plan.name}</span>
                    </div>
                    <div className="space-y-1 mb-6">
                      <p className="text-xl font-black text-foreground">{plan.price}</p>
                    </div>
                    <ul className="space-y-2.5">
                      {plan.features.map((f) => (
                        <li key={f} className="flex items-center gap-2 text-xs text-muted-foreground font-medium">
                          <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-primary" />
                          {f}
                        </li>
                      ))}
                    </ul>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Contact & Action */}
          <div className="grid md:grid-cols-2 gap-6 items-center pt-8 border-t border-border/50">
            <div className="space-y-4">
              <div>
                <p className="text-xs font-bold text-primary uppercase tracking-widest mb-1">Besoin d&apos;assistance ?</p>
                <p className="text-xs text-muted-foreground font-medium leading-relaxed">
                  Notre équipe est disponible pour configurer votre accès définitif. Contactez Ahmed KARD pour une activation rapide.
                </p>
              </div>
              <div className="flex flex-col gap-2">
                <a
                  href={`tel:${SUPER_ADMIN.phone.replace(/\s/g, "")}`}
                  className="flex items-center gap-3 py-3 px-5 rounded-2xl bg-accent/20 border border-border text-sm font-bold hover:bg-accent/40 transition-all group"
                >
                  <Phone className="h-4 w-4 text-primary group-hover:rotate-12 transition-transform" />
                  {SUPER_ADMIN.phone}
                </a>
                <a
                  href={`mailto:${SUPER_ADMIN.email}?subject=${encodeURIComponent(
                    `Demande upgrade ${selectedPlan ? `plan ${selectedPlan}` : ""} - IMMO PRO X`
                  )}`}
                  className="flex items-center gap-3 py-3 px-5 rounded-2xl bg-accent/20 border border-border text-sm font-bold hover:bg-accent/40 transition-all group"
                >
                  <Mail className="h-4 w-4 text-primary group-hover:-translate-y-0.5 transition-transform" />
                  {SUPER_ADMIN.email}
                </a>
              </div>
            </div>

            <div className="flex flex-col gap-3 text-center">
              <Link 
                href="/" 
                className={cn(
                  buttonVariants(),
                  "h-16 rounded-full bg-primary text-white font-black text-lg uppercase tracking-widest shadow-stripe-lg hover:opacity-90 flex items-center justify-center gap-2"
                )}
              >
                Retour à l&apos;accueil <ArrowRight className="h-5 w-5" />
              </Link>
              <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-[0.2em] animate-pulse">
                Accès en lecture seule disponible
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
