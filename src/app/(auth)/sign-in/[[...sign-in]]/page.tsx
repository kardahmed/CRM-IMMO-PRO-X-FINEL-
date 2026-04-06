"use client";

import { useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Logo } from "@/components/ui/Logo";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

export default function SignInPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(
        error.message === "Invalid login credentials"
          ? "Email ou mot de passe incorrect"
          : error.message
      );
      setLoading(false);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  };

  return (
    <div className="w-full max-w-md animate-in fade-in duration-700 slide-in-from-bottom-4 bg-white text-slate-900">
      <div className="rounded-[32px] border border-slate-200 bg-white/95 px-8 py-10 shadow-stripe-lg backdrop-blur-xl">
        {/* Logo */}
        <div className="mb-10 text-center flex flex-col items-center">
          <Logo width={48} height={48} className="mb-3" />
          <div className="flex items-center gap-2">
            <span className="h-[1px] w-4 bg-emerald-500/30" />
            <p className="text-[9px] font-black text-emerald-600/60 uppercase tracking-[0.4em] italic">
              Premium Edition
            </p>
            <span className="h-[1px] w-4 bg-emerald-500/30" />
          </div>
        </div>

        {/* Title */}
        <div className="mb-8 text-center space-y-1.5">
          <h2 className="text-3xl font-black text-slate-900 italic uppercase tracking-tighter">
            Bon de <span className="text-emerald-500">Retour</span>
          </h2>
          <p className="text-xs text-slate-500 font-bold uppercase tracking-widest opacity-70">Expertise Immobilière HQ</p>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 rounded-2xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-xs font-bold text-destructive animate-in zoom-in-95 duration-300">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Email */}
          <div className="space-y-2">
            <label
              htmlFor="email"
              className="px-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60"
            >
              Identifiant Email
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="vous@exemple.com"
              className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 px-5 py-3.5 text-sm text-slate-900 placeholder-slate-400 outline-none transition-all focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 font-bold"
            />
          </div>

          {/* Password */}
          <div className="space-y-2">
            <div className="flex items-center justify-between px-1">
              <label
                htmlFor="password"
                className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60"
              >
                Mot de Passe
              </label>
              <Link href="#" className="text-[10px] font-black uppercase tracking-widest text-emerald-600 hover:text-emerald-700 transition-colors">
                Oublié ?
              </Link>
            </div>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 px-5 py-3.5 text-sm text-slate-900 placeholder-slate-400 outline-none transition-all focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 font-bold"
            />
          </div>

          {/* Submit */}
          <Button
            type="submit"
            disabled={loading}
            className="w-full h-14 rounded-full bg-emerald-500 text-white font-black text-sm uppercase tracking-widest shadow-lg shadow-emerald-500/20 hover:bg-emerald-600 transition-all gap-2"
          >
            {loading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              "Se Connecter"
            )}
          </Button>
        </form>

        {/* Link to sign-up */}
        <div className="mt-8 pt-8 border-t border-slate-100 text-center">
          <p className="text-xs text-slate-500 font-bold">
            Nouveau sur la plateforme ?{" "}
            <Link
              href="/sign-up"
              className="font-black text-emerald-600 hover:text-emerald-700 transition-all decoration-emerald-600/30 underline underline-offset-4"
            >
              Inscrivez votre agence
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
