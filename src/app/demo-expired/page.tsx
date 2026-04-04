import { Clock } from "lucide-react";
import Link from "next/link";

export default function DemoExpiredPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="max-w-md text-center space-y-6">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30">
          <Clock className="h-8 w-8 text-amber-600 dark:text-amber-400" />
        </div>
        <h1 className="text-2xl font-bold">Demo expiree</h1>
        <p className="text-muted-foreground">
          Votre periode d&apos;essai de 14 jours est terminee. Passez a un
          abonnement pour continuer a utiliser IMMO PRO-X.
        </p>
        <div className="flex flex-col gap-3">
          <Link
            href="/#pricing"
            className="inline-block rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Voir les plans tarifaires
          </Link>
          <Link
            href="/"
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            Retour a l&apos;accueil
          </Link>
        </div>
      </div>
    </div>
  );
}
