"use client";

import { UserButton, useUser } from "@clerk/nextjs";
import { Search, Settings, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NotificationBell } from "@/components/layout/NotificationBell";
import { useSidebar } from "@/hooks/useSidebar";
import { GlobalSearch } from "@/components/layout/GlobalSearch";

export function Header() {
  const { user } = useUser();
  const { toggleMobile } = useSidebar();
  const workspaceName = (user?.publicMetadata?.tenantName as string) || "Mon Workspace";

  return (
    <header className="h-14 md:h-16 border-b bg-background flex items-center justify-between px-3 md:px-6 sticky top-0 z-30 shadow-sm border-neutral-100 dark:border-neutral-800">
      <div className="flex items-center gap-2 md:gap-4 flex-1">
        {/* Mobile hamburger */}
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden shrink-0"
          onClick={toggleMobile}
        >
          <Menu className="h-5 w-5" />
        </Button>

        {/* Mobile logo */}
        <span className="font-bold text-lg bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent md:hidden">
          PRO-X
        </span>

        <div className="hidden sm:block flex-1">
          <GlobalSearch />
        </div>
      </div>

      <div className="flex items-center gap-2 md:gap-4">
        {/* Mobile search button */}
        <Button variant="ghost" size="icon" className="sm:hidden">
          <Search className="h-5 w-5 text-muted-foreground" />
        </Button>

        <div className="hidden md:flex flex-col items-end mr-2">
          <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
            Workspace
          </span>
          <span className="text-sm font-semibold text-primary">{workspaceName}</span>
        </div>

        <NotificationBell />

        <Button variant="ghost" size="icon" className="hover:bg-accent/50 hidden sm:flex">
          <Settings className="h-5 w-5 text-muted-foreground" />
        </Button>

        <div className="h-8 w-px bg-border mx-1 hidden sm:block" />

        <div className="pl-1">
          <UserButton
            afterSignOutUrl="/sign-in"
            appearance={{
              elements: {
                userButtonAvatarBox:
                  "h-8 w-8 md:h-9 md:w-9 border-2 border-primary/20 hover:border-primary/50 transition-all",
              },
            }}
          />
        </div>
      </div>
    </header>
  );
}
