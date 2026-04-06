"use client";

import { useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";
import { useRouter } from "next/navigation";
import Link from "next/link";

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
    <div className="w-full max-w-md">
      <div className="rounded-2xl border border-border bg-card/80 px-8 py-10 shadow-2xl backdrop-blur">
        {/* Logo */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
            PRO-<span className="text-indigo-500">X</span>
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">CRM Immobilier</p>
        </div>

        {/* Title */}
        <h2 className="mb-6 text-center text-xl font-semibold text-foreground">
          Connexion
        </h2>

        {/* Error */}
        {error && (
          <div className="mb-4 rounded-lg border border-red-800 bg-red-950/50 px-4 py-3 text-sm text-red-400">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Email */}
          <div>
            <label
              htmlFor="email"
              className="mb-1.5 block text-sm font-medium text-muted-foreground"
            >
              Adresse email
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="vous@exemple.com"
              className="w-full rounded-lg border border-border bg-muted px-4 py-2.5 text-sm text-foreground placeholder-muted-foreground outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>

          {/* Password */}
          <div>
            <label
              htmlFor="password"
              className="mb-1.5 block text-sm font-medium text-muted-foreground"
            >
              Mot de passe
            </label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full rounded-lg border border-border bg-muted px-4 py-2.5 text-sm text-foreground placeholder-muted-foreground outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-primary-foreground transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? (
              <svg
                className="h-5 w-5 animate-spin text-primary-foreground"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
            ) : (
              "Se connecter"
            )}
          </button>
        </form>

        {/* Link to sign-up */}
        <p className="mt-6 text-center text-sm text-muted-foreground">
          Pas de compte ?{" "}
          <Link
            href="/sign-up"
            className="font-medium text-indigo-400 hover:text-indigo-300 transition"
          >
            Créer un compte
          </Link>
        </p>
      </div>
    </div>
  );
}
