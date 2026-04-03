"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { useEffect } from "react";
import {
  BarChart,
  Building2,
  Sparkles,
  Users,
  Settings,
  Rocket,
  ShieldAlert,
  LogOut
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export default function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isLoaded } = useUser();

  // Guard: seul SUPER_ADMIN ou ADMIN peut accéder
  const role = user?.publicMetadata?.role as string | undefined;
  const isAllowed = role === "SUPER_ADMIN" || role === "ADMIN";
  useEffect(() => {
    if (isLoaded && !isAllowed) {
      router.replace("/");
    }
  }, [isLoaded, isAllowed, router]);

  if (!isLoaded || !isAllowed) {
    return (
      <div className="flex h-screen items-center justify-center bg-neutral-950 text-neutral-50">
        <p className="text-sm text-neutral-400">Vérification des accès...</p>
      </div>
    );
  }

  const navItems = [
    { href: "/super-admin", icon: BarChart, label: "Dashboard" },
    { href: "/super-admin/entreprises", icon: Building2, label: "Workspaces" },
    { href: "/super-admin/ai", icon: Sparkles, label: "Moteur IA" },
    { href: "/super-admin/demo", icon: Users, label: "Leads Démo" },
    { href: "/super-admin/settings", icon: Settings, label: "Configuration" },
  ];

  return (
    <div className="flex h-screen overflow-hidden bg-neutral-950 text-neutral-50 font-sans selection:bg-indigo-500/30">
      {/* Sidebar - Dark Mode Forced */}
      <aside className="w-64 border-r border-neutral-800 bg-neutral-950 flex flex-col shrink-0">
        <div className="h-16 flex items-center px-6 border-b border-neutral-800">
          <div className="flex items-center gap-2 text-indigo-400">
            <Rocket className="h-5 w-5" />
            <span className="font-black tracking-tight text-white">IMMO PRO-X</span>
          </div>
        </div>

        <div className="px-4 py-4 flex items-center gap-3">
          <Avatar className="h-10 w-10 border border-indigo-500/30 shadow-[0_0_15px_rgba(99,102,241,0.2)]">
            <AvatarFallback className="bg-neutral-900 text-indigo-400 font-black text-xs">SA</AvatarFallback>
          </Avatar>
          <div>
            <p className="text-sm font-bold text-white leading-tight">Super Admin</p>
            <p className="text-[10px] text-neutral-400 flex items-center gap-1 font-medium mt-0.5">
              <ShieldAlert className="h-3 w-3 text-red-400" /> Accès God Mode
            </p>
          </div>
        </div>

        <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = pathname === item.href || (pathname.startsWith(item.href) && item.href !== "/super-admin");
            const Icon = item.icon;
            
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                  isActive 
                    ? "bg-indigo-500/10 text-indigo-400" 
                    : "text-neutral-400 hover:text-white hover:bg-neutral-900"
                )}
              >
                <Icon className={cn("h-4 w-4", isActive ? "text-indigo-400" : "text-neutral-500")} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 mt-auto border-t border-neutral-800">
          <Link href="/">
            <button className="flex w-full items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-neutral-400 hover:text-white hover:bg-neutral-900 transition-colors">
              <LogOut className="h-4 w-4 text-neutral-500" />
              Sortir du God Mode
            </button>
          </Link>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 bg-neutral-950 overflow-hidden">
        <header className="h-16 flex items-center px-8 border-b border-neutral-800 shrink-0">
          <h1 className="text-sm font-medium text-neutral-400">
            Interface Système — Ne pas communiquer les identifiants en dehors de l'équipe fondatrice.
          </h1>
        </header>
        <div className="flex-1 overflow-y-auto p-8">
          <div className="max-w-7xl mx-auto w-full">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
