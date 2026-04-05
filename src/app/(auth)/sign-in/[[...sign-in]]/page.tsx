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
            Bon de retour
          </h2>
          <p className="text-xs text-muted-foreground font-medium">Connectez-vous à votre espace de gestion</p>
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
              className="w-full rounded-2xl border border-border bg-accent/20 px-5 py-3.5 text-sm text-foreground placeholder-muted-foreground/40 outline-none transition-all focus:border-primary focus:ring-4 focus:ring-primary/10 font-medium"
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
              <Link href="#" className="text-[10px] font-bold uppercase tracking-widest text-primary hover:opacity-80 transition-opacity">
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
              "Se Connecter"
            )}
          </Button>
        </form>

        {/* Link to sign-up */}
        <div className="mt-8 pt-8 border-t border-border/50 text-center">
          <p className="text-xs text-muted-foreground font-medium">
            Nouveau sur la plateforme ?{" "}
            <Link
              href="/sign-up"
              className="font-bold text-primary hover:underline underline-offset-4 decoration-2 transition-all"
            >
              Inscrivez votre agence
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
