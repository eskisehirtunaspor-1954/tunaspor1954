"use client";

import { createContext, useContext, useCallback, useEffect, useMemo, useState, ReactNode } from "react";
import { FALLBACK_DICTIONARY, SUPPORTED_LOCALES, RTL_LOCALES, SupportedLocale } from "./fallback-dictionary";

const LOCALE_COOKIE = "tunaspor_locale";

interface I18nContextValue {
  locale: SupportedLocale;
  setLocale: (locale: SupportedLocale) => void;
  t: (key: string) => string;
  availableLocales: { code: string; name: string }[];
}

const I18nContext = createContext<I18nContextValue>({
  locale: "tr",
  setLocale: () => {},
  t: (key) => key,
  availableLocales: [],
});

export const useI18n = () => useContext(I18nContext);

function readCookieLocale(): SupportedLocale {
  if (typeof document === "undefined") return "tr";
  const match = document.cookie.match(new RegExp(`${LOCALE_COOKIE}=([^;]+)`));
  const value = match?.[1] as SupportedLocale | undefined;
  return value && SUPPORTED_LOCALES.includes(value) ? value : "tr";
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<SupportedLocale>("tr");
  const [overrides, setOverrides] = useState<Record<string, Record<string, string>>>({});
  const [availableLocales, setAvailableLocales] = useState<{ code: string; name: string }[]>([]);

  useEffect(() => {
    setLocaleState(readCookieLocale());
    fetch("/api/translations?namespace=nav")
      .then((r) => r.json())
      .then((d) => {
        setOverrides(d.dictionary ?? {});
        if (d.languages?.length) {
          setAvailableLocales(d.languages.map((l: any) => ({ code: l.code, name: l.name })));
        }
      })
      .catch(() => {});
  }, []);

  const setLocale = useCallback((next: SupportedLocale) => {
    setLocaleState(next);
    document.cookie = `${LOCALE_COOKIE}=${next}; path=/; max-age=${60 * 60 * 24 * 365}`;
    document.documentElement.lang = next;
    document.documentElement.dir = RTL_LOCALES.includes(next) ? "rtl" : "ltr";
  }, []);

  const t = useCallback(
    (key: string): string =>
      overrides[locale]?.[key] ?? FALLBACK_DICTIONARY[locale]?.[key] ?? FALLBACK_DICTIONARY.tr[key] ?? key,
    [overrides, locale]
  );

  // setLocale/t her render'da yeniden oluşan fonksiyonlar olmasın diye useCallback,
  // value nesnesi de useMemo ile sarmalandı — aksi halde bu context'i okuyan
  // Navbar, HamburgerMenu, Hero, Footer gibi pek çok bileşen gereksiz yere render olurdu.
  const value = useMemo(
    () => ({ locale, setLocale, t, availableLocales }),
    [locale, setLocale, t, availableLocales]
  );

  return (
    <I18nContext.Provider value={value}>
      {children}
    </I18nContext.Provider>
  );
}
