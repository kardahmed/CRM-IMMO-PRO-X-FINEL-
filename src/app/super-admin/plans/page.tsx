"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  CreditCard,
  Save,
  Loader2,
  Zap,
  Crown,
  Building2,
  Rocket,
  Users,
  Home,
  Brain,
  HardDrive,
  MessageCircle,
  Facebook,
  MapPin,
  Code2,
  Headphones,
  Download,
} from "lucide-react";
import { cn } from "@/lib/utils";

/* -------------------------------------------------------------------------- */
/*  Types                                                                     */
/* -------------------------------------------------------------------------- */

interface IPlanFeatures {
  whatsapp: boolean;
  facebookLeads: boolean;
  googleMaps: boolean;
  apiAccess: boolean;
  supportPrioritaire: boolean;
  exportDonnees: boolean;
}

interface IPlanConfig {
  name: string;
  maxUsers: number;
  maxClients: number;
  maxProperties: number;
  aiGenerationsPerMonth: number;
  documentStorage: string;
  features: IPlanFeatures;
}

type PlanKey = "STARTER" | "PRO" | "BUSINESS" | "ENTERPRISE";

/* -------------------------------------------------------------------------- */
/*  Defaults                                                                  */
/* -------------------------------------------------------------------------- */

const DEFAULT_PLANS: Record<PlanKey, IPlanConfig> = {
  STARTER: {
    name: "Starter",
    maxUsers: 3,
    maxClients: 50,
    maxProperties: 20,
    aiGenerationsPerMonth: 10,
    documentStorage: "1 GB",
    features: {
      whatsapp: false,
      facebookLeads: false,
      googleMaps: false,
      apiAccess: false,
      supportPrioritaire: false,
      exportDonnees: false,
    },
  },
  PRO: {
    name: "Pro",
    maxUsers: 10,
    maxClients: 500,
    maxProperties: 200,
    aiGenerationsPerMonth: 100,
    documentStorage: "10 GB",
    features: {
      whatsapp: true,
      facebookLeads: false,
      googleMaps: true,
      apiAccess: false,
      supportPrioritaire: false,
      exportDonnees: true,
    },
  },
  BUSINESS: {
    name: "Business",
    maxUsers: 25,
    maxClients: 2000,
    maxProperties: 1000,
    aiGenerationsPerMonth: 500,
    documentStorage: "50 GB",
    features: {
      whatsapp: true,
      facebookLeads: true,
      googleMaps: true,
      apiAccess: false,
      supportPrioritaire: true,
      exportDonnees: true,
    },
  },
  ENTERPRISE: {
    name: "Enterprise",
    maxUsers: -1,
    maxClients: -1,
    maxProperties: -1,
    aiGenerationsPerMonth: -1,
    documentStorage: "Illimité",
    features: {
      whatsapp: true,
      facebookLeads: true,
      googleMaps: true,
      apiAccess: true,
      supportPrioritaire: true,
      exportDonnees: true,
    },
  },
};

/* -------------------------------------------------------------------------- */
/*  Plan styling                                                              */
/* -------------------------------------------------------------------------- */

const PLAN_META: Record<PlanKey, { icon: React.ElementType; accent: string; badge: string; badgeColor: string }> = {
  STARTER: {
    icon: Zap,
    accent: "text-blue-500",
    badge: "Basique",
    badgeColor: "text-blue-600 border-blue-600/30 bg-blue-500/5",
  },
  PRO: {
    icon: Rocket,
    accent: "text-violet-500",
    badge: "Populaire",
    badgeColor: "text-violet-600 border-violet-600/30 bg-violet-500/5",
  },
  BUSINESS: {
    icon: Building2,
    accent: "text-amber-500",
    badge: "Avancé",
    badgeColor: "text-amber-600 border-amber-600/30 bg-amber-500/5",
  },
  ENTERPRISE: {
    icon: Crown,
    accent: "text-emerald-500",
    badge: "Premium",
    badgeColor: "text-emerald-600 border-emerald-600/30 bg-emerald-500/5",
  },
};

