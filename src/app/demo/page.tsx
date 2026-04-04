"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Rocket, Send, Loader2, CheckCircle2, Clock, Users, Building2, AlertCircle } from "lucide-react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";

const WILAYAS = [
  "Alger", "Oran", "Constantine", "Annaba", "Blida", "Batna", "Setif",
  "Tlemcen", "Bejaia", "Tizi Ouzou", "Djelfa", "Biskra", "Chlef",
  "Mostaganem", "Medea", "Tiaret", "Bouira", "Bordj Bou Arreridj",
  "Boumerdes", "Skikda", "Tipaza", "Msila", "Mascara", "Ouargla",
  "Ghardaia", "Relizane", "Ain Defla", "Ain Temouchent", "El Oued",
  "Jijel", "Mila", "Souk Ahras", "Guelma", "Khenchela",
];

interface DemoResponse {
  success: boolean;
  data?: {
    message: string;
    tenantId: string;
    expiresAt?: string;
    limits?: { maxClients: number; maxProperties: number; maxUsers: number };
    alreadyExists?: boolean;
  };
  error?: string;
}

export default function DemoPage() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [responseData, setResponseData] = useState<DemoResponse["data"] | null>(null);
  const [form, setForm] = useState({
    companyName: "",
    companyType: "",
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    wilaya: "",
    agentCount: "",
    message: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/v1/demo-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data: DemoResponse = await res.json();

      if (!data.success) {
        setError(data.error || "Une erreur est survenue");
        return;
      }

      setResponseData(data.data ?? null);
      setSuccess(true);
    } catch {
      setError("Erreur de connexion. Veuillez reessayer.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-neutral-950 text-white">
        <div className="max-w-md w-full text-center space-y-6">
          <div className="mx-auto w-24 h-24 bg-green-500/10 rounded-full flex items-center justify-center">
            <CheckCircle2 className="h-12 w-12 text-green-500" />
          </div>
          <h1 className="text-3xl font-black tracking-tight">
            {responseData?.alreadyExists ? "Compte demo existant" : "Votre espace demo est pret !"}
          </h1>
          <p className="text-neutral-400">
            {responseData?.alreadyExists
              ? "Un espace demo existe deja pour cet email. Connectez-vous pour y acceder."
              : "Votre espace demo a ete cree avec succes. Creez votre compte pour y acceder."}
          </p>

          {!responseData?.alreadyExists && (
            <div className="grid grid-cols-3 gap-4 py-4">
              <div className="text-center p-3 rounded-xl bg-neutral-900 border border-neutral-800">
                <Clock className="h-5 w-5 text-indigo-400 mx-auto mb-1" />
                <p className="text-xs text-neutral-400">Duree</p>
                <p className="text-sm font-bold text-white">14 jours</p>
              </div>
              <div className="text-center p-3 rounded-xl bg-neutral-900 border border-neutral-800">
                <Users className="h-5 w-5 text-indigo-400 mx-auto mb-1" />
                <p className="text-xs text-neutral-400">Clients</p>
                <p className="text-sm font-bold text-white">5 max</p>
              </div>
              <div className="text-center p-3 rounded-xl bg-neutral-900 border border-neutral-800">
                <Building2 className="h-5 w-5 text-indigo-400 mx-auto mb-1" />
                <p className="text-xs text-neutral-400">Biens</p>
                <p className="text-sm font-bold text-white">3 max</p>
              </div>
            </div>
          )}

          <Link href="/sign-up">
            <Button className="w-full h-12 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl">
              Creer mon compte
            </Button>
          </Link>
          <Link href="/">
            <Button variant="ghost" className="w-full text-neutral-400 hover:text-white">
              Retour a l&apos;accueil
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-white selection:bg-indigo-500/30 flex flex-col md:flex-row">
      {/* Left side: branding */}
      <div className="md:w-1/2 p-8 md:p-16 lg:p-24 flex flex-col justify-center border-b md:border-b-0 md:border-r border-neutral-800/50">
        <Link href="/" className="flex items-center gap-2 mb-12">
          <div className="h-8 w-8 rounded bg-indigo-500 flex items-center justify-center">
            <Rocket className="h-4 w-4 text-white" />
          </div>
          <span className="font-black text-xl tracking-tight">IMMO PRO-X</span>
        </Link>

        <h1 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tighter leading-[1.1] mb-6">
          Testez <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">gratuitement</span> pendant 14 jours.
        </h1>
        <p className="text-lg text-neutral-400 font-medium mb-10 max-w-xl">
          Acces immediat a un espace demo complet avec donnees d&apos;exemple. Aucune carte bancaire requise.
        </p>

        <div className="space-y-6 text-neutral-300">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-indigo-500/10 flex items-center justify-center shrink-0">
              <CheckCircle2 className="h-5 w-5 text-indigo-400" />
            </div>
            <p>Espace demo cree instantanement</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-cyan-500/10 flex items-center justify-center shrink-0">
              <CheckCircle2 className="h-5 w-5 text-cyan-400" />
            </div>
            <p>5 clients, 3 biens, 1 utilisateur inclus</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-purple-500/10 flex items-center justify-center shrink-0">
              <CheckCircle2 className="h-5 w-5 text-purple-400" />
            </div>
            <p>Pipeline, cartographie et IA disponibles</p>
          </div>
        </div>
      </div>

      {/* Right side: form */}
      <div className="md:w-1/2 p-8 md:p-16 lg:p-24 flex flex-col justify-center relative overflow-hidden">
        <div className="absolute top-1/4 -right-1/4 w-[500px] h-[500px] bg-indigo-500/20 rounded-full blur-[120px] pointer-events-none" />

        <Card className="bg-neutral-900/50 border-neutral-800 backdrop-blur-xl relative z-10 w-full max-w-md mx-auto">
          <CardContent className="p-8">
            <h2 className="text-2xl font-black mb-6 text-white text-center">Demander une demo</h2>

            {error && (
              <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center gap-2 text-sm text-red-400">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Company */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-neutral-400 uppercase">Nom de l&apos;entreprise *</label>
                <Input
                  required
                  className="bg-neutral-950/50 border-neutral-800 focus:border-indigo-500 text-white"
                  placeholder="Ex: Groupe Immobilier El Nour"
                  value={form.companyName}
                  onChange={(e) => setForm({ ...form, companyName: e.target.value })}
                />
              </div>

              {/* Company Type */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-neutral-400 uppercase">Type d&apos;activite *</label>
                <Select
                  required
                  value={form.companyType}
                  onValueChange={(v: string | null) => setForm({ ...form, companyType: v || "" })}
                >
                  <SelectTrigger className="bg-neutral-950/50 border-neutral-800 focus:border-indigo-500 text-white">
                    <SelectValue placeholder="Selectionnez..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PROMOTION">Promotion Immobiliere</SelectItem>
                    <SelectItem value="AGENCY">Agence Immobiliere</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Name */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-neutral-400 uppercase">Prenom *</label>
                  <Input
                    required
                    className="bg-neutral-950/50 border-neutral-800 focus:border-indigo-500 text-white"
                    value={form.firstName}
                    onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-neutral-400 uppercase">Nom *</label>
                  <Input
                    required
                    className="bg-neutral-950/50 border-neutral-800 focus:border-indigo-500 text-white"
                    value={form.lastName}
                    onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                  />
                </div>
              </div>

              {/* Contact */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-neutral-400 uppercase">Email professionnel *</label>
                <Input
                  required
                  type="email"
                  className="bg-neutral-950/50 border-neutral-800 focus:border-indigo-500 text-white"
                  placeholder="vous@entreprise.dz"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-neutral-400 uppercase">Telephone *</label>
                  <Input
                    required
                    className="bg-neutral-950/50 border-neutral-800 focus:border-indigo-500 text-white"
                    placeholder="+213 5XX XXX XXX"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-neutral-400 uppercase">Wilaya</label>
                  <Select onValueChange={(v: string | null) => setForm({ ...form, wilaya: v || "" })}>
                    <SelectTrigger className="bg-neutral-950/50 border-neutral-800 focus:border-indigo-500 text-white">
                      <SelectValue placeholder="Selectionnez..." />
                    </SelectTrigger>
                    <SelectContent className="max-h-60">
                      {WILAYAS.map((w) => (
                        <SelectItem key={w} value={w}>{w}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Agents */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-neutral-400 uppercase">Nombre d&apos;agents estime</label>
                <Select onValueChange={(v: string | null) => setForm({ ...form, agentCount: v || "" })}>
                  <SelectTrigger className="bg-neutral-950/50 border-neutral-800 focus:border-indigo-500 text-white">
                    <SelectValue placeholder="Taille de l'equipe" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1-5">1 - 5 agents</SelectItem>
                    <SelectItem value="6-20">6 - 20 agents</SelectItem>
                    <SelectItem value="21-50">21 - 50 agents</SelectItem>
                    <SelectItem value="50+">Plus de 50</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Message */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-neutral-400 uppercase">Message (Optionnel)</label>
                <Textarea
                  className="bg-neutral-950/50 border-neutral-800 focus:border-indigo-500 text-white resize-none"
                  rows={3}
                  placeholder="Dites-nous en plus sur vos besoins..."
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                />
              </div>

              <Button
                disabled={loading || !form.companyType}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white h-12 rounded-lg font-bold text-sm tracking-wide gap-2 mt-2"
              >
                {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
                Creer mon espace demo
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
