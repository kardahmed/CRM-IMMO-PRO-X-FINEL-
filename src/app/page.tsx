"use client";

import Link from "next/link";
import {
  Sparkles,
  Kanban,
  ArrowRight,
  Building2,
  Zap,
  Globe,
  PieChart,
  Users,
  Map,
  Shield,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { Logo } from "@/components/ui/Logo";
import { cn } from "@/lib/utils";

export default function LandingPage() {
  const { user, isLoaded } = useSupabaseAuth();
  const isSignedIn = isLoaded && !!user;

  return (
    <div className="min-h-screen bg-background text-foreground font-sans selection:bg-primary/30 overflow-x-hidden">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 border-b border-neutral-100 bg-white/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <Logo width={32} height={32} />
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm font-bold text-muted-foreground hover:text-primary transition-colors uppercase tracking-widest">Solutions</a>
            <a href="#pricing" className="text-sm font-bold text-muted-foreground hover:text-primary transition-colors uppercase tracking-widest">Tarifs</a>
            <Link href="/sign-up" className="text-sm font-bold text-primary hover:opacity-80 transition-opacity uppercase tracking-widest underline underline-offset-4 decoration-2">Essai Gratuit</Link>
          </div>
          <div className="flex items-center gap-4">
            {!isSignedIn ? (
              <>
                <Link href="/sign-in">
                  <Button variant="ghost" className="text-muted-foreground hover:text-primary font-bold text-sm uppercase tracking-widest"> Connexion </Button>
                </Link>
                <Link href="/sign-up">
                  <Button className="bg-primary text-white hover:opacity-90 shadow-stripe font-black text-sm px-8 h-11 rounded-full uppercase tracking-widest"> Démarrer </Button>
                </Link>
              </>
            ) : (
              <Link href="/dashboard">
                <Button className="bg-primary hover:opacity-90 text-white font-black text-sm px-8 h-11 rounded-full gap-2 shadow-stripe-lg uppercase tracking-widest">
                  Tableau de bord <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-24 pb-32 px-6">
        <div className="max-w-6xl mx-auto text-center space-y-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/5 border border-primary/10 text-primary text-[10px] font-black tracking-[0.2em] uppercase mb-4">
            <Sparkles className="h-3.5 w-3.5" /> Nouveau : IA PRO-X v2.5
          </div>
          <h1 className="text-6xl lg:text-8xl font-black text-neutral-900 tracking-tight leading-[1] italic">
            L&apos;immobilier <br />
            <span className="text-primary">en Algérie</span>, version 2.0.
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto font-medium leading-relaxed">
            Propulser votre agence avec la technologie SaaS leader du marché algérien. IA, Pipeline interactif et Automatisation intelligente.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-8">
            <Link href="/sign-up">
              <Button className="h-16 px-12 bg-primary hover:opacity-90 text-white font-black text-lg rounded-full shadow-stripe-lg group transition-all">
                Démarrer <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <Link href="#pricing">
              <Button variant="outline" className="h-16 px-12 border-neutral-200 text-neutral-900 hover:bg-neutral-50 font-bold text-lg rounded-full">Tarifs</Button>
            </Link>
          </div>

          <div className="pt-20">
            <div className="relative mx-auto max-w-4xl rounded-[32px] border border-neutral-100 bg-white p-3 shadow-stripe-lg overflow-hidden">
              <div className="aspect-video bg-neutral-50 rounded-[24px] flex items-center justify-center border border-neutral-100 relative overflow-hidden group">
                <div className="text-center space-y-6 px-10 z-10 transition-transform group-hover:scale-105 duration-700">
                  <Logo showText={false} width={80} height={80} className="mx-auto" />
                  <h3 className="text-3xl font-black text-neutral-900 italic tracking-tighter uppercase">IMMO PRO-X</h3>
                  <p className="text-xs text-muted-foreground font-black uppercase tracking-[0.3em]">Moteur de Conversion Immobilière</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="border-y border-neutral-100 bg-white py-20 px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-12 text-center">
          {[
            { value: "48+", label: "Agences Immobilières" },
            { value: "1.4B", label: "Volume Géré DA", color: "text-primary" },
            { value: "420+", label: "Agents Actifs", color: "text-primary" },
            { value: "18k", label: "Biens Indexés" },
          ].map((stat, i) => (
            <div key={i} className="space-y-1">
              <p className={cn("text-5xl font-black tabular-nums tracking-tighter", stat.color || "text-neutral-900")}>{stat.value}</p>
              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="py-16 px-6 border-t border-neutral-100 bg-white">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-10">
          <div className="flex items-center gap-4">
            <Logo showText={false} width={24} height={24} />
            <span className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">IMMO PRO-X &bull; 2026</span>
          </div>
          <div className="flex items-center gap-10 text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">
            <a href="#" className="hover:text-primary transition-colors">Confidentialité</a>
            <a href="#" className="hover:text-primary transition-colors">Conditions Générales</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
