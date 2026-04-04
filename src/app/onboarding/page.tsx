"use client";

import { useState, useTransition } from "react";
import { createWorkspace } from "./actions";
import { Building2, Home, Loader2, AlertCircle } from "lucide-react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export default function OnboardingPage() {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const { user } = useUser();
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      try {
        const res = await createWorkspace(formData);

        if (res.success) {
          toast.success("Espace cree avec succes !");

          // Recharger les metadata Clerk pour que le middleware laisse passer
          if (user) {
            await user.reload();
          }

          router.refresh();
          router.push("/");
        } else {
          setError(res.error);
          toast.error(res.error);
        }
      } catch {
        const msg = "Une erreur inattendue est survenue. Veuillez reessayer.";
        setError(msg);
        toast.error(msg);
      }
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a] text-white p-4">
      <div className="relative w-full max-w-md">
        {/* Decorative blur elements */}
        <div className="absolute top-[-20%] left-[-10%] w-72 h-72 bg-blue-600/30 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-[-20%] right-[-10%] w-72 h-72 bg-violet-600/30 rounded-full blur-[100px] pointer-events-none" />

        <div className="relative bg-white/5 backdrop-blur-xl border border-white/10 p-8 rounded-2xl shadow-2xl overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />

          <div className="relative z-10 text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-violet-600 shadow-lg mb-6">
              <Building2 className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-white mb-2">
              Creer votre Espace
            </h1>
            <p className="text-zinc-400">
              Configurez votre plateforme CRM pour commencer a gerer vos biens.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="relative z-10 space-y-6">
            <div className="space-y-4">
              {/* Error banner */}
              {error && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div className="space-y-2">
                <label htmlFor="name" className="text-sm font-medium text-zinc-300">
                  Nom de l&apos;entreprise
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  minLength={2}
                  maxLength={100}
                  disabled={isPending}
                  placeholder="Ex: Immobiliere Riviera"
                  className="w-full px-4 py-3 rounded-xl bg-black/50 border border-white/10 text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all disabled:opacity-50"
                />
              </div>

              <div className="space-y-3">
                <label className="text-sm font-medium text-zinc-300">
                  Type d&apos;activite
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <label className="relative flex flex-col items-center justify-center gap-2 p-4 rounded-xl border border-white/10 bg-black/50 cursor-pointer hover:bg-white/5 transition-all group has-[:checked]:border-blue-500 has-[:checked]:bg-blue-500/10">
                    <input
                      type="radio"
                      name="type"
                      value="AGENCY"
                      className="peer sr-only"
                      defaultChecked
                      disabled={isPending}
                    />
                    <Home className="w-6 h-6 text-zinc-400 group-hover:text-white peer-checked:text-blue-500 transition-colors" />
                    <span className="text-sm font-medium text-zinc-300 peer-checked:text-white">
                      Agence
                    </span>
                  </label>

                  <label className="relative flex flex-col items-center justify-center gap-2 p-4 rounded-xl border border-white/10 bg-black/50 cursor-pointer hover:bg-white/5 transition-all group has-[:checked]:border-violet-500 has-[:checked]:bg-violet-500/10">
                    <input
                      type="radio"
                      name="type"
                      value="PROMOTION"
                      className="peer sr-only"
                      disabled={isPending}
                    />
                    <Building2 className="w-6 h-6 text-zinc-400 group-hover:text-white peer-checked:text-violet-500 transition-colors" />
                    <span className="text-sm font-medium text-zinc-300 peer-checked:text-white">
                      Promotion
                    </span>
                  </label>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={isPending}
              className="w-full py-3 px-4 rounded-xl font-medium text-white bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 focus:ring-2 focus:ring-blue-500/50 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-[0_0_20px_rgba(79,70,229,0.3)] hover:shadow-[0_0_25px_rgba(79,70,229,0.5)] active:scale-[0.98] flex items-center justify-center gap-2"
            >
              {isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Creation en cours...
                </>
              ) : (
                "Lancer le CRM"
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
