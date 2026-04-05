"use client";

import Link from "next/link";
import {
  Rocket,
  Sparkles,
  Kanban,
  ArrowRight,
  Building2,
  Zap,
  Globe,
  PieChart,
  Users,
  Map,
  Bell,
  BarChart3,
  FileText,
  Check,
  Star,
  Quote,
  MessageSquare,
  Shield,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";

export default function LandingPage() {
  const { user, isLoaded } = useSupabaseAuth();
  const isSignedIn = isLoaded && !!user;

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
            <a href="#pricing" className="text-sm font-bold text-neutral-400 hover:text-white transition-colors">Tarifs</a>
            <a href="#testimonials" className="text-sm font-bold text-neutral-400 hover:text-white transition-colors">Temoignages</a>
            <Link href="/sign-up" className="text-sm font-bold text-indigo-400 hover:text-indigo-300 transition-colors">Essai Gratuit</Link>
          </div>

          <div className="flex items-center gap-4">
            {!isSignedIn ? (
              <>
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
              </>
            ) : (
              <Link href="/dashboard">
                <Button className="bg-indigo-600 hover:bg-indigo-700 text-white font-black text-sm px-6 rounded-full gap-2 shadow-lg shadow-indigo-600/20">
                  Dashboard <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-20 pb-32 px-6">
        <div className="max-w-5xl mx-auto text-center space-y-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-black tracking-widest uppercase mb-4">
            <Sparkles className="h-3 w-3" /> Nouveau : Moteur IA v2.5
          </div>

          <h1 className="text-5xl lg:text-7xl font-black text-white tracking-tight leading-[1.1]">
            Le Futur de l&apos;Immobilier <br />
            <span className="bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">
              en Algerie
            </span>{" "}
            est ici.
          </h1>

          <p className="text-lg md:text-xl text-neutral-400 max-w-2xl mx-auto font-medium leading-relaxed">
            Augmentez vos ventes de 40% grace au premier CRM SaaS concu specifiquement pour les promoteurs et agences algeriennes. IA integree, Pipeline 360° et automatisation.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-6">
            <Link href="/sign-up">
              <Button className="h-14 px-10 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-lg rounded-full shadow-2xl shadow-indigo-600/30 group">
                Essai Gratuit 14 jours <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <a href="#pricing">
              <Button variant="outline" className="h-14 px-10 border-neutral-800 text-white hover:bg-neutral-900 font-bold text-lg rounded-full">
                Voir les Tarifs
              </Button>
            </a>
          </div>

          <div className="pt-20">
            <div className="relative mx-auto max-w-4xl rounded-2xl border border-neutral-800 bg-neutral-900/50 p-2 lg:p-4 backdrop-blur-sm shadow-2xl overflow-hidden">
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
                  <p className="text-sm text-neutral-500 font-mono">Pipeline, Cartographie, IA, Automatisation</p>
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
            <p className="text-xs font-black text-neutral-500 uppercase tracking-widest">DA Volume Gere</p>
          </div>
          <div>
            <p className="text-3xl md:text-5xl font-black text-indigo-400 mb-2">350+</p>
            <p className="text-xs font-black text-neutral-500 uppercase tracking-widest">Agents Immobiliers</p>
          </div>
          <div>
            <p className="text-3xl md:text-5xl font-black text-white mb-2">15k</p>
            <p className="text-xs font-black text-neutral-500 uppercase tracking-widest">Biens Indexes</p>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-32 px-6">
        <div className="max-w-7xl mx-auto space-y-16">
          <div className="text-center space-y-4">
            <h2 className="text-sm font-black text-indigo-400 uppercase tracking-[0.3em] font-mono">Propulsez votre agence</h2>
            <p className="text-4xl font-black text-white tracking-tight leading-tight">Une suite complete <br /> pensee pour la conversion</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <FeatureCard
              icon={<Sparkles className="h-6 w-6" />}
              title="Moteur IA Avance"
              description="Scoring de leads, resumes de visites, generation d'emails et SMS par IA Claude."
              color="text-amber-400" bg="bg-amber-500/10" border="border-amber-500/20"
            />
            <FeatureCard
              icon={<Kanban className="h-6 w-6" />}
              title="Pipeline 9 Etapes"
              description="Suivez chaque prospect du premier contact a la signature avec un kanban visuel."
              color="text-indigo-400" bg="bg-indigo-500/10" border="border-indigo-500/20"
            />
            <FeatureCard
              icon={<Globe className="h-6 w-6" />}
              title="Multi-Tenant Securise"
              description="Isolation totale des donnees par workspace. Chaque agence a son propre espace."
              color="text-emerald-400" bg="bg-emerald-500/10" border="border-emerald-500/20"
            />
            <FeatureCard
              icon={<Map className="h-6 w-6" />}
              title="Cartographie Biens"
              description="Visualisez tous vos biens sur une carte Google Maps avec filtres et clustering."
              color="text-cyan-400" bg="bg-cyan-500/10" border="border-cyan-500/20"
            />
            <FeatureCard
              icon={<Bell className="h-6 w-6" />}
              title="Automatisations"
              description="Taches, relances et notifications automatiques a chaque etape du pipeline."
              color="text-rose-400" bg="bg-rose-500/10" border="border-rose-500/20"
            />
            <FeatureCard
              icon={<MessageSquare className="h-6 w-6" />}
              title="WhatsApp & Facebook"
              description="Integration directe WhatsApp Cloud API et Facebook Lead Ads. Leads en temps reel."
              color="text-green-400" bg="bg-green-500/10" border="border-green-500/20"
            />
            <FeatureCard
              icon={<BarChart3 className="h-6 w-6" />}
              title="Performance & KPI"
              description="Tableaux de bord, objectifs par agent, taux de conversion et rapports detailles."
              color="text-violet-400" bg="bg-violet-500/10" border="border-violet-500/20"
            />
            <FeatureCard
              icon={<FileText className="h-6 w-6" />}
              title="Generation Documents"
              description="Generez compromis, fiches bien et bons de reservation en un clic."
              color="text-orange-400" bg="bg-orange-500/10" border="border-orange-500/20"
            />
            <FeatureCard
              icon={<Shield className="h-6 w-6" />}
              title="Portail Client"
              description="Espace securise pour vos acquereurs : suivi avancement, paiements, documents."
              color="text-sky-400" bg="bg-sky-500/10" border="border-sky-500/20"
            />
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-32 px-6 border-t border-neutral-800">
        <div className="max-w-7xl mx-auto space-y-16">
          <div className="text-center space-y-4">
            <h2 className="text-sm font-black text-indigo-400 uppercase tracking-[0.3em] font-mono">Tarifs</h2>
            <p className="text-4xl font-black text-white tracking-tight">Un plan pour chaque agence</p>
            <p className="text-neutral-400 max-w-lg mx-auto">Tous les plans incluent 14 jours d&apos;essai gratuit. Sans engagement.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <PricingCard
              name="Starter"
              price="9 900"
              period="/mois"
              description="Pour les petites agences qui demarrent"
              features={[
                "Jusqu&apos;a 3 utilisateurs",
                "100 clients max",
                "Pipeline & Kanban",
                "Notifications basiques",
                "Support email",
              ]}
              cta="Commencer"
              href="/sign-up"
            />
            <PricingCard
              name="Pro"
              price="24 900"
              period="/mois"
              description="Pour les agences en croissance"
              features={[
                "Jusqu&apos;a 15 utilisateurs",
                "Clients illimites",
                "IA Claude integree",
                "WhatsApp & Facebook",
                "Automatisations",
                "Portail client",
                "Support prioritaire",
              ]}
              cta="Essai Gratuit 14j"
              href="/sign-up"
              popular
            />
            <PricingCard
              name="Business"
              price="49 900"
              period="/mois"
              description="Pour les groupes et promoteurs"
              features={[
                "Utilisateurs illimites",
                "Multi-projets",
                "API & Webhooks",
                "Generation documents",
                "Cartographie avancee",
                "Objectifs & KPI",
                "Onboarding dedie",
                "SLA 99.9%",
              ]}
              cta="Contacter l'equipe"
              href="/sign-up"
            />
          </div>

          <p className="text-center text-neutral-500 text-sm">
            Prix en DA (Dinar Algerien) HT. Plan Enterprise sur devis.
          </p>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-32 px-6 border-t border-neutral-800">
        <div className="max-w-7xl mx-auto space-y-16">
          <div className="text-center space-y-4">
            <h2 className="text-sm font-black text-indigo-400 uppercase tracking-[0.3em] font-mono">Temoignages</h2>
            <p className="text-4xl font-black text-white tracking-tight">Ils nous font confiance</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <TestimonialCard
              quote="IMMO PRO-X a transforme notre facon de travailler. On a double nos ventes en 6 mois grace au pipeline et aux automatisations."
              name="Karim B."
              role="Directeur, Groupe Immobilier El Wouroud"
              location="Alger"
            />
            <TestimonialCard
              quote="Le suivi client est devenu un jeu d'enfant. Mes agents savent exactement quoi faire chaque matin grace aux taches automatiques."
              name="Amina H."
              role="CEO, Agence Horizon Immo"
              location="Oran"
            />
            <TestimonialCard
              quote="L'integration Facebook Leads nous fait gagner 2h par jour. Les prospects arrivent directement dans le pipeline avec toutes les infos."
              name="Youcef M."
              role="Superviseur, Promo Batisseur"
              location="Constantine"
            />
          </div>
        </div>
      </section>

      {/* CTA Footer Section */}
      <section className="py-24 px-6 md:px-0">
        <div className="max-w-4xl mx-auto rounded-3xl bg-gradient-to-br from-indigo-600 to-violet-800 p-8 md:p-16 text-center text-white relative shadow-2xl shadow-indigo-600/20 overflow-hidden">
          <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 space-y-8">
            <h2 className="text-4xl md:text-5xl font-black tracking-tight leading-tight">Pret a dominer votre marche ?</h2>
            <p className="text-indigo-100 text-lg font-medium max-w-xl mx-auto opacity-90">
              Testez gratuitement pendant 14 jours. Aucune carte bancaire requise.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/sign-up">
                <Button className="h-14 px-10 bg-white text-indigo-700 hover:bg-neutral-100 font-black text-lg rounded-full">
                  Commencer l&apos;essai gratuit
                </Button>
              </Link>
              <Link href="/sign-up">
                <Button variant="ghost" className="h-14 px-8 text-white hover:bg-white/10 font-bold text-lg rounded-full gap-2">
                  Creer un Compte <ArrowRight className="h-5 w-5" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-neutral-800">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex items-center gap-2">
            <Rocket className="h-4 w-4 text-neutral-500" />
            <span className="text-sm font-black text-neutral-400 uppercase tracking-tighter">IMMO PRO-X 2026</span>
          </div>
          <div className="flex items-center gap-8 text-xs font-bold text-neutral-500 uppercase tracking-widest">
            <a href="#" className="hover:text-white transition-colors">Confidentialite</a>
            <a href="#" className="hover:text-white transition-colors">CGU</a>
            <a href="#" className="hover:text-white transition-colors">Support</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

// ============================================================================
// Components
// ============================================================================

function FeatureCard({ icon, title, description, color, bg, border }: {
  icon: React.ReactNode; title: string; description: string;
  color: string; bg: string; border: string;
}) {
  return (
    <div className={`p-8 rounded-2xl border ${border} ${bg} backdrop-blur-sm group hover:-translate-y-1 transition-all duration-300`}>
      <div className={`h-12 w-12 rounded-xl flex items-center justify-center mb-6 border ${border} ${color} shadow-sm`}>
        {icon}
      </div>
      <h3 className="text-xl font-bold text-white mb-3 tracking-tight">{title}</h3>
      <p className="text-sm text-neutral-400 font-medium leading-relaxed">{description}</p>
    </div>
  );
}

function PricingCard({ name, price, period, description, features, cta, href, popular }: {
  name: string; price: string; period: string; description: string;
  features: string[]; cta: string; href: string; popular?: boolean;
}) {
  return (
    <div className={`relative rounded-2xl border p-8 flex flex-col ${
      popular
        ? "border-indigo-500/50 bg-indigo-500/5 shadow-lg shadow-indigo-500/10"
        : "border-neutral-800 bg-neutral-900/30"
    }`}>
      {popular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-indigo-600 text-white text-xs font-black rounded-full uppercase tracking-wider">
          Populaire
        </div>
      )}
      <div className="mb-6">
        <h3 className="text-lg font-bold text-white mb-1">{name}</h3>
        <p className="text-sm text-neutral-500">{description}</p>
      </div>
      <div className="mb-8">
        <span className="text-4xl font-black text-white">{price}</span>
        <span className="text-neutral-500 text-sm font-bold"> DA {period}</span>
      </div>
      <ul className="space-y-3 mb-8 flex-1">
        {features.map((f, i) => (
          <li key={i} className="flex items-start gap-3 text-sm text-neutral-300">
            <Check className="h-4 w-4 text-indigo-400 mt-0.5 shrink-0" />
            <span dangerouslySetInnerHTML={{ __html: f }} />
          </li>
        ))}
      </ul>
      <Link href={href}>
        <Button className={`w-full h-12 rounded-xl font-bold ${
          popular
            ? "bg-indigo-600 hover:bg-indigo-700 text-white"
            : "bg-neutral-800 hover:bg-neutral-700 text-white"
        }`}>
          {cta}
        </Button>
      </Link>
    </div>
  );
}

function TestimonialCard({ quote, name, role, location }: {
  quote: string; name: string; role: string; location: string;
}) {
  return (
    <div className="rounded-2xl border border-neutral-800 bg-neutral-900/30 p-8 flex flex-col">
      <Quote className="h-8 w-8 text-indigo-500/30 mb-4" />
      <p className="text-neutral-300 text-sm leading-relaxed mb-6 flex-1">&ldquo;{quote}&rdquo;</p>
      <div className="flex items-center gap-1 mb-4">
        {[...Array(5)].map((_, i) => (
          <Star key={i} className="h-4 w-4 text-amber-400 fill-amber-400" />
        ))}
      </div>
      <div>
        <p className="text-white font-bold text-sm">{name}</p>
        <p className="text-neutral-500 text-xs">{role}</p>
        <p className="text-neutral-600 text-xs">{location}</p>
      </div>
    </div>
  );
}
