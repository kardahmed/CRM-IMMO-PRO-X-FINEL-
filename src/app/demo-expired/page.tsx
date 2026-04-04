import { Clock, Mail, Phone, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function DemoExpiredPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0a0a0a] text-white p-4">
      <div className="relative w-full max-w-lg">
        {/* Decorative blur */}
        <div className="absolute top-[-30%] left-[-20%] w-72 h-72 bg-amber-600/20 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-[-30%] right-[-20%] w-72 h-72 bg-rose-600/20 rounded-full blur-[120px] pointer-events-none" />

        <div className="relative bg-white/5 backdrop-blur-xl border border-white/10 p-8 rounded-2xl shadow-2xl">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-amber-500/10 mb-6">
              <Clock className="w-10 h-10 text-amber-400" />
            </div>
            <h1 className="text-3xl font-black tracking-tight mb-3">
              Periode d'essai terminee
            </h1>
            <p className="text-zinc-400 leading-relaxed">
              Votre espace demo de 14 jours a expire. Vos donnees sont conservees
              et seront disponibles des l'activation de votre abonnement.
            </p>
          </div>

          {/* What happens next */}
          <div className="space-y-4 mb-8">
            <h2 className="text-sm font-bold text-zinc-300 uppercase tracking-wider">
              Pour continuer
            </h2>
            <div className="space-y-3">
              <div className="flex items-start gap-3 p-3 rounded-xl bg-white/5 border border-white/10">
                <div className="h-8 w-8 rounded-lg bg-indigo-500/10 flex items-center justify-center shrink-0 mt-0.5">
                  <ArrowRight className="h-4 w-4 text-indigo-400" />
                </div>
                <div>
                  <p className="text-sm font-bold text-white">Choisissez votre plan</p>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    Starter, Pro, Business ou Enterprise selon vos besoins
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-xl bg-white/5 border border-white/10">
                <div className="h-8 w-8 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0 mt-0.5">
                  <Phone className="h-4 w-4 text-emerald-400" />
                </div>
                <div>
                  <p className="text-sm font-bold text-white">Contactez notre equipe</p>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    Nous activons votre abonnement en moins de 24h
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Contact */}
          <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-xl p-4 mb-6">
            <p className="text-sm font-bold text-indigo-300 mb-2">Contactez-nous</p>
            <div className="space-y-2">
              <a
                href="mailto:contact@immopro-x.dz"
                className="flex items-center gap-2 text-sm text-zinc-300 hover:text-white transition-colors"
              >
                <Mail className="h-4 w-4 text-indigo-400" />
                contact@immopro-x.dz
              </a>
              <a
                href="tel:+213550000000"
                className="flex items-center gap-2 text-sm text-zinc-300 hover:text-white transition-colors"
              >
                <Phone className="h-4 w-4 text-indigo-400" />
                +213 550 000 000
              </a>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <Link
              href="/"
              className="w-full py-3 px-4 rounded-xl font-medium text-white bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-center text-sm transition-all"
            >
              Retour a l'accueil
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
