"use client";

import { useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Logo } from "@/components/ui/Logo";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

export default function SignUpPage() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (password.length < 8) {
      setError("Le mot de passe doit contenir au moins 8 caractères");
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError("Les mots de passe ne correspondent pas");
      setLoading(false);
      return;
    }

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          firstName,
          lastName,
        },
      },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    router.push("/onboarding");
    router.refresh();
  };

  return (
    <div className="w-full max-w-md animate-in fade-in duration-700 slide-in-from-bottom-4">
      <div className="rounded-[32px] border border-border bg-card/80 px-8 py-10 shadow-stripe-lg backdrop-blur-xl">
        {/* Logo */}
        <div className="mb-10 text-center">
          <Logo width={40} height={40} className="justify-center mb-4" />
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.3em]">
            Propulsé par IMMO PRO-X HQ
          </p>
        </div>

        {/* Title */}
        <div className="mb-8 text-center space-y-1">
          <h2 className="text-2xl font-black text-foreground italic uppercase tracking-tight">
            Créer un compte
          </h2>
          <p className="text-xs text-muted-foreground font-medium">Rejoignez le réseau leader en Algérie</p>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 rounded-2xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-xs font-bold text-destructive animate-in zoom-in-95 duration-300">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Name row */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label
                htmlFor="firstName"
                className="px-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60"
              >
                Prénom
              </label>
              <input
                id="firstName"
                type="text"
                required
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="Jean"
                className="w-full rounded-2xl border border-border bg-accent/20 px-5 py-3.5 text-sm text-foreground placeholder-muted-foreground/40 outline-none transition-all focus:border-primary focus:ring-4 focus:ring-primary/10 font-medium"
              />
            </div>
            <div className="space-y-2">
              <label
                htmlFor="lastName"
                className="px-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60"
              >
                Nom
              </label>
              <input
                id="lastName"
                type="text"
                required
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Dupont"
                className="w-full rounded-2xl border border-border bg-accent/20 px-5 py-3.5 text-sm text-foreground placeholder-muted-foreground/40 outline-none transition-all focus:border-primary focus:ring-4 focus:ring-primary/10 font-medium"
              />
            </div>
          </div>

          {/* Email */}
          <div className="space-y-2">
            <label
              htmlFor="email"
              className="px-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60"
            >
              Adresse Email
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="vous@exemple.com"
              className="w-full rounded-2xl border border-border bg-accent/20 px-5 py-3.5 text-sm text-foreground placeholder-muted-foreground/40 outline-none transition-all focus:border-primary focus:ring-4 focus:ring-primary/10 font-medium"
            />
          </div>

          {/* Password */}
          <div className="space-y-2">
            <label
              htmlFor="password"
              className="px-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60"
            >
              Mot de Passe
            </label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full rounded-2xl border border-border bg-accent/20 px-5 py-3.5 text-sm text-foreground placeholder-muted-foreground/40 outline-none transition-all focus:border-primary focus:ring-4 focus:ring-primary/10 font-medium"
            />
            <p className="px-1 text-[10px] text-muted-foreground/40 font-medium italic">8 caractères minimum</p>
          </div>

          {/* Confirm password */}
          <div className="space-y-2">
            <label
              htmlFor="confirmPassword"
              className="px-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60"
            >
              Confirmation
            </label>
            <input
              id="confirmPassword"
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full rounded-2xl border border-border bg-accent/20 px-5 py-3.5 text-sm text-foreground placeholder-muted-foreground/40 outline-none transition-all focus:border-primary focus:ring-4 focus:ring-primary/10 font-medium"
            />
          </div>

          {/* Submit */}
          <Button
            type="submit"
            disabled={loading}
            className="w-full h-14 rounded-full bg-primary text-white font-black text-sm uppercase tracking-widest shadow-stripe hover:opacity-90 transition-all gap-2"
          >
            {loading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              "Créer mon Compte"
            )}
          </Button>
        </form>

        {/* Link to sign-in */}
        <div className="mt-8 pt-8 border-t border-border/50 text-center">
          <p className="text-xs text-muted-foreground font-medium">
            Déjà inscrit sur la plateforme ?{" "}
            <Link
              href="/sign-in"
              className="font-bold text-primary hover:underline underline-offset-4 decoration-2 transition-all"
            >
              Se connecter
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
