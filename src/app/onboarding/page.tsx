"use client";

import { useTransition } from "react";
import { createWorkspace } from "./actions";
import { Building2, Home } from "lucide-react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";

export default function OnboardingPage() {
  const [isPending, startTransition] = useTransition();
  const { user } = useUser();
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      try {
        const res = await createWorkspace(formData);
        console.log("Response:", res);
        
        if (res?.success) {
          if (!user) {
            alert("Success but 'user' is undefined");
            return;
          }
          console.log("Reloading user metadata...");
          await user.reload();
          console.log("User reloaded. Navigating...");
          
          // Use standard Next.js router but with a refresh
          router.refresh();
          router.push("/dashboard");
        } else {
          alert("Response was not success: " + JSON.stringify(res));
        }
      } catch (err: any) {
        alert("Failed to create workspace: " + err.message);
        console.error("Failed to create workspace:", err);
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
              Créer votre Espace
            </h1>
            <p className="text-zinc-400">
              Configurez votre plateforme CRM pour commencer à gérer vos biens.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="relative z-10 space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="name" className="text-sm font-medium text-zinc-300">
                  Nom de l'entreprise
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  placeholder="Ex: Immobilière Riviera"
                  className="w-full px-4 py-3 rounded-xl bg-black/50 border border-white/10 text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                />
              </div>

              <div className="space-y-3">
                <label className="text-sm font-medium text-zinc-300">
                  Type d'activité
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <label className="relative flex flex-col items-center justify-center gap-2 p-4 rounded-xl border border-white/10 bg-black/50 cursor-pointer hover:bg-white/5 transition-all group has-[:checked]:border-blue-500 has-[:checked]:bg-blue-500/10">
                    <input type="radio" name="type" value="AGENCY" className="peer sr-only" defaultChecked />
                    <Home className="w-6 h-6 text-zinc-400 group-hover:text-white peer-checked:text-blue-500 transition-colors" />
                    <span className="text-sm font-medium text-zinc-300 peer-checked:text-white">Agence</span>
                  </label>
                  
                  <label className="relative flex flex-col items-center justify-center gap-2 p-4 rounded-xl border border-white/10 bg-black/50 cursor-pointer hover:bg-white/5 transition-all group has-[:checked]:border-violet-500 has-[:checked]:bg-violet-500/10">
                    <input type="radio" name="type" value="PROMOTION" className="peer sr-only" />
                    <Building2 className="w-6 h-6 text-zinc-400 group-hover:text-white peer-checked:text-violet-500 transition-colors" />
                    <span className="text-sm font-medium text-zinc-300 peer-checked:text-white">Promotion</span>
                  </label>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={isPending}
              className="w-full py-3 px-4 rounded-xl font-medium text-white bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 focus:ring-2 focus:ring-blue-500/50 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-[0_0_20px_rgba(79,70,229,0.3)] hover:shadow-[0_0_25px_rgba(79,70,229,0.5)] active:scale-[0.98]"
            >
              {isPending ? "Création en cours..." : "Lancer le CRM"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
