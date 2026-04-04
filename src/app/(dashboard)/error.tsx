"use client";

import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function DashboardError({
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center h-[60vh] px-4 text-center animate-page-enter">
      <div className="w-20 h-20 rounded-2xl bg-destructive/10 flex items-center justify-center mb-6">
        <AlertTriangle className="h-10 w-10 text-destructive" strokeWidth={1.5} />
      </div>
      <h2 className="text-2xl font-bold mb-2">Oups, une erreur est survenue</h2>
      <p className="text-muted-foreground max-w-md mb-8">
        Nous n&apos;avons pas pu charger cette page. Veuillez reessayer ou revenir a l&apos;accueil.
      </p>
      <div className="flex items-center gap-3">
        <Button onClick={reset} variant="outline" className="gap-2">
          <RefreshCw className="h-4 w-4" />
          Reessayer
        </Button>
        <Link href="/">
          <Button className="gap-2">
            <Home className="h-4 w-4" />
            Accueil
          </Button>
        </Link>
      </div>
    </div>
  );
}
