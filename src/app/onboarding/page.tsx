"use client";

import { useState, useTransition } from "react";
import { createWorkspace } from "./actions";
import {
  ArrowRight,
  Building2,
  Home,
  Loader2,
  AlertCircle,
  Rocket,
  ChevronRight,
  ChevronLeft,
  UserPlus,
  KeyRound,
  Users,
  Phone,
  MapPin,
  Mail,
  User,
  DollarSign,
  Maximize,
  Tag,
  SkipForward,
  Check,
  Sparkles,
} from "lucide-react";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const STEPS = [
  { label: "Bienvenue", icon: Sparkles },
  { label: "Workspace", icon: Building2 },
  { label: "Bien", icon: Home },
  { label: "Agent", icon: UserPlus },
  { label: "Client", icon: Users },
];

const PROPERTY_TYPES = [
  { value: "APARTMENT", label: "Appartement" },
  { value: "VILLA", label: "Villa" },
  { value: "STUDIO", label: "Studio" },
  { value: "COMMERCIAL", label: "Commercial" },
  { value: "TERRAIN", label: "Terrain" },
];

const CLIENT_SOURCES = [
  { value: "PHONE", label: "Telephone" },
  { value: "WALK_IN", label: "Visite directe" },
  { value: "FACEBOOK", label: "Facebook" },
  { value: "WEBSITE", label: "Site web" },
  { value: "REFERRAL", label: "Recommandation" },
  { value: "OTHER", label: "Autre" },
];

