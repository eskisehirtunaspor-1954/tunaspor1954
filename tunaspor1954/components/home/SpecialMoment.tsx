"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useAtmosphere } from "@/components/layout/AtmosphereProvider";

// Saat tam 19:54 olduğunda ~5 saniyeliğine ekrana gelen sinematik özel an.
// AtmosphereProvider bu anı saniye hassasiyetiyle hesaplayıp specialMoment=true yapıyor.
export function SpecialMoment() {
  const { specialMoment } = useAtmosphere();

  return (
    <AnimatePresence>
      {specialMoment && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1 }}
          className="fixed inset-0 z-[60] flex items-center justify-center pointer-events-none bg-black/40"
        >
          <motion.p
            initial={{ opacity: 0, scale: 0.85, letterSpacing: "0.1em" }}
            animate={{ opacity: 1, scale: 1, letterSpacing: "0.25em" }}
            exit={{ opacity: 0, scale: 1.05 }}
            transition={{ duration: 1.2, ease: "easeOut" }}
            className="font-display text-3xl sm:text-5xl md:text-6xl text-tuna-gold text-center px-6"
            style={{ textShadow: "0 0 30px rgba(255,215,0,0.8), 0 0 60px rgba(255,215,0,0.4)" }}
          >
            1954&apos;TEN BERİ AYNI TUTKU
          </motion.p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