const FEATURE_META: { key: keyof IPlanFeatures; label: string; icon: React.ElementType }[] = [
  { key: "whatsapp", label: "WhatsApp Integration", icon: MessageCircle },
  { key: "facebookLeads", label: "Facebook Leads", icon: Facebook },
  { key: "googleMaps", label: "Google Maps", icon: MapPin },
  { key: "apiAccess", label: "API Access", icon: Code2 },
  { key: "supportPrioritaire", label: "Support Prioritaire", icon: Headphones },
  { key: "exportDonnees", label: "Export Données", icon: Download },
];

/* -------------------------------------------------------------------------- */
/*  Helper: display value                                                     */
/* -------------------------------------------------------------------------- */

function displayLimit(value: number): string {
  return value === -1 ? "∞" : String(value);
}

/* -------------------------------------------------------------------------- */
/*  Limit Field                                                               */
/* -------------------------------------------------------------------------- */

function LimitField({
  icon: Icon,
  label,
  value,
  onChange,
}: {
  icon: React.ElementType;
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  const isUnlimited = value === -1;

  return (
    <div className="space-y-1.5">
      <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
        <Icon className="h-3 w-3" />
        {label}
      </Label>
      {isUnlimited ? (
        <div className="h-10 flex items-center justify-center rounded-xl bg-primary/5 border border-primary/10">
          <span className="text-lg font-black text-primary">∞</span>
        </div>
      ) : (
        <Input
          type="number"
          min={-1}
          value={value}
          onChange={(e) => {
            const v = Number(e.target.value);
            onChange(v);
          }}
          className="bg-background border-border text-foreground tabular-nums text-center font-bold h-10 rounded-xl"
        />
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Storage Field                                                             */
/* -------------------------------------------------------------------------- */

function StorageField({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const isUnlimited = value === "Illimité";

  return (
    <div className="space-y-1.5">
      <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
        <HardDrive className="h-3 w-3" />
        Stockage Documents
      </Label>
      {isUnlimited ? (
        <div className="h-10 flex items-center justify-center rounded-xl bg-primary/5 border border-primary/10">
          <span className="text-lg font-black text-primary">∞</span>
        </div>
      ) : (
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="bg-background border-border text-foreground text-center font-bold h-10 rounded-xl"
        />
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Plan Card                                                                 */
/* -------------------------------------------------------------------------- */

function PlanCard({
  planKey,
  plan,
  onUpdate,
}: {
  planKey: PlanKey;
  plan: IPlanConfig;
  onUpdate: (updated: IPlanConfig) => void;
}) {
  const meta = PLAN_META[planKey];
  const Icon = meta.icon;

  const updateLimit = (field: keyof IPlanConfig, value: number) => {
    onUpdate({ ...plan, [field]: value });
  };

  const updateFeature = (featureKey: keyof IPlanFeatures, value: boolean) => {
    onUpdate({
      ...plan,
      features: { ...plan.features, [featureKey]: value },
    });
  };

  return (
    <Card className="bg-card border-border shadow-stripe rounded-[24px] overflow-hidden flex flex-col">
      {/* Header */}
      <CardHeader className="p-5 border-b border-border/50">
        <div className="flex items-center justify-between mb-3">
          <div className={cn("p-2.5 rounded-xl border", `bg-${meta.accent}/5 border-${meta.accent}/10`)}>
            <Icon className={cn("h-5 w-5", meta.accent)} />
          </div>
          <Badge variant="outline" className={cn("text-[10px] font-bold uppercase tracking-wider", meta.badgeColor)}>
            {meta.badge}
          </Badge>
        </div>
        <CardTitle className="text-lg font-black text-foreground tracking-tight uppercase">
          {plan.name}
        </CardTitle>
      </CardHeader>

      {/* Limits */}
      <CardContent className="p-5 space-y-4 flex-1 flex flex-col">
        <div className="space-y-3">
          <p className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-[0.2em]">Limites</p>
          <div className="grid grid-cols-2 gap-3">
            <LimitField
              icon={Users}
              label="Max Utilisateurs"
              value={plan.maxUsers}
              onChange={(v) => updateLimit("maxUsers", v)}
            />
            <LimitField
              icon={Users}
              label="Max Clients"
              value={plan.maxClients}
              onChange={(v) => updateLimit("maxClients", v)}
            />
            <LimitField
              icon={Home}
              label="Max Biens"
              value={plan.maxProperties}
              onChange={(v) => updateLimit("maxProperties", v)}
            />
            <LimitField
              icon={Brain}
              label="IA / Mois"
              value={plan.aiGenerationsPerMonth}
              onChange={(v) => updateLimit("aiGenerationsPerMonth", v)}
            />
          </div>
          <StorageField
            value={plan.documentStorage}
            onChange={(v) => onUpdate({ ...plan, documentStorage: v })}
          />
        </div>

        {/* Features */}
        <div className="space-y-3 mt-auto pt-4 border-t border-border/50">
          <p className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-[0.2em]">Fonctionnalités</p>
          <div className="space-y-2">
            {FEATURE_META.map(({ key, label, icon: FeatureIcon }) => (
              <div
                key={key}
                className={cn(
                  "flex items-center justify-between py-2 px-3 rounded-xl border transition-colors",
                  plan.features[key]
                    ? "bg-primary/5 border-primary/10"
                    : "bg-accent/30 border-border/50"
                )}
              >
                <div className="flex items-center gap-2">
                  <FeatureIcon className={cn("h-3.5 w-3.5", plan.features[key] ? "text-primary" : "text-muted-foreground/50")} />
                  <span className={cn("text-xs font-bold", plan.features[key] ? "text-foreground" : "text-muted-foreground/60")}>
                    {label}
                  </span>
                </div>
                <Switch
                  checked={plan.features[key]}
                  onCheckedChange={(v) => updateFeature(key, v)}
                />
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/* -------------------------------------------------------------------------- */
/*  Main Page                                                                 */
/* -------------------------------------------------------------------------- */

export default function SuperAdminPlans() {
  const [plans, setPlans] = useState<Record<PlanKey, IPlanConfig>>(DEFAULT_PLANS);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    // TODO: POST to /api/v1/admin/plans
    await new Promise((r) => setTimeout(r, 1200));
    setSaving(false);
    toast.success("Configuration des plans sauvegardée", {
      description: "Les changements seront appliqués aux nouveaux workspaces.",
    });
  };

  const updatePlan = (key: PlanKey, updated: IPlanConfig) => {
    setPlans((prev) => ({ ...prev, [key]: updated }));
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-700 slide-in-from-bottom-4">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-4 border-b border-border/50">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/5 border border-primary/10 text-primary text-xs font-bold uppercase tracking-[0.2em] mb-2">
            <CreditCard className="h-3 w-3" /> Gestion des Plans
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-foreground tracking-tighter italic uppercase underline decoration-primary decoration-8 underline-offset-8">
            Plans
          </h1>
          <p className="text-sm text-muted-foreground mt-2">
            Définissez les limites et fonctionnalités incluses dans chaque plan d&apos;abonnement.
          </p>
        </div>
        <Button
          onClick={handleSave}
          disabled={saving}
          className="bg-primary hover:bg-primary/90 text-primary-foreground font-black uppercase tracking-wider rounded-2xl px-8 py-6 text-sm shadow-stripe"
        >
          {saving ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          {saving ? "Sauvegarde..." : "Sauvegarder"}
        </Button>
      </header>

      {/* Plan Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {(Object.keys(plans) as PlanKey[]).map((key) => (
          <PlanCard
            key={key}
            planKey={key}
            plan={plans[key]}
            onUpdate={(updated) => updatePlan(key, updated)}
          />
        ))}
      </div>

      {/* Footer hint */}
      <div className="flex items-center justify-center py-6">
        <p className="text-xs text-muted-foreground/50 font-bold uppercase tracking-[0.2em]">
          Utilisez -1 dans un champ numérique pour passer en illimité
        </p>
      </div>
    </div>
  );
}
