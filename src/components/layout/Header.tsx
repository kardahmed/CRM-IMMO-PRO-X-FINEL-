"use client";

import { useRouter } from "next/navigation";
import { Search, Settings, Menu, LogOut, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NotificationBell } from "@/components/layout/NotificationBell";
import { useSidebar } from "@/hooks/useSidebar";
import { GlobalSearch } from "@/components/layout/GlobalSearch";
import { CommandPaletteHint } from "@/components/shared/CommandPalette";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function Header() {
  const { firstName, lastName, tenantName, signOut } = useSupabaseAuth();
  const { toggleMobile } = useSidebar();
  const router = useRouter();
  const workspaceName = tenantName || "Mon Workspace";
  const initials = `${firstName?.[0] ?? ""}${lastName?.[0] ?? ""}`.toUpperCase() || "U";

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

        <div className="hidden md:flex flex-col items-end mr-2">
          <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
            Workspace
          </span>
          <span className="text-sm font-semibold text-primary">{workspaceName}</span>
        </div>

        <NotificationBell />

        <Button variant="ghost" size="icon" className="hover:bg-accent/50 hidden sm:flex" aria-label="Paramètres">
          <Settings className="h-5 w-5 text-muted-foreground" />
        </Button>

        <div className="h-8 w-px bg-border mx-1 hidden sm:block" />

        <div className="pl-1">
          <DropdownMenu>
            <DropdownMenuTrigger>
              <button className="h-8 w-8 md:h-9 md:w-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-semibold border-2 border-primary/20 hover:border-primary/50 transition-all cursor-pointer">
                {initials}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem disabled>
                <User className="mr-2 h-4 w-4" />
                Mon profil
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={async () => {
                  await signOut();
                  router.push("/sign-in");
                }}
              >
                <LogOut className="mr-2 h-4 w-4" />
                Se deconnecter
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
