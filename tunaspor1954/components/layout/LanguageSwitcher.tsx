"use client";

import { useI18n } from "@/lib/i18n/I18nProvider";
import { SUPPORTED_LOCALES } from "@/lib/i18n/fallback-dictionary";

const LABELS: Record<string, string> = {
  tr: "Türkçe", en: "English", de: "Deutsch", fr: "Français",
  es: "Español", it: "Italiano", ar: "العربية", ru: "Русский",
};

// Bayrak emojileri — Unicode bölgesel gösterge harflerinden oluşur, ek bir
// görsel dosya/kütüphane gerektirmez, her tarayıcıda native render edilir.
const FLAGS: Record<string, string> = {
  tr: "🇹🇷", en: "🇬🇧", de: "🇩🇪", fr: "🇫🇷",
  es: "🇪🇸", it: "🇮🇹", ar: "🇸🇦", ru: "🇷🇺",
};

export function LanguageSwitcher() {
  const { locale, setLocale } = useI18n();

  return (
    <div className="relative flex items-center gap-1.5 text-sm">
      <span className="text-base leading-none">{FLAGS[locale]}</span>
      <select
        aria-label="Dil seçin"
        value={locale}
        onChange={(e) => setLocale(e.target.value as any)}
        className="bg-transparent outline-none cursor-pointer"
      >
        {SUPPORTED_LOCALES.map((code) => (
          <option key={code} value={code} className="text-tuna-black">
            {FLAGS[code]} {LABELS[code]}
          </option>
        ))}
      </select>
    </div>
  );
}
