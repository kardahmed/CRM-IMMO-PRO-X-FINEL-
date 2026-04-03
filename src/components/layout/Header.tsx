"use client";

import { UserButton, useUser } from "@clerk/nextjs";
import { Search, Settings } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { NotificationBell } from "@/components/layout/NotificationBell";

export function Header() {
  const { user } = useUser();
  const workspaceName = (user?.publicMetadata?.tenantName as string) || "Mon Workspace";

  return (
    <header className="h-16 border-b bg-background flex items-center justify-between px-6 sticky top-0 z-30 shadow-sm border-neutral-100 dark:border-neutral-800">
      <div className="flex items-center gap-4 flex-1">
        <div className="relative w-full max-w-xl lg:max-w-2xl">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher (clients, biens, tâches...)"
            className="pl-9 bg-accent/20 border-accent/30 focus-visible:ring-primary/50 shadow-inner rounded-xl h-10"
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="hidden md:flex flex-col items-end mr-2">
          <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Workspace</span>
          <span className="text-sm font-semibold text-primary">{workspaceName}</span>
        </div>

        {/* Notifications */}
        <NotificationBell />

        <Button variant="ghost" size="icon" className="hover:bg-accent/50">
          <Settings className="h-5 w-5 text-muted-foreground" />
        </Button>

        <div className="h-8 w-px bg-border mx-1" />

        {/* Avatar Clerk */}
        <div className="pl-1">
          <UserButton
            afterSignOutUrl="/sign-in"
            appearance={{
              elements: {
                userButtonAvatarBox: "h-9 w-9 border-2 border-primary/20 hover:border-primary/50 transition-all",
              }
            }}
          />
        </div>
      </div>
    </header>
  );
}
