"use client";

import { useModules } from "@/hooks/usePermissions";
import { MODULE_REGISTRY, type ModuleId } from "@/lib/modules";
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
  Target 
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const iconMap: Record<string, any> = {
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

export function Sidebar() {
  const modules = useModules();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const pathname = usePathname();

  const toggleSidebar = () => setIsCollapsed(!isCollapsed);

  return (
    <TooltipProvider delay={0}>
      <aside
        className={cn(
          "relative flex flex-col h-screen border-r bg-card transition-all duration-300 ease-in-out",
          isCollapsed ? "w-[70px]" : "w-[260px]"
        )}
      >
        <div className="flex items-center justify-between h-16 px-4 border-b">
          {!isCollapsed && (
            <span className="font-bold text-xl bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              IMMO PRO-X
            </span>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleSidebar}
            className="ml-auto hover:bg-accent"
          >
            {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
        </div>

        <ScrollArea className="flex-1 px-3 py-4">
          <nav className="flex flex-col gap-2">
            {modules.map((mId) => {
              const module = MODULE_REGISTRY[mId];
              if (!module) return null;
              const Icon = iconMap[module.icon] || LayoutDashboard;
              const isActive = pathname === "/dashboard" || pathname === `/${module.id.toLowerCase()}`;

              const content = (
                <Link
                  href={module.id === "DASHBOARD" ? "/dashboard" : `/${module.id.toLowerCase()}`}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-lg transition-colors group",
                    isActive 
                      ? "bg-primary text-primary-foreground shadow-md" 
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  )}
                >
                  <Icon className={cn("h-5 w-5 shrink-0", isActive ? "text-white" : "group-hover:text-primary")} />
                  {!isCollapsed && <span className="font-medium text-sm truncate">{module.label}</span>}
                </Link>
              );

              if (isCollapsed) {
                return (
                  <Tooltip key={mId}>
                    <TooltipTrigger
                      render={<div className="flex w-full cursor-pointer" />}
                    >
                      {content}
                    </TooltipTrigger>
                    <TooltipContent side="right">{module.label}</TooltipContent>
                  </Tooltip>
                );
              }

              return <div key={mId}>{content}</div>;
            })}
          </nav>
        </ScrollArea>

        <div className="p-4 border-t">
          {/* Footer Sidebar (Version, etc) */}
          {!isCollapsed && (
            <div className="text-[10px] text-muted-foreground text-center">
              v1.0.4 • © 2026 PRO-X
            </div>
          )}
        </div>
      </aside>
    </TooltipProvider>
  );
}
