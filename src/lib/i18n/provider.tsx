"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import {
  type Locale,
  type ITranslations,
  DEFAULT_LOCALE,
  LOCALE_DIRECTION,
  getDictionary,
} from "./index";

// ============================================================================
// Context
// ============================================================================

interface II18nContext {
  locale: Locale;
  dir: "ltr" | "rtl";
  t: ITranslations;
  setLocale: (locale: Locale) => void;
}

const I18nContext = createContext<II18nContext | null>(null);

// ============================================================================
// Provider
// ============================================================================

const STORAGE_KEY = "immo-pro-x-locale";

function getInitialLocale(): Locale {
  if (typeof window === "undefined") return DEFAULT_LOCALE;
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === "fr" || stored === "ar" || stored === "dz" || stored === "en") return stored;
  return DEFAULT_LOCALE;
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(DEFAULT_LOCALE);

  // Hydrate from localStorage on mount
  useEffect(() => {
    setLocaleState(getInitialLocale());
  }, []);

  const dir = LOCALE_DIRECTION[locale];
  const t = getDictionary(locale);

  const setLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale);
    localStorage.setItem(STORAGE_KEY, newLocale);
    // Update html attributes for RTL/LTR
    document.documentElement.lang = newLocale;
    document.documentElement.dir = LOCALE_DIRECTION[newLocale];
  }, []);

  // Set initial html attributes
  useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dir = dir;
  }, [locale, dir]);

  return (
    <I18nContext.Provider value={{ locale, dir, t, setLocale }}>
      {children}
    </I18nContext.Provider>
  );
}

// ============================================================================
// Hook
// ============================================================================

export function useI18n(): II18nContext {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    throw new Error("useI18n must be used within an I18nProvider");
  }
  return ctx;
}

/**
 * Shorthand hook — returns only the translations dictionary.
 */
export function useTranslation(): ITranslations {
  return useI18n().t;
}
