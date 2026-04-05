"use client";

import { useCallback } from "react";
import { translations, type Locale } from "@/lib/i18n/translations";

// ---------------------------------------------------------------------------
// Hook de traduction flat-key pour le module Automatisations.
// Utilise le dictionnaire flat-key de translations.ts (fr, ar, dz, en).
// La locale est lue depuis localStorage (cle "crm-locale") avec fallback
// sur "fr". Plus tard, elle pourra provenir des parametres utilisateur/tenant.
// ---------------------------------------------------------------------------

const STORAGE_KEY = "crm-locale";
const DEFAULT_LOCALE: Locale = "fr";

function getStoredLocale(): Locale {
  if (typeof window === "undefined") return DEFAULT_LOCALE;
  const stored = localStorage.getItem(STORAGE_KEY) as Locale | null;
  if (stored && (["fr", "ar", "dz", "en"] as string[]).includes(stored)) {
    return stored;
  }
  return DEFAULT_LOCALE;
}

export function useTranslation(overrideLocale?: Locale) {
  const locale = overrideLocale ?? getStoredLocale();
  const dict = translations[locale] ?? translations.fr;

  const t = useCallback(
    (key: string, params?: Record<string, string | number>): string => {
      let value = dict[key] ?? translations.fr[key] ?? key;
      if (params) {
        for (const [k, v] of Object.entries(params)) {
          value = value.replace(new RegExp(`\\{${k}\\}`, "g"), String(v));
        }
      }
      return value;
    },
    [dict],
  );

  return { t, locale, isRTL: locale === "ar" || locale === "dz" };
}
