"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

type Corner = "ust_sol" | "ust_sag" | "alt_sol" | "alt_sag" | "orta";
const CORNERS: Corner[] = ["ust_sol", "ust_sag", "alt_sol", "alt_sag", "orta"];
const TOTAL_SHOTS = 5;
const CORNER_POS: Record<Corner, { x: number; y: number }> = {
  ust_sol: { x: -70, y: 10 },
  ust_sag: { x: 70, y: 10 },
  alt_sol: { x: -60, y: 70 },
  alt_sag: { x: 60, y: 70 },
  orta: { x: 0, y: 20 },
};
const CORNER_LABEL: Record<Corner, string> = {
  ust_sol: "↖ Üst Sol",
  ust_sag: "↗ Üst Sağ",
  alt_sol: "↙ Alt Sol",
  alt_sag: "↘ Alt Sağ",
  orta: "⬆ Orta (duvar riski)",
};

interface ShotResult {
  corner: Corner;
  keeperCorner: Corner;
  blockedByWall: boolean;
  scored: boolean;
}

// Penaltı oyunuyla aynı desen (onFinish callback, framer-motion animasyon) ama
// 5 köşe seçeneği + "orta" seçilirse duvara çarpma riski ile farklılaşan
// serbest vuruş varyantı.
export function FreeKickGame({ onFinish }: { onFinish: (score: number) => void }) {
  const [shotsTaken, setShotsTaken] = useState(0);
  const [score, setScore] = useState(0);
  const [lastResult, setLastResult] = useState<ShotResult | null>(null);
  const [animating, setAnimating] = useState(false);
  const [ballCorner, setBallCorner] = useState<Corner | null>(null);

  function shoot(corner: Corner) {
    if (animating || shotsTaken >= TOTAL_SHOTS) return;
    setAnimating(true);
    setBallCorner(corner);

    const blockedByWall = corner === "orta" && Math.random() < 0.5;
    const keeperCorner = CORNERS[Math.floor(Math.random() * CORNERS.length)] ?? "orta";
    const scored = !blockedByWall && corner !== keeperCorner;

    setTimeout(() => {
      setLastResult({ corner, keeperCorner, blockedByWall, scored });
      setScore((prev) => {
        const next = scored ? prev + 1 : prev;
        setShotsTaken((prevShots) => {
          const nextShots = prevShots + 1;
          if (nextShots >= TOTAL_SHOTS) setTimeout(() => onFinish(next), 1400);
          return nextShots;
        });
        return next;
      });
      setTimeout(() => { setAnimating(false); setBallCorner(null); }, 900);
    }, 500);
  }

  return (
    <div className="text-center">
      <div className="flex items-center justify-center gap-6 mb-4 text-sm">
        <span className="text-tuna-mist">Vuruş: {Math.min(shotsTaken + (animating ? 1 : 0), TOTAL_SHOTS)}/{TOTAL_SHOTS}</span>
        <span className="text-tuna-gold font-display text-lg">Gol: {score}</span>
      </div>

      <div className="relative mx-auto mb-6 w-full max-w-md h-56 bg-gradient-to-b from-green-800/40 to-green-900/20 rounded-2xl border-2 border-white/20 overflow-hidden">
        <div className="absolute top-4 left-1/2 -translate-x-1/2 w-4/5 h-32 border-4 border-white/70 border-b-0 rounded-t-md" />
        {/* Duvar */}
        <div className="absolute bottom-14 left-1/2 -translate-x-1/2 flex gap-1">
          {[0, 1, 2].map((i) => <div key={i} className="w-6 h-10 rounded bg-tuna-mist/40" />)}
        </div>

        <AnimatePresence>
          {lastResult && (
            <motion.div
              key={shotsTaken}
              initial={{ x: 0, opacity: 0 }}
              animate={{ x: CORNER_POS[lastResult.keeperCorner].x, opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.35 }}
              className="absolute top-8 left-1/2 -translate-x-1/2 w-10 h-16 bg-tuna-black border-2 border-tuna-gold rounded-md flex items-center justify-center text-lg"
            >
              🧤
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {ballCorner && (
            <motion.div
              key={shotsTaken + "-ball"}
              initial={{ x: 0, y: 180, scale: 1 }}
              animate={{ x: CORNER_POS[ballCorner].x, y: CORNER_POS[ballCorner].y, scale: 0.6, rotate: 360 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="absolute left-1/2 -translate-x-1/2 w-6 h-6 rounded-full bg-white shadow-lg"
              style={{ backgroundImage: "radial-gradient(circle at 30% 30%, #fff, #ccc)" }}
            />
          )}
        </AnimatePresence>

        {lastResult && !animating && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`absolute bottom-3 left-1/2 -translate-x-1/2 font-display text-xl ${lastResult.scored ? "text-tuna-gold" : "text-red-400"}`}
          >
            {lastResult.blockedByWall ? "DUVARA ÇARPTI! 🧱" : lastResult.scored ? "GOOOL! ⚽" : "KURTARDI! 🧤"}
          </motion.div>
        )}
      </div>

      {shotsTaken < TOTAL_SHOTS ? (
        <div className="flex flex-wrap justify-center gap-2">
          {CORNERS.map((c) => (
            <button
              key={c}
              disabled={animating}
              onClick={() => shoot(c)}
              className="px-4 py-2.5 rounded-xl border border-tuna-gold/30 text-tuna-gold hover:bg-tuna-gold/10 hover:border-tuna-gold transition-all disabled:opacity-40 disabled:cursor-not-allowed font-medium text-sm"
            >
              {CORNER_LABEL[c]}
            </button>
          ))}
        </div>
      ) : (
        <p className="text-tuna-mist">Oyun bitti! Sonucun kaydediliyor...</p>
      )}
    </div>
  );
}
