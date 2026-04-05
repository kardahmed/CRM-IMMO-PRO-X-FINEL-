"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";

const HIDDEN_ROUTES = [
  "/onboarding", "/dashboard", "/pipeline", "/clients", "/planning", "/map",
  "/projects", "/settings", "/objectives", "/performance", "/notifications",
  "/owners", "/mandates", "/payments", "/commissions", "/construction",
  "/availability", "/automations", "/ai", "/documents", "/cadastre",
  "/portal-manager", "/audit-log", "/portfolio", "/transaction-type",
  "/super-admin",
];

export function AuthHeader() {
  const pathname = usePathname();
  const { user, isLoaded, signOut, firstName, lastName } = useSupabaseAuth();

  // Hide on routes that have their own header
  const isHidden = HIDDEN_ROUTES.some((route) => pathname.startsWith(route));
  if (isHidden) return null;

  if (!isLoaded) return null;

  const initials = `${firstName?.[0] ?? ""}${lastName?.[0] ?? ""}`.toUpperCase() || "U";

  return (
    <header className="flex items-center justify-end gap-2 p-4">
      {!user ? (
        <>
          <Link href="/sign-in">
            <Button variant="ghost" size="sm">Se connecter</Button>
          </Link>
          <Link href="/sign-up">
            <Button size="sm">S&apos;inscrire</Button>
          </Link>
        </>
      ) : (
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-semibold">
            {initials}
          </div>
          <Button variant="ghost" size="icon" aria-label="Se déconnecter" onClick={signOut}>
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      )}
    </header>
  );
}
