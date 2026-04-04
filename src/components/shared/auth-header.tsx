"use client";

import {
  SignedIn,
  SignedOut,
  SignInButton,
  SignUpButton,
  UserButton,
} from "@clerk/nextjs";
import { usePathname } from "next/navigation";

const HIDDEN_ROUTES = ["/onboarding", "/dashboard", "/pipeline", "/clients", "/planning", "/map", "/projects", "/settings", "/objectives", "/performance"];

export function AuthHeader() {
  const pathname = usePathname();

  // Hide on routes that have their own header
  const isHidden = HIDDEN_ROUTES.some((route) => pathname.startsWith(route));
  if (isHidden) return null;

  return (
    <header className="flex items-center justify-end gap-2 p-4">
      <SignedOut>
        <SignInButton />
        <SignUpButton />
      </SignedOut>
      <SignedIn>
        <UserButton />
      </SignedIn>
    </header>
  );
}
