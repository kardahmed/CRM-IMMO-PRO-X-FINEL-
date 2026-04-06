"use client";

import { useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";
import { useRouter } from "next/navigation";
import Link from "next/link";

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
          Créer un compte
        </h2>

        {/* Error */}
        {error && (
          <div className="mb-4 rounded-lg border border-red-800 bg-red-950/50 px-4 py-3 text-sm text-red-400">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Name row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="firstName"
                className="mb-1.5 block text-sm font-medium text-muted-foreground"
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
                className="w-full rounded-lg border border-border bg-muted px-4 py-2.5 text-sm text-foreground placeholder-muted-foreground outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
            <div>
              <label
                htmlFor="lastName"
                className="mb-1.5 block text-sm font-medium text-muted-foreground"
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
                className="w-full rounded-lg border border-border bg-muted px-4 py-2.5 text-sm text-foreground placeholder-muted-foreground outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
          </div>

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
            <p className="mt-1 text-xs text-muted-foreground">Minimum 8 caractères</p>
          </div>

          {/* Confirm password */}
          <div>
            <label
              htmlFor="confirmPassword"
              className="mb-1.5 block text-sm font-medium text-muted-foreground"
            >
              Confirmer le mot de passe
            </label>
            <input
              id="confirmPassword"
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
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
              "Créer un compte"
            )}
          </button>
        </form>

        {/* Link to sign-in */}
        <p className="mt-6 text-center text-sm text-muted-foreground">
          Déjà un compte ?{" "}
          <Link
            href="/sign-in"
            className="font-medium text-indigo-400 hover:text-indigo-300 transition"
          >
            Se connecter
          </Link>
        </p>
      </div>
    </div>
  );
}
