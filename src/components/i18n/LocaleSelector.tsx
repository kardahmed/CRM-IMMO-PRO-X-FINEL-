"use client";

import { useState, useEffect } from "react";
import { Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Locale } from "@/lib/i18n/translations";

// ---------------------------------------------------------------------------
// Labels affiches dans le selecteur de langue.
// ---------------------------------------------------------------------------
const LOCALE_LABELS: Record<Locale, string> = {
  fr: "Francais",
  ar: "العربية",
  dz: "الدارجة",
  en: "English",
};

const VALID_LOCALES: Locale[] = ["fr", "ar", "dz", "en"];
const STORAGE_KEY = "crm-locale";

// ---------------------------------------------------------------------------
// Composant selecteur de langue (dropdown).
// Stocke la locale dans localStorage sous la cle "crm-locale".
// Un rechargement complet est effectue pour appliquer la nouvelle langue.
// ---------------------------------------------------------------------------
export function LocaleSelector() {
  const [locale, setLocale] = useState<Locale>("fr");

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as Locale | null;
    if (stored && (VALID_LOCALES as string[]).includes(stored)) {
      setLocale(stored);
    }
  }, []);

  const handleChange = (newLocale: Locale) => {
    setLocale(newLocale);
    localStorage.setItem(STORAGE_KEY, newLocale);
    window.location.reload();
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            size="sm"
            className="gap-1.5"
          />
        }
      >
        <Globe className="h-4 w-4" />
        <span className="text-xs">{LOCALE_LABELS[locale]}</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {VALID_LOCALES.map((key) => (
          <DropdownMenuItem
            key={key}
            onClick={() => handleChange(key)}
            className={locale === key ? "bg-accent font-semibold" : ""}
          >
            {LOCALE_LABELS[key]}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
