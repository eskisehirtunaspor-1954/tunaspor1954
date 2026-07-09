"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

type Zone = "sol" | "orta" | "sag";
const ZONES: Zone[] = ["sol", "orta", "sag"];
const TOTAL_SHOTS = 5;

interface ShotResult {
  zone: Zone;
  keeperZone: Zone;
  scored: boolean;
}

export function PenaltyGame({ onFinish }: { onFinish: (score: number) => void }) {
  const [shotsTaken, setShotsTaken] = useState(0);
  const [score, setScore] = useState(0);
  const [lastResult, setLastResult] = useState<ShotResult | null>(null);
  const [animating, setAnimating] = useState(false);
  const [ballPos, setBallPos] = useState<Zone | null>(null);

  function shoot(zone: Zone) {
    if (animating || shotsTaken >= TOTAL_SHOTS) return;
    setAnimating(true);
    setBallPos(zone);

    const keeperZone = ZONES[Math.floor(Math.random() * ZONES.length)];
    const scored = zone !== keeperZone;

    setTimeout(() => {
      setLastResult({ zone, keeperZone, scored });

      setScore((prevScore) => {
        const newScore = scored ? prevScore + 1 : prevScore;

        setShotsTaken((prevShots) => {
          const nextShots = prevShots + 1;
          if (nextShots >= TOTAL_SHOTS) {
            setTimeout(() => onFinish(newScore), 1400);
          }
          return nextShots;
        });

        return newScore;
      });

      setTimeout(() => {
        setAnimating(false);
        setBallPos(null);
      }, 900);
    }, 500);
  }

  const zoneOffset: Record<Zone, number> = { sol: -70, orta: 0, sag: 70 };

  return (
    <div className="text-center">
      <div className="flex items-center justify-center gap-6 mb-4 text-sm">
        <span className="text-tuna-mist">Atış: {Math.min(shotsTaken + (animating ? 1 : 0), TOTAL_SHOTS)}/{TOTAL_SHOTS}</span>
        <span className="text-tuna-gold font-display text-lg">Gol: {score}</span>
      </div>

      {/* Kale alanı */}
      <div className="relative mx-auto mb-6 w-full max-w-md h-56 bg-gradient-to-b from-green-800/40 to-green-900/20 rounded-2xl border-2 border-white/20 overflow-hidden">
        {/* Kale çubukları */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 w-4/5 h-32 border-4 border-white/70 border-b-0 rounded-t-md" />

        {/* Kaleci */}
        <AnimatePresence>
          {lastResult && (
            <motion.div
              key={shotsTaken}
              initial={{ x: 0, opacity: 0 }}
              animate={{ x: zoneOffset[lastResult.keeperZone], opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.35 }}
              className="absolute top-8 left-1/2 -translate-x-1/2 w-10 h-16 bg-tuna-black border-2 border-tuna-gold rounded-md flex items-center justify-center text-lg"
            >
              🧤
            </motion.div>
          )}
        </AnimatePresence>

        {/* Top */}
        <AnimatePresence>
          {ballPos && (
            <motion.div
              key={shotsTaken + "-ball"}
              initial={{ x: 0, y: 180, scale: 1 }}
              animate={{ x: zoneOffset[ballPos], y: 40, scale: 0.6, rotate: 360 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="absolute left-1/2 -translate-x-1/2 w-6 h-6 rounded-full bg-white shadow-lg"
              style={{ backgroundImage: "radial-gradient(circle at 30% 30%, #fff, #ccc)" }}
            />
          )}
        </AnimatePresence>

        {/* Sonuç mesajı */}
        {lastResult && !animating && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`absolute bottom-3 left-1/2 -translate-x-1/2 font-display text-xl ${
              lastResult.scored ? "text-tuna-gold" : "text-red-400"
            }`}
          >
            {lastResult.scored ? "GOOOL! ⚽" : "KURTARDI! 🧤"}
          </motion.div>
        )}
      </div>

      {/* Atış yönü seçimi */}
      {shotsTaken < TOTAL_SHOTS ? (
        <div className="flex justify-center gap-3">
          {ZONES.map((z) => (
            <button
              key={z}
              disabled={animating}
              onClick={() => shoot(z)}
              className="px-6 py-3 rounded-xl border border-tuna-gold/30 text-tuna-gold hover:bg-tuna-gold/10 hover:border-tuna-gold transition-all disabled:opacity-40 disabled:cursor-not-allowed font-medium capitalize"
            >
              {z === "sol" ? "◀ Sol" : z === "sag" ? "Sağ ▶" : "▲ Orta"}
            </button>
          ))}
        </div>
      ) : (
        <p className="text-tuna-mist">Oyun bitti! Sonucun kaydediliyor...</p>
      )}
    </div>
  );
}
