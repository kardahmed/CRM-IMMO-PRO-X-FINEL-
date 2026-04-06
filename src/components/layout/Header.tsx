"use client";

import { useRouter, usePathname } from "next/navigation";
import { Search, Settings, Menu, LogOut, User, Shield, Building2, HardHat, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NotificationBell } from "@/components/layout/NotificationBell";
import { useSidebar } from "@/hooks/useSidebar";
import { GlobalSearch } from "@/components/layout/GlobalSearch";
import { CommandPaletteHint } from "@/components/shared/CommandPalette";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuGroup,
} from "@/components/ui/dropdown-menu";

export function Header() {
  const { firstName, lastName, tenantName, signOut, isSuperAdmin, workspaceType, email } = useSupabaseAuth();
  const { toggleMobile } = useSidebar();
  const router = useRouter();
  const pathname = usePathname();
  const workspaceName = tenantName || "Mon Workspace";
  const initials = `${firstName?.[0] ?? ""}${lastName?.[0] ?? ""}`.toUpperCase() || "U";

  const isSuperAdminRoute = pathname.startsWith("/super-admin");

  // Determine current mode for badge display
  const currentMode = isSuperAdminRoute
    ? "Super Admin"
    : workspaceType === "PROMOTION"
      ? "Promotion"
      : "Agence";

  const modeColor = isSuperAdminRoute
    ? "bg-red-500/10 text-red-600 border-red-200"
    : workspaceType === "PROMOTION"
      ? "bg-amber-500/10 text-amber-700 border-amber-200"
      : "bg-emerald-500/10 text-emerald-700 border-emerald-200";

  return (
    <header className="h-14 md:h-16 border-b bg-background flex items-center justify-between px-3 md:px-6 sticky top-0 z-30 shadow-sm border-border">
      <div className="flex items-center gap-2 md:gap-4 flex-1">
        {/* Mobile hamburger */}
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden shrink-0"
          onClick={toggleMobile}
          aria-label="Ouvrir le menu"
        >
          <Menu className="h-5 w-5" />
        </Button>

        {/* Mobile logo */}
        <span className="font-bold text-lg bg-gradient-to-r from-emerald-600 to-emerald-500 bg-clip-text text-transparent md:hidden">
          PRO-X
        </span>

        <div className="hidden sm:flex items-center gap-3 flex-1">
          <GlobalSearch />
          <CommandPaletteHint />
        </div>
      </div>

      <div className="flex items-center gap-2 md:gap-4">
        {/* Mobile search button */}
        <Button variant="ghost" size="icon" className="sm:hidden" aria-label="Rechercher">
          <Search className="h-5 w-5 text-muted-foreground" />
        </Button>

        {/* Current mode badge */}
        <Badge variant="outline" className={`hidden md:flex text-xs font-bold ${modeColor}`}>
          {currentMode}
        </Badge>

        <NotificationBell />

        <div className="h-8 w-px bg-border mx-1 hidden sm:block" />

        {/* Avatar dropdown with modes */}
        <div className="pl-1">
          <DropdownMenu>
            <DropdownMenuTrigger>
              <button aria-label="Menu utilisateur" className="h-8 w-8 md:h-9 md:w-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-semibold border-2 border-primary/20 hover:border-primary/50 transition-all cursor-pointer">
                {initials}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              {/* User info */}
              <div className="px-3 py-2">
                <p className="text-sm font-bold">{firstName} {lastName}</p>
                <p className="text-xs text-muted-foreground">{email}</p>
              </div>
              <DropdownMenuSeparator />

              {/* Mode switching */}
              <DropdownMenuGroup>
              <DropdownMenuLabel className="text-xs text-muted-foreground uppercase tracking-wider font-bold">
                Mode
              </DropdownMenuLabel>

              {isSuperAdmin && (
                <DropdownMenuItem
                  onClick={() => router.push("/super-admin")}
                  className={`gap-2 ${isSuperAdminRoute ? "bg-red-50 dark:bg-red-950/20" : ""}`}
                >
                  <Shield className="h-4 w-4 text-red-500" />
                  <span className="flex-1 font-medium">Super Admin</span>
                  {isSuperAdminRoute && (
                    <Badge variant="outline" className="text-xs h-5 bg-red-500/10 text-red-600 border-red-200">
                      Actif
                    </Badge>
                  )}
                  {!isSuperAdminRoute && <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />}
                </DropdownMenuItem>
              )}

              <DropdownMenuItem
                onClick={() => router.push("/dashboard")}
                className={`gap-2 ${!isSuperAdminRoute && workspaceType !== "PROMOTION" ? "bg-emerald-50 dark:bg-emerald-950/20" : ""}`}
              >
                <Building2 className="h-4 w-4 text-emerald-600" />
                <span className="flex-1 font-medium">Agence</span>
                {!isSuperAdminRoute && workspaceType !== "PROMOTION" && (
                  <Badge variant="outline" className="text-xs h-5 bg-emerald-500/10 text-emerald-600 border-emerald-200">
                    Actif
                  </Badge>
                )}
                {(isSuperAdminRoute || workspaceType === "PROMOTION") && <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />}
              </DropdownMenuItem>

              <DropdownMenuItem
                onClick={() => router.push("/dashboard")}
                className={`gap-2 ${!isSuperAdminRoute && workspaceType === "PROMOTION" ? "bg-amber-50 dark:bg-amber-950/20" : ""}`}
              >
                <HardHat className="h-4 w-4 text-amber-600" />
                <span className="flex-1 font-medium">Promotion</span>
                {!isSuperAdminRoute && workspaceType === "PROMOTION" && (
                  <Badge variant="outline" className="text-xs h-5 bg-amber-500/10 text-amber-600 border-amber-200">
                    Actif
                  </Badge>
                )}
                {(isSuperAdminRoute || workspaceType !== "PROMOTION") && <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />}
              </DropdownMenuItem>

              </DropdownMenuGroup>
              <DropdownMenuSeparator />

              {/* Profile & Logout */}
              <DropdownMenuItem onClick={() => router.push("/settings")} className="gap-2">
                <Settings className="h-4 w-4" />
                Paramètres
              </DropdownMenuItem>

              <DropdownMenuItem disabled className="gap-2">
                <User className="h-4 w-4" />
                Mon profil
              </DropdownMenuItem>

              <DropdownMenuSeparator />

              <DropdownMenuItem
                onClick={async () => {
                  await signOut();
                  router.push("/sign-in");
                }}
                className="gap-2 text-red-600 focus:text-red-600"
              >
                <LogOut className="h-4 w-4" />
                Se déconnecter
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
