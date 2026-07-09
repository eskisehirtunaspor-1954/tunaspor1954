"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { AnimatePresence, motion } from "framer-motion";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { useAtmosphere } from "@/components/layout/AtmosphereProvider";
import { StadiumBackground } from "./StadiumBackground";
import { BirdsEffect } from "./BirdsEffect";
import { SpecialMoment } from "./SpecialMoment";
import type { LightningIntensity } from "./LightningSystem";

// Bu iki katman Hero'nun görsel olarak hemen görünmesi için gerekli değil
// (ambiyans sesi kapalı başlar, şimşek yalnızca fırtınalı modda görünür) —
// bu yüzden ayrı chunk'a bölünüp ilk boyamadan sonra yükleniyor.
const AmbientSoundscape = dynamic(() => import("./AmbientSoundscape").then((m) => m.AmbientSoundscape), { ssr: false });
const LightningSystem = dynamic(() => import("./LightningSystem").then((m) => m.LightningSystem), { ssr: false });

const ATMOSPHERE_BADGE: Record<string, string> = {
  sabah: "🌤️ Antrenman Vakti",
  ogle: "☀️ Sahalar Hazır",
  aksam: "🌅 Maç Hazırlığı",
  gece: "🌙 Maç Günü Atmosferi",
};

// Yazı öğeleri tek tek, hafif gecikmeli olarak belirsin (kademeli/staggered giriş).
const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12, delayChildren: 0.1 } },
};
const item = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: "easeOut" } },
};

export function Hero({
  matchCard,
  infoPanel,
  lightningIntensity = "orta",
}: {
  matchCard: React.ReactNode;
  infoPanel: React.ReactNode;
  lightningIntensity?: LightningIntensity;
}) {
  const { t } = useI18n();
  const { atmosphere } = useAtmosphere();
  // "1954'ten beri Eskişehir'in gururu" etiketi ekranda kalıcı durmasın diye
  // ~10 saniye sonra yumuşakça kayboluyor (rozet ve geri kalan içerik kalıyor).
  const [taglineVisible, setTaglineVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setTaglineVisible(false), 10_000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <section className="relative min-h-[92vh] flex items-center px-4 md:px-10 overflow-hidden">
      <StadiumBackground />
      <BirdsEffect />
      <SpecialMoment />
      <AmbientSoundscape />
      <LightningSystem intensity={lightningIntensity} />

      <div className="relative z-10 w-full max-w-7xl mx-auto grid lg:grid-cols-[1.3fr_0.9fr] gap-10 items-center py-24">
        {/* SOL: başlık + açıklama + butonlar — her biri kademeli giriyor */}
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="text-center lg:text-left"
        >
          <motion.div variants={item} className="flex items-center gap-3 justify-center lg:justify-start mb-4 flex-wrap">
            <AnimatePresence>
              {taglineVisible && (
                <motion.p
                  className="eyebrow"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.8 }}
                >
                  {t("hero_tagline")}
                </motion.p>
              )}
            </AnimatePresence>
            <span className="text-xs text-tuna-gold/80 border border-tuna-gold/25 rounded-full px-3 py-1">
              {ATMOSPHERE_BADGE[atmosphere]}
            </span>
          </motion.div>

          <motion.h1 variants={item} className="font-display text-6xl md:text-8xl leading-[0.95] text-white">
            TUNASPOR{" "}
            <span
              className="relative inline-block text-tuna-gold bg-clip-text"
              style={{ textShadow: "0 0 30px rgba(255,215,0,0.5)" }}
            >
              1954
              {/* Altın shine/parıltı süpürmesi — periyodik olarak metnin üzerinden geçer */}
              <span
                aria-hidden="true"
                className="absolute inset-0 pointer-events-none mix-blend-overlay"
                style={{
                  background:
                    "linear-gradient(110deg, transparent 30%, rgba(255,255,255,0.9) 50%, transparent 70%)",
                  backgroundSize: "250% 100%",
                  animation: "heroShine 5s ease-in-out infinite",
                }}
              />
            </span>
          </motion.h1>

          <motion.p variants={item} className="mt-6 max-w-xl mx-auto lg:mx-0 text-tuna-mist text-lg">
            A Takım'dan U9 akademi kategorisine kadar, sahada ve sahanın dışında
            Tunaspor ailesinin resmi dijital evi.
          </motion.p>

          <motion.div variants={item} className="mt-10 flex flex-wrap gap-4 justify-center lg:justify-start">
            <a
              href="/takimlar"
              className="group relative overflow-hidden bg-tuna-gold text-tuna-black font-semibold px-8 py-3.5 rounded-full transition-transform hover:scale-105 hover:shadow-goldGlowLg"
            >
              <span className="relative z-10">{t("hero_cta_teams")}</span>
              <span className="absolute inset-0 bg-white/30 -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
            </a>
            <a
              href="/akademi"
              className="group relative overflow-hidden border border-tuna-gold/40 text-white px-8 py-3.5 rounded-full transition-all hover:border-tuna-gold hover:shadow-goldGlow"
            >
              <span className="relative z-10">{t("hero_cta_academy")}</span>
            </a>
          </motion.div>
        </motion.div>

        {/* SAĞ: maç kartı + canlı Eskişehir paneli */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
          className="flex flex-col items-center lg:items-end gap-5"
        >
          {matchCard}
          {infoPanel}
        </motion.div>
      </div>

      <style>{`
        @keyframes heroShine {
          0%, 100% { background-position: 200% 0; }
          50% { background-position: -50% 0; }
        }
        @media (prefers-reduced-motion: reduce) {
          .mix-blend-overlay { animation: none !important; }
        }
      `}</style>
    </section>
  );
}
