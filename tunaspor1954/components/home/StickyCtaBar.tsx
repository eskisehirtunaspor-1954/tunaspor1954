"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useI18n } from "@/lib/i18n/I18nProvider";

// Hero'daki "Takımları İncele" / "Akademiye Katıl" butonları kullanıcı Hero'yu
// geçip aşağı kaydırdığında ekranın en altında sabit bir bar olarak takip eder —
// böylece bu iki önemli aksiyon her zaman bir tık uzakta kalır.
export function StickyCtaBar() {
  const [visible, setVisible] = useState(false);
  const { t } = useI18n();

  useEffect(() => {
    function onScroll() {
      const pastHero = window.scrollY > window.innerHeight * 0.8;
      const nearBottom =
        window.innerHeight + window.scrollY > document.documentElement.scrollHeight - 400;
      setVisible(pastHero && !nearBottom);
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="fixed bottom-0 inset-x-0 z-30 bg-tuna-black/90 backdrop-blur-glass border-t border-tuna-gold/20 px-4 py-3"
        >
          <div className="max-w-7xl mx-auto flex items-center justify-center gap-3 flex-wrap">
            <a
              href="/takimlar"
              className="bg-tuna-gold text-tuna-black font-semibold px-6 py-2 rounded-full text-sm hover:brightness-110 hover:shadow-goldGlow transition-all"
            >
              {t("hero_cta_teams")}
            </a>
            <a
              href="/akademi"
              className="border border-tuna-gold/40 text-white px-6 py-2 rounded-full text-sm hover:border-tuna-gold hover:shadow-goldGlow transition-all"
            >
              {t("hero_cta_academy")}
            </a>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
