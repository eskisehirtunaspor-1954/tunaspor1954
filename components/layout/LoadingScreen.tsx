"use client";

import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import { useState } from "react";

export function LoadingScreen({ show }: { show: boolean }) {
  const [logoError, setLogoError] = useState(false);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 1 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
          className="fixed inset-0 z-[100] bg-tuna-black flex flex-col items-center justify-center gap-6"
        >
          <div className="relative w-24 h-24 flex items-center justify-center">
            {/* Altın renkli dönen halka */}
            <div
              className="absolute inset-0 rounded-full border-2 border-tuna-gold/20 border-t-tuna-gold animate-spin"
              style={{ animationDuration: "1.1s" }}
            />
            <div
              className="absolute inset-2 rounded-full border border-tuna-gold/10 border-b-tuna-gold/60 animate-spin"
              style={{ animationDuration: "1.6s", animationDirection: "reverse" }}
            />
            {!logoError ? (
              <Image
                src="/images/logo.png"
                alt="Tunaspor 1954"
                width={44}
                height={44}
                className="object-contain animate-breathe motion-reduce:animate-none"
                onError={() => setLogoError(true)}
                priority
              />
            ) : (
              <span className="font-display text-2xl text-tuna-gold">1954</span>
            )}
          </div>

          <div className="text-center">
            <p className="font-display text-lg tracking-[0.2em] text-tuna-gold">SAHA HAZIRLANIYOR</p>
            <p className="text-xs text-tuna-mist mt-1 animate-pulse">Tunaspor 1954</p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
