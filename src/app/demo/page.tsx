"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Rocket, Send, Loader2, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";

export default function DemoPage() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    companyName: "",
    email: "",
    phone: "",
    employees: "",
    message: ""
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    // Simulate API call to the backend server to create a DemoLead
    setTimeout(() => {
      setLoading(false);
      setSuccess(true);
    }, 1500);
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-neutral-950 text-white">
        <div className="max-w-md w-full text-center space-y-6">
          <div className="mx-auto w-24 h-24 bg-green-500/10 rounded-full flex items-center justify-center">
            <CheckCircle2 className="h-12 w-12 text-green-500" />
          </div>
          <h1 className="text-3xl font-black tracking-tight">Demande envoyée !</h1>
          <p className="text-neutral-400">
            Notre équipe a bien reçu votre demande. Nous vous contacterons dans les prochaines 24h ouvrées pour organiser une démonstration personnalisée.
          </p>
          <Link href="/">
            <Button variant="outline" className="mt-8 border-neutral-800 text-white hover:bg-neutral-800 rounded-full w-full">
              Retour à l'accueil
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-white selection:bg-indigo-500/30 flex flex-col md:flex-row">
      {/* Left side: branding/copy */}
      <div className="md:w-1/2 p-8 md:p-16 lg:p-24 flex flex-col justify-center border-b md:border-b-0 md:border-r border-neutral-800/50">
        <div className="flex items-center gap-2 mb-12">
          <div className="h-8 w-8 rounded bg-indigo-500 flex items-center justify-center">
            <Rocket className="h-4 w-4 text-white" />
          </div>
          <span className="font-black text-xl tracking-tight">IMMO PRO-X</span>
        </div>
        
        <h1 className="text-4xl md:text-5xl lg:text-7xl font-black tracking-tighter leading-[1.1] mb-6">
          Prenez le contrôle de votre <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">croissance</span>.
        </h1>
        <p className="text-lg md:text-xl text-neutral-400 font-medium mb-10 max-w-xl">
          Découvrez comment le CRM immobilier le plus avancé du marché peut transformer votre agence ou groupe de promotion immobilière.
        </p>

        <div className="space-y-6 text-neutral-300">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-indigo-500/10 flex items-center justify-center shrink-0">
              <CheckCircle2 className="h-5 w-5 text-indigo-400" />
            </div>
            <p>Une interface claire, rapide et ultra-moderne</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-cyan-500/10 flex items-center justify-center shrink-0">
              <CheckCircle2 className="h-5 w-5 text-cyan-400" />
            </div>
            <p>Automatisez vos relances clients et tâches répétitives</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-purple-500/10 flex items-center justify-center shrink-0">
              <CheckCircle2 className="h-5 w-5 text-purple-400" />
            </div>
            <p>L'IA Copilot incluse pour générer vos fiches et e-mails</p>
          </div>
        </div>
      </div>

      {/* Right side: form */}
      <div className="md:w-1/2 p-8 md:p-16 lg:p-24 flex flex-col justify-center relative overflow-hidden">
        {/* Glow effect */}
        <div className="absolute top-1/4 -right-1/4 w-[500px] h-[500px] bg-indigo-500/20 rounded-full blur-[120px] pointer-events-none" />
        
        <Card className="bg-neutral-900/50 border-neutral-800 backdrop-blur-xl relative z-10 w-full max-w-md mx-auto">
          <CardContent className="p-8">
            <h2 className="text-2xl font-black mb-6 text-white text-center">Réserver une démo</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-neutral-400 uppercase">Prénom</label>
                  <Input required className="bg-neutral-950/50 border-neutral-800 focus:border-indigo-500 text-white" value={form.firstName} onChange={(e) => setForm({...form, firstName: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-neutral-400 uppercase">Nom</label>
                  <Input required className="bg-neutral-950/50 border-neutral-800 focus:border-indigo-500 text-white" value={form.lastName} onChange={(e) => setForm({...form, lastName: e.target.value})} />
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-xs font-bold text-neutral-400 uppercase">Nom de l'entreprise</label>
                <Input required className="bg-neutral-950/50 border-neutral-800 focus:border-indigo-500 text-white" value={form.companyName} onChange={(e) => setForm({...form, companyName: e.target.value})} />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-neutral-400 uppercase">Email professionnel</label>
                <Input required type="email" className="bg-neutral-950/50 border-neutral-800 focus:border-indigo-500 text-white" value={form.email} onChange={(e) => setForm({...form, email: e.target.value})} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-neutral-400 uppercase">Téléphone</label>
                  <Input required className="bg-neutral-950/50 border-neutral-800 focus:border-indigo-500 text-white" value={form.phone} onChange={(e) => setForm({...form, phone: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-neutral-400 uppercase">Employés</label>
                  <Select onValueChange={(v: string | null) => setForm({...form, employees: v || ""})}>
                    <SelectTrigger className="bg-neutral-950/50 border-neutral-800 focus:border-indigo-500 text-white">
                      <SelectValue placeholder="Taille" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1-5">1 - 5 employés</SelectItem>
                      <SelectItem value="6-20">6 - 20 employés</SelectItem>
                      <SelectItem value="21-50">21 - 50 employés</SelectItem>
                      <SelectItem value="50+">Plus de 50</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-neutral-400 uppercase">Message (Optionnel)</label>
                <Textarea className="bg-neutral-950/50 border-neutral-800 focus:border-indigo-500 text-white resize-none" rows={3} value={form.message} onChange={(e) => setForm({...form, message: e.target.value})} />
              </div>

              <Button disabled={loading} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white h-12 rounded-lg font-bold text-sm tracking-wide gap-2 mt-2">
                {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
                Demander ma démo
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
