"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

type Zone = "sol" | "orta" | "sag";
const ZONES: Zone[] = ["sol", "orta", "sag"];
const TOTAL_SHOTS = 5;
const REACTION_MS = 1100;
const ZONE_OFFSET: Record<Zone, number> = { sol: -70, orta: 0, sag: 70 };

interface RoundResult {
  shotZone: Zone;
  saved: boolean;
}

// Rol tersine döner: kullanıcı burada KALECİ. Atıcının hangi köşeye vuracağı
// kısa bir süre için gösterilir, kullanıcı süre dolmadan doğru köşeye
// basmazsa gol yer. Diğer oyunlarla aynı 5-deneme / onFinish(score) deseni.
export function GoalkeeperSaveGame({ onFinish }: { onFinish: (score: number) => void }) {
  const [round, setRound] = useState(0);
  const [score, setScore] = useState(0);
  const [shotZone, setShotZone] = useState<Zone | null>(null);
  const [result, setResult] = useState<RoundResult | null>(null);
  const [waiting, setWaiting] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function startRound() {
    if (round >= TOTAL_SHOTS) return;
    setResult(null);
    setWaiting(true);
    const zone = ZONES[Math.floor(Math.random() * ZONES.length)] ?? "orta";
    setShotZone(zone);

    timeoutRef.current = setTimeout(() => {
      finishRound(zone, false);
    }, REACTION_MS);
  }

  function finishRound(zone: Zone, saved: boolean) {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setWaiting(false);
    setResult({ shotZone: zone, saved });
    setScore((prev) => {
      const next = saved ? prev + 1 : prev;
      setRound((prevRound) => {
        const nextRound = prevRound + 1;
        if (nextRound >= TOTAL_SHOTS) setTimeout(() => onFinish(next), 1400);
        return nextRound;
      });
      return next;
    });
  }

  function handleDive(zone: Zone) {
    if (!waiting || !shotZone) return;
    finishRound(shotZone, zone === shotZone);
  }

  useEffect(() => () => { if (timeoutRef.current) clearTimeout(timeoutRef.current); }, []);

  return (
    <div className="text-center">
      <div className="flex items-center justify-center gap-6 mb-4 text-sm">
        <span className="text-tuna-mist">Şut: {round}/{TOTAL_SHOTS}</span>
        <span className="text-tuna-gold font-display text-lg">Kurtarış: {score}</span>
      </div>

      <div className="relative mx-auto mb-6 w-full max-w-md h-56 bg-gradient-to-b from-green-800/40 to-green-900/20 rounded-2xl border-2 border-white/20 overflow-hidden">
        <div className="absolute top-4 left-1/2 -translate-x-1/2 w-4/5 h-32 border-4 border-white/70 border-b-0 rounded-t-md" />

        <AnimatePresence>
          {shotZone && waiting && (
            <motion.div
              key={round + "-ball"}
              initial={{ x: 0, y: 180, scale: 1 }}
              animate={{ x: ZONE_OFFSET[shotZone], y: 40, scale: 0.6 }}
              transition={{ duration: REACTION_MS / 1000, ease: "easeIn" }}
              className="absolute left-1/2 -translate-x-1/2 w-6 h-6 rounded-full bg-white shadow-lg"
              style={{ backgroundImage: "radial-gradient(circle at 30% 30%, #fff, #ccc)" }}
            />
          )}
        </AnimatePresence>

        {result && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`absolute bottom-3 left-1/2 -translate-x-1/2 font-display text-xl ${result.saved ? "text-tuna-gold" : "text-red-400"}`}
          >
            {result.saved ? "KURTARDIN! 🧤" : "GOL YEDİN! ⚽"}
          </motion.div>
        )}

        {!waiting && !result && round < TOTAL_SHOTS && (
          <div className="absolute inset-0 flex items-center justify-center">
            <button
              onClick={startRound}
              className="bg-tuna-gold text-tuna-black font-semibold px-6 py-2.5 rounded-lg"
            >
              Hazır Ol!
            </button>
          </div>
        )}
      </div>

      {round < TOTAL_SHOTS ? (
        <div className="flex justify-center gap-3">
          {ZONES.map((z) => (
            <button
              key={z}
              disabled={!waiting}
              onClick={() => handleDive(z)}
              className="px-6 py-3 rounded-xl border border-tuna-gold/30 text-tuna-gold hover:bg-tuna-gold/10 hover:border-tuna-gold transition-all disabled:opacity-40 disabled:cursor-not-allowed font-medium"
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
