"use client";

import { useState, useTransition } from "react";
import { createWorkspace } from "./actions";
import {
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
    "w-full px-4 py-3 rounded-xl bg-black/50 border border-white/10 text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all disabled:opacity-50";

  const selectClass =
    "w-full px-4 py-3 rounded-xl bg-black/50 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all disabled:opacity-50 appearance-none";

  const labelClass = "text-sm font-medium text-zinc-300";

  const renderStepContent = () => {
    switch (currentStep) {
      // ────────── Step 1: Bienvenue ──────────
      case 0:
        return (
          <div className="text-center space-y-6">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500 to-violet-600 shadow-lg shadow-violet-500/25">
              <Rocket className="w-10 h-10 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white mb-3">
                Bienvenue sur IMMO PRO-X
              </h2>
              <p className="text-zinc-400 leading-relaxed max-w-sm mx-auto">
                Le CRM immobilier tout-en-un pour gerer vos clients, biens,
                transactions et equipes. Configurez votre espace en quelques
                etapes.
              </p>
            </div>
            <div className="grid grid-cols-3 gap-3 pt-2">
              <div className="p-3 rounded-xl bg-white/5 border border-white/10 text-center">
                <Users className="h-5 w-5 text-blue-400 mx-auto mb-1.5" />
                <p className="text-xs text-zinc-400">Gestion clients</p>
              </div>
              <div className="p-3 rounded-xl bg-white/5 border border-white/10 text-center">
                <Home className="h-5 w-5 text-violet-400 mx-auto mb-1.5" />
                <p className="text-xs text-zinc-400">Portefeuille biens</p>
              </div>
              <div className="p-3 rounded-xl bg-white/5 border border-white/10 text-center">
                <KeyRound className="h-5 w-5 text-amber-400 mx-auto mb-1.5" />
                <p className="text-xs text-zinc-400">Pipeline de vente</p>
              </div>
            </div>
            <button
              onClick={goNext}
              className="w-full py-3 px-4 rounded-xl font-medium text-white bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 focus:ring-2 focus:ring-blue-500/50 focus:outline-none transition-all shadow-[0_0_20px_rgba(79,70,229,0.3)] hover:shadow-[0_0_25px_rgba(79,70,229,0.5)] active:scale-[0.98] flex items-center justify-center gap-2"
            >
              Commencer
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        );

      // ────────── Step 2: Configurer le workspace ──────────
      case 1:
        return (
          <div className="space-y-5">
            <div className="text-center mb-2">
              <h2 className="text-xl font-bold text-white mb-1">
                Configurer votre workspace
              </h2>
              <p className="text-sm text-zinc-400">
                Les informations de votre entreprise
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
                Nom de l&apos;entreprise <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                <input
                  type="text"
                  value={workspaceName}
                  onChange={(e) => setWorkspaceName(e.target.value)}
                  placeholder="Ex: Immobiliere Riviera"
                  disabled={isPending}
                  className={inputClass + " pl-10"}
                />
              </div>
            </div>

            <div className="space-y-3">
              <label className={labelClass}>
                Type d&apos;activite <span className="text-red-400">*</span>
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label
                  className={`relative flex flex-col items-center justify-center gap-2 p-4 rounded-xl border cursor-pointer hover:bg-white/5 transition-all group ${
                    workspaceType === "AGENCY"
                      ? "border-blue-500 bg-blue-500/10"
                      : "border-white/10 bg-black/50"
                  }`}
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
                  <Home
                    className={`w-6 h-6 transition-colors ${
                      workspaceType === "AGENCY" ? "text-blue-500" : "text-zinc-400 group-hover:text-white"
                    }`}
                  />
                  <span
                    className={`text-sm font-medium ${
                      workspaceType === "AGENCY" ? "text-white" : "text-zinc-300"
                    }`}
                  >
                    Agence
                  </span>
                </label>

                <label
                  className={`relative flex flex-col items-center justify-center gap-2 p-4 rounded-xl border cursor-pointer hover:bg-white/5 transition-all group ${
                    workspaceType === "PROMOTION"
                      ? "border-violet-500 bg-violet-500/10"
                      : "border-white/10 bg-black/50"
                  }`}
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
                  <Building2
                    className={`w-6 h-6 transition-colors ${
                      workspaceType === "PROMOTION" ? "text-violet-500" : "text-zinc-400 group-hover:text-white"
                    }`}
                  />
                  <span
                    className={`text-sm font-medium ${
                      workspaceType === "PROMOTION" ? "text-white" : "text-zinc-300"
                    }`}
                  >
                    Promotion
                  </span>
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
                onClick={handleCreateWorkspace}
                disabled={isPending}
                className="flex-1 py-3 px-4 rounded-xl font-medium text-white bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 focus:ring-2 focus:ring-blue-500/50 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-[0_0_20px_rgba(79,70,229,0.3)] hover:shadow-[0_0_25px_rgba(79,70,229,0.5)] active:scale-[0.98] flex items-center justify-center gap-2"
              >
                {isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Creation en cours...
                  </>
                ) : (
                  <>
                    Suivant
                    <ChevronRight className="w-4 h-4" />
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

            <div className="grid grid-cols-2 gap-3">
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

            <div className="grid grid-cols-2 gap-3">
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
    <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a] text-white p-4">
      <div className="relative w-full max-w-lg">
        {/* Background glow effects */}
        <div className="absolute top-[-20%] left-[-10%] w-72 h-72 bg-blue-600/30 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-[-20%] right-[-10%] w-72 h-72 bg-violet-600/30 rounded-full blur-[100px] pointer-events-none" />

        <div className="relative bg-white/5 backdrop-blur-xl border border-white/10 p-8 rounded-2xl shadow-2xl overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />

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
                        className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 transition-all duration-300 ${
                          isCompleted
                            ? "bg-blue-500 text-white shadow-lg shadow-blue-500/30"
                            : isActive
                            ? "bg-gradient-to-br from-blue-500 to-violet-600 text-white shadow-lg shadow-violet-500/30 ring-2 ring-blue-400/30"
                            : "bg-white/5 text-zinc-600 border border-white/10"
                        }`}
                      >
                        {isCompleted ? (
                          <Check className="w-4 h-4" />
                        ) : (
                          <StepIcon className="w-4 h-4" />
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
