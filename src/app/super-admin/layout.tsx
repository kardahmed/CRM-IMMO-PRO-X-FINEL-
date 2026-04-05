"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { useEffect } from "react";
import {
  BarChart,
  Building2,
  Sparkles,
  Users,
  Settings,
  Rocket,
  ShieldAlert,
  LogOut,
  ChevronRight,
  Database
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Logo } from "@/components/ui/Logo";

export default function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { role, isLoaded, user, email } = useSupabaseAuth();

  // Guard: seul SUPER_ADMIN ou ADMIN (ou bypass email) peut accéder
  const isSuperAdminEmail = email === "contact@sensium-x.com";
  const isAllowed = role === "SUPER_ADMIN" || role === "ADMIN" || isSuperAdminEmail;
  useEffect(() => {
    if (isLoaded && !isAllowed) {
      router.replace("/");
    }
  }, [isLoaded, isAllowed, router]);

  if (!isLoaded || !isAllowed) {
    return (
      <div className="flex h-screen items-center justify-center bg-white text-neutral-900">
        <div className="flex flex-col items-center gap-4">
          <Logo width={48} height={48} showText={false} className="animate-pulse" />
          <p className="text-xs font-black uppercase tracking-[0.3em] text-neutral-400">Vérification PRO-X HQ...</p>
        </div>
      </div>
    );
  }

  const navItems = [
    { href: "/super-admin", icon: BarChart, label: "Vue d'ensemble" },
    { href: "/super-admin/entreprises", icon: Building2, label: "Workspaces" },
    { href: "/super-admin/ai", icon: Sparkles, label: "Moteur IA" },
    { href: "/super-admin/demo", icon: Users, label: "Leads Démo" },
    { href: "/super-admin/settings", icon: Settings, label: "Config Système" },
  ];

  return (
    <div className="flex h-screen overflow-hidden bg-[#fafafa] text-neutral-900 font-sans selection:bg-primary/20">
      {/* Sidebar - White Modern Sidebar */}
      <aside className="w-72 border-r border-neutral-100 bg-white flex flex-col shrink-0 shadow-[4px_0_24px_rgba(0,0,0,0.02)] z-50">
        <div className="h-20 flex items-center px-8 border-b border-neutral-50/50">
          <Logo width={32} height={32} />
        </div>

        {/* Admin Identity Card */}
        <div className="px-6 py-8">
          <div className="p-4 rounded-[24px] bg-neutral-900 text-white shadow-stripe relative overflow-hidden group">
             <div className="absolute top-0 right-0 w-24 h-24 bg-primary/20 blur-[40px] group-hover:bg-primary/30 transition-all" />
             <div className="flex items-center gap-4 relative z-10">
                <Avatar className="h-12 w-12 border-2 border-white/10">
                  <AvatarImage src={user?.user_metadata?.avatar_url} />
                  <AvatarFallback className="bg-primary text-white font-black text-xs">HQ</AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-black italic uppercase tracking-tighter leading-tight">Master Admin</p>
                  <p className="text-[10px] text-primary font-black uppercase tracking-[0.2em] mt-1 flex items-center gap-1.5">
                    <ShieldAlert className="h-3 w-3" /> Accès Système
                  </p>
                </div>
             </div>
          </div>
        </div>

        <nav className="flex-1 px-4 space-y-1.5 overflow-y-auto pb-10">
          <p className="px-4 mb-4 text-[10px] font-black text-neutral-400 uppercase tracking-[0.3em]">Menu Principal</p>
          {navItems.map((item) => {
            const isActive = pathname === item.href || (pathname.startsWith(item.href) && item.href !== "/super-admin");
            const Icon = item.icon;
            
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center justify-between px-4 py-3 rounded-2xl text-sm transition-all duration-300 group",
                  isActive 
                    ? "bg-primary/5 text-primary font-black shadow-[inset_0_0_12px_rgba(var(--primary),0.05)]" 
                    : "text-neutral-500 hover:text-neutral-900 hover:bg-neutral-50"
                )}
              >
                <div className="flex items-center gap-4">
                  <Icon className={cn("h-4 w-4", isActive ? "text-primary" : "text-neutral-400 group-hover:text-neutral-600 transition-colors")} />
                  <span className="tracking-tight">{item.label}</span>
                </div>
                {isActive && <ChevronRight className="h-3.5 w-3.5 animate-in slide-in-from-left-2 duration-300" />}
              </Link>
            );
          })}
        </nav>

        {/* System Footer */}
        <div className="p-6 mt-auto border-t border-neutral-50">
          <Link href="/">
            <button className="flex w-full items-center justify-center gap-3 px-4 py-4 rounded-2xl bg-neutral-50 text-[10px] font-black text-neutral-500 hover:text-red-500 hover:bg-red-50 transition-all uppercase tracking-[0.15em] border border-transparent hover:border-red-100">
              <LogOut className="h-3.5 w-3.5" />
              Sortir de l&apos;Accès Système
            </button>
          </Link>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 bg-[#fafafa] overflow-hidden">
        <header className="h-20 flex items-center justify-between px-10 border-b border-neutral-100/50 bg-white/50 backdrop-blur-xl shrink-0">
          <div className="flex items-center gap-3">
             <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
             <h2 className="text-[10px] font-black text-neutral-400 uppercase tracking-[0.4em]">Système en ligne • v1.4.0</h2>
          </div>
          <div className="flex items-center gap-6">
             <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/5 border border-amber-500/10">
                <Database className="h-3 w-3 text-amber-500" />
                <span className="text-[10px] font-black text-amber-700 uppercase tracking-widest">Main Cluster</span>
             </div>
          </div>
        </header>
        
        <div className="flex-1 overflow-y-auto p-10 scrollbar-hide">
          <div className="max-w-7xl mx-auto w-full">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
