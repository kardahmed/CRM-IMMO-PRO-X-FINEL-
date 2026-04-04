import { AlertCircle } from "lucide-react";
import Link from "next/link";

export default function SuspendedPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="max-w-md text-center space-y-6">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
          <AlertCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
        </div>
        <h1 className="text-2xl font-bold">Compte suspendu</h1>
        <p className="text-muted-foreground">
          Votre espace de travail a ete suspendu. Veuillez contacter
          l&apos;administrateur ou le support pour reactiver votre compte.
        </p>
        <p className="text-sm text-muted-foreground">
          Email : support@immoprox.io
        </p>
        <Link
          href="/"
          className="inline-block rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Retour a l&apos;accueil
        </Link>
      </div>
    </div>
  );
}
