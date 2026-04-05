"use client";

import { useState } from "react";
import { Clock, Mail, Phone, Crown, Zap, Building2, CheckCircle2 } from "lucide-react";
import Link from "next/link";

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
    color: "text-blue-400",
    bg: "bg-blue-500/10",
    border: "border-blue-500/40",
    features: ["10 clients", "5 biens", "2 utilisateurs", "Support email"],
  },
  {
    id: "PRO",
    name: "Pro",
    price: "24 900 DA/mois",
    icon: Crown,
    color: "text-purple-400",
    bg: "bg-purple-500/10",
    border: "border-purple-500/40",
    popular: true,
    features: ["Clients illimites", "Biens illimites", "10 utilisateurs", "Support prioritaire", "Automatisations"],
  },
  {
    id: "BUSINESS",
    name: "Business",
    price: "49 900 DA/mois",
    icon: Building2,
    color: "text-amber-400",
    bg: "bg-amber-500/10",
    border: "border-amber-500/40",
    features: ["Tout illimite", "Utilisateurs illimites", "API access", "Support dedie", "Formation incluse"],
  },
];

export default function DemoExpiredPage() {
  const [selectedPlan, setSelectedPlan] = useState<string | null>("PRO");

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0a0a0a] text-white p-4">
      <div className="relative w-full max-w-3xl">
        {/* Decorative blur */}
        <div className="absolute top-[-30%] left-[-20%] w-72 h-72 bg-amber-600/20 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-[-30%] right-[-20%] w-72 h-72 bg-rose-600/20 rounded-full blur-[120px] pointer-events-none" />

        <div className="relative bg-white/5 backdrop-blur-xl border border-white/10 p-8 rounded-2xl shadow-2xl">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-amber-500/10 mb-6">
              <Clock className="w-10 h-10 text-amber-400" />
            </div>
            <h1 className="text-3xl font-black tracking-tight mb-3">
              Periode d&apos;essai terminee
            </h1>
            <p className="text-zinc-400 leading-relaxed">
              Votre espace demo de 14 jours a expire. Vos donnees sont conservees
              et seront disponibles des l&apos;activation de votre abonnement.
            </p>
          </div>

          {/* Plans */}
          <div className="mb-6">
            <h2 className="text-sm font-bold text-zinc-300 uppercase tracking-wider mb-4">
              Choisissez votre plan
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
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
                        : "border-white/10 hover:border-white/20"
                    }`}
                  >
                    {plan.popular && (
                      <span className="absolute -top-2.5 right-3 bg-purple-600 text-white text-[9px] font-black uppercase px-2 py-0.5 rounded-full">
                        Populaire
                      </span>
                    )}
                    <div className="flex items-center gap-2 mb-3">
                      <div className={`p-1.5 rounded-lg ${plan.bg}`}>
                        <Icon className={`h-4 w-4 ${plan.color}`} />
                      </div>
                      <span className="font-black text-sm text-white">{plan.name}</span>
                    </div>
                    <p className="text-lg font-black mb-3 text-white">{plan.price}</p>
                    <ul className="space-y-1.5">
                      {plan.features.map((f) => (
                        <li key={f} className="flex items-center gap-1.5 text-xs text-zinc-400">
                          <CheckCircle2 className={`h-3 w-3 shrink-0 ${plan.color}`} />
                          {f}
                        </li>
                      ))}
                    </ul>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Contact */}
          <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-xl p-4 mb-6">
            <p className="text-sm font-bold text-indigo-300 mb-1">Contactez-nous pour activer votre plan</p>
            <p className="text-xs text-zinc-500 mb-3">
              {selectedPlan
                ? `Vous avez selectionne le plan ${PLANS.find((p) => p.id === selectedPlan)?.name}. Contactez-nous pour finaliser.`
                : "Selectionnez un plan ci-dessus, puis contactez-nous."}
            </p>
            <div className="flex flex-col sm:flex-row gap-2">
              <a
                href={`tel:${SUPER_ADMIN.phone.replace(/\s/g, "")}`}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-white/5 border border-white/10 text-sm font-bold text-white hover:bg-white/10 transition-colors"
              >
                <Phone className="h-4 w-4 text-green-400" />
                {SUPER_ADMIN.phone}
              </a>
              <a
                href={`mailto:${SUPER_ADMIN.email}?subject=${encodeURIComponent(
                  `Demande upgrade ${selectedPlan ? `plan ${selectedPlan}` : ""} - IMMO PRO X`
                )}`}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-white/5 border border-white/10 text-sm font-bold text-white hover:bg-white/10 transition-colors"
              >
                <Mail className="h-4 w-4 text-blue-400" />
                {SUPER_ADMIN.email}
              </a>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <Link
              href="/"
              className="w-full py-3 px-4 rounded-xl font-medium text-white bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-center text-sm transition-all"
            >
              Retour a l&apos;accueil
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
