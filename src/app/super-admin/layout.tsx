"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { useEffect, useState } from "react";
import {
  BarChart,
  Building2,
  Sparkles,
  Users,
  Settings,
  ShieldAlert,
  LogOut,
  ChevronRight,
  Database,
  Menu,
  X
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Logo } from "@/components/ui/Logo";
import { Button } from "@/components/ui/button";

export default function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { role, isLoaded, user, email } = useSupabaseAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Guard: seul SUPER_ADMIN ou ADMIN peut accéder
  const isAllowed = role === "SUPER_ADMIN" || role === "ADMIN";

  useEffect(() => {
    if (isLoaded && !isAllowed) {
      router.replace("/");
    }
  }, [isLoaded, isAllowed, router]);

  // Close sidebar on navigation (mobile)
  useEffect(() => {
    setIsSidebarOpen(false);
  }, [pathname]);

  if (!isLoaded || !isAllowed) {
    return (
      <div className="flex h-screen items-center justify-center bg-background text-foreground">
        <div className="flex flex-col items-center gap-4">
          <Logo width={48} height={48} showText={false} className="animate-pulse" />
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-muted-foreground/40">Vérification IMMO PRO-X Management...</p>
        </div>
      </div>
    );
  }

  const navItems = [
    { href: "/super-admin", icon: BarChart, label: "Vue d'ensemble" },
    { href: "/super-admin/entreprises", icon: Building2, label: "Workspaces" },
    { href: "/super-admin/ai", icon: Sparkles, label: "Moteur IA" },
    { href: "/super-admin/settings", icon: Settings, label: "Config Système" },
  ];

  return (
    <div className="flex h-screen overflow-hidden bg-background text-foreground font-sans selection:bg-primary/20">
      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-[60] md:hidden backdrop-blur-sm animate-in fade-in duration-300" 
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 w-72 border-r border-border bg-card flex flex-col shrink-0 shadow-[4px_0_24px_rgba(0,0,0,0.02)] z-[70] transition-transform duration-300 md:relative md:translate-x-0",
        isSidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="h-20 flex items-center justify-between px-8 border-b border-border/50">
          <Logo width={32} height={32} />
          <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setIsSidebarOpen(false)}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Admin Identity Card */}
        <div className="px-6 py-8">
          <div className="p-4 rounded-[24px] bg-foreground text-background shadow-stripe relative overflow-hidden group">
             <div className="absolute top-0 right-0 w-24 h-24 bg-primary/20 blur-[40px] group-hover:bg-primary/30 transition-all" />
             <div className="flex items-center gap-4 relative z-10">
                <Avatar className="h-8 w-8 border-none ring-2 ring-emerald-500/20">
                  <AvatarImage src="" />
                  <AvatarFallback className="bg-emerald-500 text-white font-black text-xs italic">PX</AvatarFallback>
                </Avatar>
                <div className="flex flex-col text-left">
                  <span className="text-sm font-bold text-background truncate max-w-[120px]">{user?.email?.split('@')[0]}</span>
                  <span className="text-[10px] font-black text-emerald-400 uppercase tracking-tighter">Systeme</span>
                </div>
             </div>
          </div>
        </div>

        <nav className="flex-1 px-4 space-y-1.5 overflow-y-auto pb-10">
          <p className="px-4 mb-4 text-xs font-bold text-muted-foreground/40 uppercase tracking-[0.3em]">Menu Principal</p>
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
                    : "text-muted-foreground hover:text-foreground hover:bg-accent"
                )}
              >
                <div className="flex items-center gap-4">
                  <Icon className={cn("h-4 w-4", isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground transition-colors")} />
                  <span className="tracking-tight">{item.label}</span>
                </div>
                {isActive && <ChevronRight className="h-3.5 w-3.5 animate-in slide-in-from-left-2 duration-300" />}
              </Link>
            );
          })}
        </nav>

        {/* System Footer */}
        <div className="p-6 mt-auto border-t border-border/50">
          <Link href="/">
            <button className="flex w-full items-center justify-center gap-3 px-4 py-4 rounded-2xl bg-accent text-xs font-bold text-muted-foreground hover:text-destructive hover:bg-destructive/5 transition-all uppercase tracking-[0.15em] border border-transparent hover:border-destructive/10">
              <LogOut className="mr-2 h-4 w-4" />
              Sortir du Management
            </button>
          </Link>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 bg-background overflow-hidden relative">
        <header className="h-20 flex items-center justify-between px-4 md:px-10 border-b border-border/50 bg-background/50 backdrop-blur-xl shrink-0">
          <div className="flex items-center gap-4">
             <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setIsSidebarOpen(true)}>
                <Menu className="h-5 w-5" />
             </Button>
             <div className="flex items-center gap-3">
                <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-[0.4em] hidden sm:block">Système en ligne • v1.4.0</h2>
                <h2 className="text-xs font-bold text-emerald-600 uppercase tracking-[0.4em] sm:hidden text-[10px] italic">LIVE TRACKING</h2>
             </div>
          </div>
          <div className="flex items-center gap-6">
             <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/5 border border-amber-500/10">
                <Database className="h-3 w-3 text-amber-500" />
                <span className="text-xs font-bold text-amber-700 uppercase tracking-widest hidden sm:inline">Main Cluster</span>
             </div>
          </div>
        </header>
        
        <div className="flex-1 overflow-y-auto p-4 md:p-10 scrollbar-hide">
          <div className="max-w-7xl mx-auto w-full">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
