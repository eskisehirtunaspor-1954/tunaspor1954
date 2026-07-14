"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

type Side = "sol" | "sag";
const TOTAL_ROUNDS = 5;
const APPROACH_MS = 1300;

interface RoundResult {
  obstacleSide: Side;
  passed: boolean;
}

// Basitleştirilmiş slalom/dripling: her round'da bir rakip oyuncunun (koni)
// hangi şeritte belirdiği rastgele seçilir, oyuncu KARŞI şeride zamanında
// geçmezse ("dripling") rakibe çarpar. Diğer oyunlarla aynı 5-round /
// onFinish(score) deseni.
export function SlalomDribbleGame({ onFinish }: { onFinish: (score: number) => void }) {
  const [round, setRound] = useState(0);
  const [score, setScore] = useState(0);
  const [obstacleSide, setObstacleSide] = useState<Side | null>(null);
  const [playerSide, setPlayerSide] = useState<Side>("sol");
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<RoundResult | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const doneRef = useRef(false);

  function startRound() {
    setResult(null);
    doneRef.current = false;
    const side: Side = Math.random() < 0.5 ? "sol" : "sag";
    setObstacleSide(side);
    setPlayerSide(side); // oyuncu round başında rakiple aynı şeritte başlar, kaçması gerekir
    setRunning(true);

    timeoutRef.current = setTimeout(() => {
      if (!doneRef.current) finishRound(side, side);
    }, APPROACH_MS);
  }

  function finishRound(obstacle: Side, finalPlayerSide: Side) {
    doneRef.current = true;
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setRunning(false);
    const passed = finalPlayerSide !== obstacle;
    setResult({ obstacleSide: obstacle, passed });
    setScore((prev) => {
      const next = passed ? prev + 1 : prev;
      setRound((prevRound) => {
        const nextRound = prevRound + 1;
        if (nextRound >= TOTAL_ROUNDS) setTimeout(() => onFinish(next), 1200);
        return nextRound;
      });
      return next;
    });
  }

  function dodge(side: Side) {
    if (!running || !obstacleSide || doneRef.current) return;
    setPlayerSide(side);
    finishRound(obstacleSide, side);
  }

  useEffect(() => () => { if (timeoutRef.current) clearTimeout(timeoutRef.current); }, []);

  return (
    <div className="text-center">
      <div className="flex items-center justify-center gap-6 mb-4 text-sm">
        <span className="text-tuna-mist">Round: {round}/{TOTAL_ROUNDS}</span>
        <span className="text-tuna-gold font-display text-lg">Geçiş: {score}</span>
      </div>

      <div className="relative mx-auto mb-6 w-full max-w-md h-56 bg-gradient-to-b from-green-800/40 to-green-900/20 rounded-2xl border-2 border-white/20 overflow-hidden">
        <div className="absolute left-1/2 top-0 bottom-0 w-px bg-white/15" />

        <AnimatePresence>
          {obstacleSide && running && (
            <motion.div
              key={round + "-obstacle"}
              initial={{ y: -20 }}
              animate={{ y: 190 }}
              transition={{ duration: APPROACH_MS / 1000, ease: "linear" }}
              className={`absolute w-9 h-9 rounded-full bg-red-500/80 border-2 border-red-300 flex items-center justify-center text-sm ${obstacleSide === "sol" ? "left-[28%]" : "left-[72%]"} -translate-x-1/2`}
            >
              🛡️
            </motion.div>
          )}
        </AnimatePresence>

        <div className={`absolute bottom-4 w-9 h-9 rounded-full bg-tuna-gold flex items-center justify-center text-sm transition-all duration-200 ${playerSide === "sol" ? "left-[28%]" : "left-[72%]"} -translate-x-1/2`}>
          ⚽
        </div>

        {result && (
          <div className={`absolute top-3 left-1/2 -translate-x-1/2 font-display text-lg ${result.passed ? "text-tuna-gold" : "text-red-400"}`}>
            {result.passed ? "GEÇTİN! 🏃" : "ÇARPTI! 💥"}
          </div>
        )}

        {!running && round < TOTAL_ROUNDS && (
          <div className="absolute inset-0 flex items-center justify-center">
            <button onClick={startRound} className="bg-tuna-gold text-tuna-black font-semibold px-5 py-2 rounded-lg">
              {round === 0 ? "Başla" : "Devam"}
            </button>
          </div>
        )}
      </div>

      {round < TOTAL_ROUNDS ? (
        <div className="flex justify-center gap-4">
          <button
            disabled={!running}
            onClick={() => dodge("sol")}
            className="px-8 py-3 rounded-xl border border-tuna-gold/30 text-tuna-gold hover:bg-tuna-gold/10 hover:border-tuna-gold transition-all disabled:opacity-40 disabled:cursor-not-allowed font-medium"
          >
            ◀ Sol Şerit
          </button>
          <button
            disabled={!running}
            onClick={() => dodge("sag")}
            className="px-8 py-3 rounded-xl border border-tuna-gold/30 text-tuna-gold hover:bg-tuna-gold/10 hover:border-tuna-gold transition-all disabled:opacity-40 disabled:cursor-not-allowed font-medium"
          >
            Sağ Şerit ▶
          </button>
        </div>
      ) : (
        <p className="text-tuna-mist">Oyun bitti! Sonucun kaydediliyor...</p>
      )}
    </div>
  );
}
