"use client";

import { useModules } from "@/hooks/usePermissions";
import { useSidebar } from "@/hooks/useSidebar";
import { MODULE_REGISTRY } from "@/lib/modules";
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
        const isActive =
          pathname === `/${mod.id.toLowerCase()}` ||
          pathname === "/dashboard" ||
          (mod.id === "DASHBOARD" && pathname === "/");

        const content = (
          <Link
            href={mod.id === "DASHBOARD" ? "/" : `/${mod.id.toLowerCase()}`}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group",
              isActive
                ? "bg-primary text-primary-foreground shadow-md"
                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            )}
          >
            <Icon
              className={cn(
                "h-5 w-5 shrink-0 transition-colors",
                isActive ? "text-white" : "group-hover:text-primary"
              )}
            />
            {!collapsed && (
              <span className="font-medium text-sm truncate">{mod.label}</span>
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

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between h-16 px-4 border-b shrink-0">
        {!collapsed && (
          <span className="font-bold text-xl bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            IMMO PRO-X
          </span>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleCollapse}
          className="ml-auto hover:bg-accent hidden md:flex"
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Nav */}
      <ScrollArea className="flex-1 px-3 py-4">
        <SidebarNav collapsed={collapsed} onNavigate={onNavigate} />
      </ScrollArea>

      {/* Footer */}
      <div className="p-4 border-t shrink-0">
        {!collapsed && (
          <div className="text-[10px] text-muted-foreground text-center">
            v1.0.4 &bull; &copy; 2026 PRO-X
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
          <Button variant="ghost" size="icon" onClick={closeMobile}>
            <X className="h-5 w-5" />
          </Button>
        </div>
        <SidebarContent collapsed={false} onNavigate={closeMobile} />
      </aside>
    </TooltipProvider>
  );
}
