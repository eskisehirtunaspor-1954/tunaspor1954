"use client";

import { useI18n } from "@/lib/i18n/I18nProvider";
import { ElementType } from "react";

// Sunucu bileşeni olan sayfalarda (veri çekimi server-side kalsın diye) statik
// başlık/etiket metinlerini çevirmek için küçük bir client "delik" (island).
// Kullanım: <T k="page_news_title" as="h1" className="..." />
export function T({
  k,
  as: Component = "span",
  className,
}: {
  k: string;
  as?: ElementType;
  className?: string;
}) {
  const { t } = useI18n();
  return <Component className={className}>{t(k)}</Component>;
}