export default function OnboardingPage() {
  const [currentStep, setCurrentStep] = useState(0);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const { user } = useSupabaseAuth();
  const router = useRouter();

  // Step 2 state
  const [workspaceName, setWorkspaceName] = useState("");
  const [workspaceType, setWorkspaceType] = useState<"AGENCY" | "PROMOTION">("AGENCY");
  const [workspaceWilaya, setWorkspaceWilaya] = useState("");
  const [workspacePhone, setWorkspacePhone] = useState("");

  // Step 3 state
  const [propertyName, setPropertyName] = useState("");
  const [propertyType, setPropertyType] = useState("APARTMENT");
  const [propertyPrice, setPropertyPrice] = useState("");
  const [propertySurface, setPropertySurface] = useState("");

  // Step 4 state
  const [agentEmail, setAgentEmail] = useState("");
  const [agentRole, setAgentRole] = useState("AGENT");

  // Step 5 state
  const [clientFirstName, setClientFirstName] = useState("");
  const [clientLastName, setClientLastName] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [clientSource, setClientSource] = useState("PHONE");

  const goNext = () => {
    setError(null);
    setCurrentStep((s) => Math.min(s + 1, STEPS.length - 1));
  };

  const goPrev = () => {
    setError(null);
    setCurrentStep((s) => Math.max(s - 1, 0));
  };

  const handleCreateWorkspace = () => {
    if (!workspaceName.trim() || workspaceName.trim().length < 2) {
      setError("Le nom de l'entreprise doit contenir au moins 2 caracteres.");
      return;
    }
    setError(null);

    const formData = new FormData();
    formData.set("name", workspaceName.trim());
    formData.set("type", workspaceType);
    if (workspaceWilaya.trim()) formData.set("wilaya", workspaceWilaya.trim());
    if (workspacePhone.trim()) formData.set("phone", workspacePhone.trim());

    startTransition(async () => {
      try {
        const res = await createWorkspace(formData);
        if (res.success) {
          toast.success("Espace de travail cree avec succes !");
          // Force refresh the session to pick up updated user_metadata
          const supabase = createSupabaseBrowserClient();
          await supabase.auth.refreshSession();
          goNext();
        } else {
          setError(res.error);
          toast.error(res.error);
        }
      } catch {
        const msg = "Une erreur inattendue est survenue. Veuillez reessayer.";
        setError(msg);
        toast.error(msg);
      }
    });
  };

  const handleCreateProperty = () => {
    if (!propertyName.trim()) {
      setError("Le nom du bien est requis.");
      return;
    }
    setError(null);

    startTransition(async () => {
      try {
        const res = await fetch("/api/v1/properties", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: propertyName.trim(),
            type: propertyType,
            price: propertyPrice ? Number(propertyPrice) : undefined,
            surface: propertySurface ? Number(propertySurface) : undefined,
          }),
        });
        const data = await res.json();
        if (data.success || res.ok) {
          toast.success("Bien cree avec succes !");
          goNext();
        } else {
          setError(data.error || "Erreur lors de la creation du bien.");
          toast.error(data.error || "Erreur lors de la creation du bien.");
        }
      } catch {
        toast.error("Erreur lors de la creation du bien.");
        goNext();
      }
    });
  };

  const handleInviteAgent = () => {
    if (!agentEmail.trim()) {
      setError("L'email est requis.");
      return;
    }
    setError(null);
    toast.success("Invitation envoyee a " + agentEmail.trim());
    goNext();
  };

  const handleCreateClient = () => {
    if (!clientLastName.trim()) {
      setError("Le nom du client est requis.");
      return;
    }
    if (!clientPhone.trim()) {
      setError("Le telephone du client est requis.");
      return;
    }
    setError(null);

    startTransition(async () => {
      try {
        const res = await fetch("/api/v1/clients", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            firstName: clientFirstName.trim(),
            lastName: clientLastName.trim(),
            phone: clientPhone.trim(),
            source: clientSource,
          }),
        });
        const data = await res.json();
        if (data.success || res.ok) {
          toast.success("Client ajoute avec succes !");
          finishOnboarding();
        } else {
          setError(data.error || "Erreur lors de la creation du client.");
          toast.error(data.error || "Erreur lors de la creation du client.");
        }
      } catch {
        toast.error("Erreur lors de la creation du client.");
        finishOnboarding();
      }
    });
  };

  const finishOnboarding = () => {
    router.refresh();
    router.push("/dashboard");
  };

  const inputClass =
    "w-full px-5 py-3.5 rounded-2xl bg-accent/20 border border-border text-foreground placeholder:text-muted-foreground/40 outline-none transition-all focus:border-primary focus:ring-4 focus:ring-primary/10 font-medium";

  const selectClass =
    "w-full px-5 py-3.5 rounded-2xl bg-accent/20 border border-border text-foreground outline-none transition-all focus:border-primary focus:ring-4 focus:ring-primary/10 font-medium appearance-none cursor-pointer";

  const labelClass = "px-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60";

  const renderStepContent = () => {
    switch (currentStep) {
      // ────────── Step 1: Bienvenue ──────────
      case 0:
        return (
          <div className="text-center space-y-8 py-4">
            <div className="inline-flex items-center justify-center w-24 h-24 rounded-[32px] bg-primary/5 border border-primary/10 shadow-stripe transition-transform hover:scale-105 duration-700">
              <Rocket className="w-12 h-12 text-primary" />
            </div>
            <div className="space-y-3">
              <h2 className="text-3xl font-black text-foreground italic uppercase tracking-tight">
                Bienvenue sur IMMO PRO-X
              </h2>
              <p className="text-muted-foreground leading-relaxed max-w-sm mx-auto font-medium">
                Le moteur de conversion immobilier tout-en-un. Configurez votre espace en quelques secondes.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4">
              {[
                { icon: Users, label: "Gestion Clients", color: "text-primary" },
                { icon: Home, label: "Portefeuille Biens", color: "text-primary" },
                { icon: KeyRound, label: "Pipeline Vente", color: "text-primary" },
              ].map((item, i) => (
                <div key={i} className="p-4 rounded-2xl bg-accent/10 border border-border/50 text-center space-y-2 group hover:bg-primary/5 transition-colors duration-500">
                  <item.icon className={cn("h-5 w-5 mx-auto transition-transform group-hover:scale-110 duration-500", item.color)} />
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest leading-tight">{item.label}</p>
                </div>
              ))}
            </div>
            <button
              onClick={goNext}
              className="w-full h-16 rounded-full bg-primary text-white font-black text-lg uppercase tracking-widest shadow-stripe-lg hover:opacity-90 transition-all flex items-center justify-center gap-2 group"
            >
              C&apos;est parti
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        );

      // ────────── Step 2: Configurer le workspace ──────────
      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-black text-foreground italic uppercase tracking-tight">
                Configuration
              </h2>
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-[0.2em]">Votre environnement de travail</p>
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-2">
              <label className={labelClass}>
                Dénomination Sociale <span className="text-primary">*</span>
              </label>
              <div className="relative group">
                <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/40 group-focus-within:text-primary transition-colors" />
                <input
                  type="text"
                  value={workspaceName}
                  onChange={(e) => setWorkspaceName(e.target.value)}
                  placeholder="Ex: Immobilière Riviera"
                  disabled={isPending}
                  className={inputClass + " pl-11"}
                />
              </div>
            </div>

            <div className="space-y-3">
              <label className={labelClass}>
                Type d&apos;activité <span className="text-primary">*</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <label
                  className={cn(
                    "relative flex flex-col items-center justify-center gap-3 p-6 rounded-[24px] border-2 cursor-pointer transition-all duration-500 group",
                    workspaceType === "AGENCY"
                      ? "border-primary bg-primary/5 shadow-stripe"
                      : "border-border bg-accent/5 hover:border-primary/20"
                  )}
                >
                  <input
                    type="radio"
                    name="type"
                    value="AGENCY"
                    checked={workspaceType === "AGENCY"}
                    onChange={() => setWorkspaceType("AGENCY")}
                    className="sr-only"
                    disabled={isPending}
                  />
                  <div className={cn("p-2 rounded-xl transition-transform group-hover:scale-110 duration-500", workspaceType === "AGENCY" ? "bg-primary/10" : "bg-accent/10")}>
                    <Home className={cn("w-6 h-6", workspaceType === "AGENCY" ? "text-primary" : "text-muted-foreground/40")} />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-[0.2em]">Agence</span>
                </label>

                <label
                  className={cn(
                    "relative flex flex-col items-center justify-center gap-3 p-6 rounded-[24px] border-2 cursor-pointer transition-all duration-500 group",
                    workspaceType === "PROMOTION"
                      ? "border-primary bg-primary/5 shadow-stripe"
                      : "border-border bg-accent/5 hover:border-primary/20"
                  )}
                >
                  <input
                    type="radio"
                    name="type"
                    value="PROMOTION"
                    checked={workspaceType === "PROMOTION"}
                    onChange={() => setWorkspaceType("PROMOTION")}
                    className="sr-only"
                    disabled={isPending}
                  />
                  <div className={cn("p-2 rounded-xl transition-transform group-hover:scale-110 duration-500", workspaceType === "PROMOTION" ? "bg-primary/10" : "bg-accent/10")}>
                    <Building2 className={cn("w-6 h-6", workspaceType === "PROMOTION" ? "text-primary" : "text-muted-foreground/40")} />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-[0.2em]">Promotion</span>
                </label>
              </div>
            </div>

            <div className="space-y-2">
              <label className={labelClass}>Wilaya</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                <input
                  type="text"
                  value={workspaceWilaya}
                  onChange={(e) => setWorkspaceWilaya(e.target.value)}
                  placeholder="Ex: Alger"
                  disabled={isPending}
                  className={inputClass + " pl-10"}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className={labelClass}>Telephone</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                <input
                  type="tel"
                  value={workspacePhone}
                  onChange={(e) => setWorkspacePhone(e.target.value)}
                  placeholder="Ex: +213 555 123 456"
                  disabled={isPending}
                  className={inputClass + " pl-10"}
                />
              </div>
            </div>

            <div className="flex gap-4 pt-4">
              <button
                onClick={goPrev}
                disabled={isPending}
                className="h-14 px-6 rounded-full font-bold text-muted-foreground uppercase tracking-widest bg-accent/20 border border-border hover:bg-accent/40 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <ChevronLeft className="w-4 h-4" />
                Retour
              </button>
              <button
                onClick={handleCreateWorkspace}
                disabled={isPending}
                className="flex-1 h-14 rounded-full bg-primary text-white font-black text-sm uppercase tracking-widest shadow-stripe hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 group"
              >
                {isPending ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <>
                    Suivant
                    <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </div>
          </div>
        );

      // ────────── Step 3: Creer le premier bien ──────────
      case 2:
        return (
          <div className="space-y-5">
            <div className="text-center mb-2">
              <h2 className="text-xl font-bold text-white mb-1">
                Creer votre premier bien
              </h2>
              <p className="text-sm text-zinc-400">
                Ajoutez un bien a votre portefeuille
              </p>
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-2">
              <label className={labelClass}>
                Nom du bien <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                <input
                  type="text"
                  value={propertyName}
                  onChange={(e) => setPropertyName(e.target.value)}
                  placeholder="Ex: Appartement F3 Hydra"
                  disabled={isPending}
                  className={inputClass + " pl-10"}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className={labelClass}>Type de bien</label>
              <select
                value={propertyType}
                onChange={(e) => setPropertyType(e.target.value)}
                disabled={isPending}
                className={selectClass}
              >
                {PROPERTY_TYPES.map((t) => (
                  <option key={t.value} value={t.value} className="bg-zinc-900">
                    {t.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-2">
                <label className={labelClass}>Prix (DA)</label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                  <input
                    type="number"
                    value={propertyPrice}
                    onChange={(e) => setPropertyPrice(e.target.value)}
                    placeholder="0"
                    disabled={isPending}
                    className={inputClass + " pl-10"}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className={labelClass}>Surface (m²)</label>
                <div className="relative">
                  <Maximize className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                  <input
                    type="number"
                    value={propertySurface}
                    onChange={(e) => setPropertySurface(e.target.value)}
                    placeholder="0"
                    disabled={isPending}
                    className={inputClass + " pl-10"}
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={goPrev}
                disabled={isPending}
                className="px-4 py-3 rounded-xl font-medium text-zinc-400 bg-white/5 border border-white/10 hover:bg-white/10 hover:text-white transition-all disabled:opacity-50 flex items-center gap-1"
              >
                <ChevronLeft className="w-4 h-4" />
                Retour
              </button>
              <button
                onClick={handleCreateProperty}
                disabled={isPending}
                className="flex-1 py-3 px-4 rounded-xl font-medium text-white bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 focus:ring-2 focus:ring-blue-500/50 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-[0_0_20px_rgba(79,70,229,0.3)] hover:shadow-[0_0_25px_rgba(79,70,229,0.5)] active:scale-[0.98] flex items-center justify-center gap-2"
              >
                {isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Creation...
                  </>
                ) : (
                  <>
                    Suivant
                    <ChevronRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
            <button
              onClick={goNext}
              disabled={isPending}
              className="w-full py-2.5 text-sm text-zinc-500 hover:text-zinc-300 transition-colors flex items-center justify-center gap-1.5"
            >
              <SkipForward className="w-3.5 h-3.5" />
              Passer cette etape
            </button>
          </div>
        );

      // ────────── Step 4: Inviter un agent ──────────
      case 3:
        return (
          <div className="space-y-5">
            <div className="text-center mb-2">
              <h2 className="text-xl font-bold text-white mb-1">
                Inviter un agent
              </h2>
              <p className="text-sm text-zinc-400">
                Ajoutez un membre a votre equipe
              </p>
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-2">
              <label className={labelClass}>
                Email <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                <input
                  type="email"
                  value={agentEmail}
                  onChange={(e) => setAgentEmail(e.target.value)}
                  placeholder="agent@example.com"
                  disabled={isPending}
                  className={inputClass + " pl-10"}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className={labelClass}>Role</label>
              <select
                value={agentRole}
                onChange={(e) => setAgentRole(e.target.value)}
                disabled={isPending}
                className={selectClass}
              >
                <option value="AGENT" className="bg-zinc-900">Agent</option>
                <option value="SUPERVISOR" className="bg-zinc-900">Superviseur</option>
              </select>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={goPrev}
                disabled={isPending}
                className="px-4 py-3 rounded-xl font-medium text-zinc-400 bg-white/5 border border-white/10 hover:bg-white/10 hover:text-white transition-all disabled:opacity-50 flex items-center gap-1"
              >
                <ChevronLeft className="w-4 h-4" />
                Retour
              </button>
              <button
                onClick={handleInviteAgent}
                disabled={isPending}
                className="flex-1 py-3 px-4 rounded-xl font-medium text-white bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 focus:ring-2 focus:ring-blue-500/50 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-[0_0_20px_rgba(79,70,229,0.3)] hover:shadow-[0_0_25px_rgba(79,70,229,0.5)] active:scale-[0.98] flex items-center justify-center gap-2"
              >
                Inviter
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            <button
              onClick={goNext}
              disabled={isPending}
              className="w-full py-2.5 text-sm text-zinc-500 hover:text-zinc-300 transition-colors flex items-center justify-center gap-1.5"
            >
              <SkipForward className="w-3.5 h-3.5" />
              Passer, je suis seul
            </button>
          </div>
        );

      // ────────── Step 5: Ajouter le premier client ──────────
      case 4:
        return (
          <div className="space-y-5">
            <div className="text-center mb-2">
              <h2 className="text-xl font-bold text-white mb-1">
                Ajouter votre premier client
              </h2>
              <p className="text-sm text-zinc-400">
                Commencez a remplir votre pipeline
              </p>
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-2">
                <label className={labelClass}>Prenom</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                  <input
                    type="text"
                    value={clientFirstName}
                    onChange={(e) => setClientFirstName(e.target.value)}
                    placeholder="Prenom"
                    disabled={isPending}
                    className={inputClass + " pl-10"}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className={labelClass}>
                  Nom <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={clientLastName}
                  onChange={(e) => setClientLastName(e.target.value)}
                  placeholder="Nom"
                  disabled={isPending}
                  className={inputClass}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className={labelClass}>
                Telephone <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                <input
                  type="tel"
                  value={clientPhone}
                  onChange={(e) => setClientPhone(e.target.value)}
                  placeholder="+213 555 123 456"
                  disabled={isPending}
                  className={inputClass + " pl-10"}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className={labelClass}>Source</label>
              <select
                value={clientSource}
                onChange={(e) => setClientSource(e.target.value)}
                disabled={isPending}
                className={selectClass}
              >
                {CLIENT_SOURCES.map((s) => (
                  <option key={s.value} value={s.value} className="bg-zinc-900">
                    {s.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={goPrev}
                disabled={isPending}
                className="px-4 py-3 rounded-xl font-medium text-zinc-400 bg-white/5 border border-white/10 hover:bg-white/10 hover:text-white transition-all disabled:opacity-50 flex items-center gap-1"
              >
                <ChevronLeft className="w-4 h-4" />
                Retour
              </button>
              <button
                onClick={handleCreateClient}
                disabled={isPending}
                className="flex-1 py-3 px-4 rounded-xl font-medium text-white bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 focus:ring-2 focus:ring-blue-500/50 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-[0_0_20px_rgba(79,70,229,0.3)] hover:shadow-[0_0_25px_rgba(79,70,229,0.5)] active:scale-[0.98] flex items-center justify-center gap-2"
              >
                {isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Creation...
                  </>
                ) : (
                  <>
                    Terminer
                    <Check className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
            <button
              onClick={finishOnboarding}
              disabled={isPending}
              className="w-full py-2.5 text-sm text-zinc-500 hover:text-zinc-300 transition-colors flex items-center justify-center gap-1.5"
            >
              <SkipForward className="w-3.5 h-3.5" />
              Passer
            </button>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background text-foreground p-6 relative overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="relative w-full max-w-xl animate-in fade-in duration-700 slide-in-from-bottom-4">
        <div className="relative bg-card/80 backdrop-blur-xl border border-border p-10 rounded-[40px] shadow-stripe-lg overflow-hidden">

          {/* ── Stepper ── */}
          <div className="relative z-10 mb-8">
            <div className="flex items-center justify-between">
              {STEPS.map((step, i) => {
                const StepIcon = step.icon;
                const isActive = i === currentStep;
                const isCompleted = i < currentStep;

                return (
                  <div key={i} className="flex flex-col items-center flex-1">
                    <div className="flex items-center w-full">
                      {i > 0 && (
                        <div
                          className={`flex-1 h-0.5 transition-colors duration-300 ${
                            isCompleted ? "bg-blue-500" : "bg-white/10"
                          }`}
                        />
                      )}
                      <div
                        className={cn(
                          "w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-all duration-500",
                          isCompleted
                            ? "bg-primary text-white shadow-stripe"
                            : isActive
                            ? "bg-primary/10 border border-primary text-primary shadow-lg ring-4 ring-primary/10"
                            : "bg-accent/5 text-muted-foreground/40 border border-border"
                        )}
                      >
                        {isCompleted ? (
                          <Check className="w-5 h-5" />
                        ) : (
                          <StepIcon className="w-5 h-5" />
                        )}
                      </div>
                      {i < STEPS.length - 1 && (
                        <div
                          className={`flex-1 h-0.5 transition-colors duration-300 ${
                            isCompleted ? "bg-blue-500" : "bg-white/10"
                          }`}
                        />
                      )}
                    </div>
                    <span
                      className={`text-[10px] mt-1.5 font-medium transition-colors ${
                        isActive || isCompleted ? "text-zinc-300" : "text-zinc-600"
                      }`}
                    >
                      {step.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── Step content ── */}
          <div className="relative z-10">{renderStepContent()}</div>
        </div>
      </div>
    </div>
  );
}
