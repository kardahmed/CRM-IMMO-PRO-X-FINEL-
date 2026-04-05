"use client";

import { useModules } from "@/hooks/usePermissions";
import { useSidebar } from "@/hooks/useSidebar";
import { MODULE_REGISTRY } from "@/lib/modules";
import { getModuleHref } from "@/lib/navigation";
import { cn } from "@/lib/utils";
import {
  ChevronLeft,
  ChevronRight,
  Kanban,
  Users,
  Calendar,
  LayoutDashboard,
  Bell,
  Settings,
  ScrollText,
  Building2,
  HardHat,
  Grid3X3,
  Banknote,
  Home,
  UserCheck,
  FileSignature,
  Percent,
  ArrowLeftRight,
  Zap,
  Sparkles,
  Map,
  MapPin,
  Globe,
  TrendingUp,
  FileText,
  Target,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Logo } from "@/components/ui/Logo";
import { LogOut } from "lucide-react";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  kanban: Kanban,
  users: Users,
  calendar: Calendar,
  "layout-dashboard": LayoutDashboard,
  bell: Bell,
  settings: Settings,
  "scroll-text": ScrollText,
  "building-2": Building2,
  "hard-hat": HardHat,
  "grid-3x3": Grid3X3,
  banknote: Banknote,
  home: Home,
  "user-check": UserCheck,
  "file-signature": FileSignature,
  percent: Percent,
  "arrow-left-right": ArrowLeftRight,
  zap: Zap,
  sparkles: Sparkles,
  map: Map,
  "map-pin": MapPin,
  globe: Globe,
  "trending-up": TrendingUp,
  "file-text": FileText,
  target: Target,
};

function SidebarNav({ collapsed, onNavigate }: { collapsed: boolean; onNavigate?: () => void }) {
  const modules = useModules();
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-1">
      {modules.map((mId) => {
        const mod = MODULE_REGISTRY[mId];
        if (!mod) return null;
        const Icon = iconMap[mod.icon] || LayoutDashboard;
        const href = getModuleHref(mId);
        const isActive =
          pathname === href ||
          (mId === "DASHBOARD" && (pathname === "/dashboard" || pathname === "/")) ||
          (mId !== "DASHBOARD" && pathname.startsWith(href + "/"));

        const content = (
          <Link
            href={href}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-3 px-3 py-2 rounded-xl transition-all duration-300 group relative",
              isActive
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-accent hover:text-foreground"
            )}
          >
            {isActive && (
              <div className="absolute left-0 w-1 h-5 bg-primary rounded-r-full animate-in fade-in slide-in-from-left-2 duration-500" />
            )}
            <Icon
              className={cn(
                "h-5 w-5 shrink-0 transition-all duration-300",
                isActive ? "text-primary scale-110" : "group-hover:text-primary group-hover:scale-110"
              )}
            />
            {!collapsed && (
              <span className={cn(
                "font-bold text-xs uppercase tracking-tight truncate transition-all duration-300",
                isActive ? "opacity-100" : "opacity-70 group-hover:opacity-100"
              )}>
                {mod.label}
              </span>
            )}
          </Link>
        );

        if (collapsed) {
          return (
            <Tooltip key={mId}>
              <TooltipTrigger render={<div className="flex w-full cursor-pointer" />}>
                {content}
              </TooltipTrigger>
              <TooltipContent side="right">{mod.label}</TooltipContent>
            </Tooltip>
          );
        }

        return <div key={mId}>{content}</div>;
      })}
    </nav>
  );
}

function SidebarContent({ collapsed, onNavigate }: { collapsed: boolean; onNavigate?: () => void }) {
  const { toggleCollapse } = useSidebar();
  const { signOut } = useSupabaseAuth();

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between h-20 px-6 border-b border-border shrink-0">
        <Logo 
          collapsed={collapsed} 
          showText={!collapsed} 
          width={32} 
          height={32} 
        />
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleCollapse}
          aria-label="Réduire le menu"
          className="ml-auto hover:bg-accent rounded-xl h-8 w-8 hidden md:flex text-muted-foreground transition-all active:scale-95"
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Nav */}
      <ScrollArea className="flex-1 px-4 py-6">
        <SidebarNav collapsed={collapsed} onNavigate={onNavigate} />
      </ScrollArea>

      {/* Footer */}
      <div className="p-4 border-t border-border shrink-0">
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 h-11 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/5 group transition-all"
          onClick={() => signOut()}
        >
          <LogOut className="h-5 w-5 transition-transform group-hover:rotate-12" />
          {!collapsed && <span className="font-bold text-xs uppercase tracking-tight">Déconnexion</span>}
        </Button>
        {!collapsed && (
          <div className="mt-4 text-xs text-muted-foreground/50 text-center font-bold uppercase tracking-widest">
            v1.0.5 &bull; PRO-X REDESIGN
          </div>
        )}
      </div>
    </>
  );
}

export function Sidebar() {
  const { isMobileOpen, isCollapsed, closeMobile } = useSidebar();

  return (
    <TooltipProvider delay={0}>
      {/* Desktop / Tablet sidebar */}
      <aside
        className={cn(
          "relative hidden md:flex flex-col h-screen border-r bg-card transition-all duration-300 ease-in-out shrink-0",
          isCollapsed ? "w-[70px]" : "w-[260px]"
        )}
      >
        <SidebarContent collapsed={isCollapsed} />
      </aside>

      {/* Mobile overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden animate-in fade-in-0 duration-200"
          onClick={closeMobile}
        />
      )}

      {/* Mobile sidebar drawer */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex flex-col w-[280px] bg-card border-r shadow-xl transition-transform duration-300 ease-in-out md:hidden",
          isMobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Mobile close button */}
        <div className="absolute top-4 right-4 z-10">
          <Button variant="ghost" size="icon" aria-label="Fermer le menu" onClick={closeMobile}>
            <X className="h-5 w-5" />
          </Button>
        </div>
        <SidebarContent collapsed={false} onNavigate={closeMobile} />
      </aside>
    </TooltipProvider>
  );
}
