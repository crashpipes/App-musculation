"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState
} from "react";

export type Locale = "fr" | "en";

interface I18nValue {
  locale: Locale;
  setLocale: (l: Locale) => void;
  toggle: () => void;
  // Renvoie la chaîne dans la langue courante.
  t: (fr: string, en: string) => string;
}

const I18nContext = createContext<I18nValue | null>(null);

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("fr");

  useEffect(() => {
    const stored =
      typeof window !== "undefined"
        ? (localStorage.getItem("locale") as Locale | null)
        : null;
    if (stored === "fr" || stored === "en") setLocaleState(stored);
  }, []);

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l);
    if (typeof window !== "undefined") {
      localStorage.setItem("locale", l);
      document.documentElement.lang = l;
    }
  }, []);

  const toggle = useCallback(
    () => setLocale(locale === "fr" ? "en" : "fr"),
    [locale, setLocale]
  );

  const t = useCallback(
    (fr: string, en: string) => (locale === "en" ? en : fr),
    [locale]
  );

  return (
    <I18nContext.Provider value={{ locale, setLocale, toggle, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n(): I18nValue {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n doit être utilisé dans I18nProvider");
  return ctx;
}
