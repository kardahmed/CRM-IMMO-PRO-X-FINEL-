"use client";

import Link from "next/link";
import { 
  Rocket, 
  Sparkles, 
  Kanban, 
  ShieldCheck, 
  ArrowRight, 
  Building2, 
  TrendingUp, 
  Zap,
  Globe,
  PieChart,
  Users
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { SignedIn, SignedOut } from "@clerk/nextjs";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-50 font-sans selection:bg-indigo-500/30 overflow-x-hidden">
      {/* Background Gradients */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-indigo-500/10 rounded-full blur-[120px]" />
        <div className="absolute top-[20%] -right-[10%] w-[30%] h-[30%] bg-emerald-500/5 rounded-full blur-[100px]" />
        <div className="absolute -bottom-[10%] left-[20%] w-[50%] h-[50%] bg-violet-600/5 rounded-full blur-[150px]" />
      </div>

      {/* Navbar */}
      <nav className="sticky top-0 z-50 border-b border-neutral-800/50 bg-neutral-950/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="bg-gradient-to-br from-indigo-500 to-violet-600 p-2 rounded-xl shadow-lg shadow-indigo-500/20">
              <Rocket className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-black tracking-tight text-white uppercase italic">
              IMMO PRO-X
            </span>
          </div>

          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm font-bold text-neutral-400 hover:text-white transition-colors">Solutions</a>
            <a href="#about" className="text-sm font-bold text-neutral-400 hover:text-white transition-colors">À propos</a>
            <Link href="/demo" className="text-sm font-bold text-neutral-400 hover:text-white transition-colors italic">Demo Public</Link>
          </div>

          <div className="flex items-center gap-4">
            <SignedOut>
              <Link href="/sign-in">
                <Button variant="ghost" className="text-neutral-300 hover:text-white font-bold text-sm">
                  Connexion
                </Button>
              </Link>
              <Link href="/sign-up">
                <Button className="bg-white text-black hover:bg-neutral-200 font-black text-sm px-6 rounded-full">
                  Essai Gratuit
                </Button>
              </Link>
            </SignedOut>
            <SignedIn>
              <Link href="/dashboard">
                <Button className="bg-indigo-600 hover:bg-indigo-700 text-white font-black text-sm px-6 rounded-full gap-2 shadow-lg shadow-indigo-600/20">
                  Accéder au Dashboard <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </SignedIn>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-20 pb-32 px-6">
        <div className="max-w-5xl mx-auto text-center space-y-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-black tracking-widest uppercase mb-4 animate-in fade-in slide-in-from-bottom-4">
            <Sparkles className="h-3 w-3" /> Nouveau : Moteur IA v2.5
          </div>
          
          <h1 className="text-5xl lg:text-7xl font-black text-white tracking-tight leading-[1.1] animate-in fade-in slide-in-from-bottom-8 duration-500">
            Le Futur de l'Immobilier <br /> 
            <span className="bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">
              en Algérie
            </span> est ici.
          </h1>

          <p className="text-lg md:text-xl text-neutral-400 max-w-2xl mx-auto font-medium leading-relaxed animate-in fade-in slide-in-from-bottom-12 duration-700">
            Augmentez vos ventes de 40% grâce au premier CRM SaaS conçu spécifiquement pour les promoteurs et agences algériennes. IA intégrée, Pipeline 360° et automatisation.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-6 animate-in fade-in slide-in-from-bottom-16 duration-1000">
            <Link href="/sign-up">
              <Button className="h-14 px-10 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-lg rounded-full shadow-2xl shadow-indigo-600/30 group">
                Digitalisez votre Agence <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <Link href="/demo">
              <Button variant="outline" className="h-14 px-10 border-neutral-800 text-white hover:bg-neutral-900 font-bold text-lg rounded-full">
                Voir la Démo
              </Button>
            </Link>
          </div>

          <div className="pt-20 animate-in zoom-in duration-1000">
            <div className="relative mx-auto max-w-4xl rounded-2xl border border-neutral-800 bg-neutral-900/50 p-2 lg:p-4 backdrop-blur-sm shadow-2xl overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/10 via-transparent to-emerald-500/10 opacity-50 pointer-events-none" />
              <div className="aspect-video bg-neutral-950 rounded-xl flex items-center justify-center border border-neutral-800 relative overflow-hidden">
                <div className="absolute inset-0 flex items-center justify-center opacity-20">
                  <div className="grid grid-cols-6 gap-8 grayscale">
                    <Building2 className="h-12 w-12" />
                    <Kanban className="h-12 w-12" />
                    <PieChart className="h-12 w-12" />
                    <Users className="h-12 w-12" />
                    <Building2 className="h-12 w-12" />
                    <Zap className="h-12 w-12" />
                  </div>
                </div>
                <div className="text-center space-y-4 px-6 z-10">
                  <div className="h-16 w-16 bg-indigo-500/10 rounded-full flex items-center justify-center mx-auto border border-indigo-500/20">
                    <Rocket className="h-8 w-8 text-indigo-400" />
                  </div>
                  <h3 className="text-xl font-black text-white italic tracking-tighter">IMMO PRO-X INTERFACE</h3>
                  <p className="text-sm text-neutral-500 font-mono">Ready to experience the future of real estate tech?</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="border-y border-neutral-800 bg-neutral-900/20 py-16 px-6 relative overflow-hidden">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-12 text-center relative z-10">
          <div>
            <p className="text-3xl md:text-5xl font-black text-white mb-2">42+</p>
            <p className="text-xs font-black text-neutral-500 uppercase tracking-widest">Agences Actives</p>
          </div>
          <div>
            <p className="text-3xl md:text-5xl font-black text-emerald-400 mb-2">1.2B</p>
            <p className="text-xs font-black text-neutral-500 uppercase tracking-widest">DA Volume Géré</p>
          </div>
          <div>
            <p className="text-3xl md:text-5xl font-black text-indigo-400 mb-2">350+</p>
            <p className="text-xs font-black text-neutral-500 uppercase tracking-widest">Agents Immobiliers</p>
          </div>
          <div>
            <p className="text-3xl md:text-5xl font-black text-white mb-2">15k</p>
            <p className="text-xs font-black text-neutral-500 uppercase tracking-widest">Biens Indexés</p>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-32 px-6">
        <div className="max-w-7xl mx-auto space-y-16">
          <div className="text-center space-y-4">
            <h2 className="text-sm font-black text-indigo-400 uppercase tracking-[0.3em] font-mono">Propulsez votre agence</h2>
            <p className="text-4xl font-black text-white tracking-tight leading-tight">Une suite logicielle <br /> pensée pour la conversion</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <FeatureCard 
              icon={<Sparkles className="h-6 w-6" />}
              title="Moteur d'IA Avancé"
              description="Analyse de sentiment des clients, résumés automatiques des visites et prédiction des clôtures."
              color="text-amber-400"
              bg="bg-amber-500/10"
              border="border-amber-500/20"
            />
            <FeatureCard 
              icon={<Kanban className="h-6 w-6" />}
              title="Pipeline Commercial 360°"
              description="Suivez chaque prospect de l'accueil à la signature finale avec notre kanban structuré en 9 étapes."
              color="text-indigo-400"
              bg="bg-indigo-500/10"
              border="border-indigo-500/20"
            />
            <FeatureCard 
              icon={<Globe className="h-6 w-6" />}
              title="SaaS Multi-Tenant Algérie"
              description="Hébergement sécurisé respectant la confidentialité locale avec isolation totale de vos données."
              color="text-emerald-400"
              bg="bg-emerald-500/10"
              border="border-emerald-500/20"
            />
          </div>
        </div>
      </section>

      {/* CTA Footer Section */}
      <section className="py-24 px-6 md:px-0">
        <div className="max-w-4xl mx-auto rounded-3xl bg-gradient-to-br from-indigo-600 to-violet-800 p-8 md:p-16 text-center text-white relative shadow-2xl shadow-indigo-600/20 overflow-hidden group">
          <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 space-y-8">
            <h2 className="text-4xl md:text-5xl font-black tracking-tight leading-tight">Prêt à dominer votre marché ?</h2>
            <p className="text-indigo-100 text-lg font-medium max-w-xl mx-auto opacity-90">
              Rejoignez les meilleurs promoteurs algériens et transformez votre gestion immobilière dès aujourd'hui.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/sign-up">
                <Button className="h-14 px-10 bg-white text-indigo-700 hover:bg-neutral-100 font-black text-lg rounded-full">
                  Commencer l'Essai Gratuit
                </Button>
              </Link>
              <Link href="/demo">
                <Button variant="ghost" className="h-14 px-8 text-white hover:bg-white/10 font-bold text-lg rounded-full gap-2">
                   Parler à un Expert <ArrowRight className="h-5 w-5" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-neutral-800">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex items-center gap-2 opa">
            <Rocket className="h-4 w-4 text-neutral-500" />
            <span className="text-sm font-black text-neutral-400 uppercase tracking-tighter">IMMO PRO-X 2026</span>
          </div>
          <div className="flex items-center gap-8 text-xs font-bold text-neutral-500 uppercase tracking-widest">
            <a href="#" className="hover:text-white transition-colors">Confidentialité</a>
            <a href="#" className="hover:text-white transition-colors">CGU</a>
            <a href="#" className="hover:text-white transition-colors">Support</a>
          </div>
          <div className="flex items-center gap-4">
            <div className="h-8 w-8 rounded-full bg-neutral-900 border border-neutral-800 flex items-center justify-center hover:border-neutral-500 transition-colors cursor-pointer">
              <TrendUp className="h-4 w-4 text-neutral-400" />
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, description, color, bg, border }: any) {
  return (
    <div className={`p-8 rounded-2xl border ${border} ${bg} backdrop-blur-sm group hover:-translate-y-1 transition-all duration-300`}>
      <div className={`h-12 w-12 rounded-xl flex items-center justify-center mb-6 border ${border} ${color} shadow-sm`}>
        {icon}
      </div>
      <h3 className="text-xl font-bold text-white mb-3 tracking-tight">{title}</h3>
      <p className="text-sm text-neutral-400 font-medium leading-relaxed">
        {description}
      </p>
    </div>
  );
}

function TrendUp(props: any) {
  return (
    <svg 
      {...props} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      <path d="m22 7-8.5 8.5-5-5L2 17" />
      <polyline points="16 7 22 7 22 13" />
    </svg>
  );
}
