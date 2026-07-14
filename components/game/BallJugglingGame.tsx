"use client";

import { useEffect, useRef, useState } from "react";

const TOTAL_ROUNDS = 5;
const ROUND_MS = 1400; // top bir aşağı-yukarı döngüsünü bu sürede tamamlar
const TARGET_MIN = 0.78; // topun bu yükseklik aralığındayken tıklamak "başarılı" sayılır
const TARGET_MAX = 1.0;

// Ritim/zamanlama tabanlı top sektirme oyunu: top yukarı-aşağı sallanır, oyuncu
// tam tepe noktasındayken (sarı hedef bandı) tıklamalı. Diğer oyunlarla aynı
// 5-round / onFinish(score) deseni.
export function BallJugglingGame({ onFinish }: { onFinish: (score: number) => void }) {
  const [round, setRound] = useState(0);
  const [score, setScore] = useState(0);
  const [height, setHeight] = useState(0); // 0-1
  const [feedback, setFeedback] = useState<"basarili" | "kacti" | null>(null);
  const [running, setRunning] = useState(false);
  const startRef = useRef<number>(0);
  const rafRef = useRef<number>(0);
  const roundDoneRef = useRef(false);

  function startRound() {
    setFeedback(null);
    roundDoneRef.current = false;
    startRef.current = performance.now();
    setRunning(true);

    function tick(now: number) {
      const elapsed = (now - startRef.current) % ROUND_MS;
      const t = elapsed / ROUND_MS; // 0-1
      const h = Math.sin(t * Math.PI); // 0 -> 1 -> 0
      setHeight(h);

      if (now - startRef.current >= ROUND_MS && !roundDoneRef.current) {
        roundDoneRef.current = true;
        finishRound(false);
        return;
      }
      rafRef.current = requestAnimationFrame(tick);
    }
    rafRef.current = requestAnimationFrame(tick);
  }

  function finishRound(success: boolean) {
    if (roundDoneRef.current && !success) {
      // otomatik zaman aşımı zaten işlendi
    }
    roundDoneRef.current = true;
    cancelAnimationFrame(rafRef.current);
    setRunning(false);
    setFeedback(success ? "basarili" : "kacti");
    setScore((prev) => {
      const next = success ? prev + 1 : prev;
      setRound((prevRound) => {
        const nextRound = prevRound + 1;
        if (nextRound >= TOTAL_ROUNDS) setTimeout(() => onFinish(next), 1200);
        return nextRound;
      });
      return next;
    });
  }

  function handleTap() {
    if (!running || roundDoneRef.current) return;
    const success = height >= TARGET_MIN && height <= TARGET_MAX;
    finishRound(success);
  }

  useEffect(() => () => cancelAnimationFrame(rafRef.current), []);

  return (
    <div className="text-center">
      <div className="flex items-center justify-center gap-6 mb-4 text-sm">
        <span className="text-tuna-mist">Round: {round}/{TOTAL_ROUNDS}</span>
        <span className="text-tuna-gold font-display text-lg">Başarı: {score}</span>
      </div>

      <div className="relative mx-auto mb-6 w-40 max-w-full h-56 bg-gradient-to-b from-green-800/40 to-green-900/20 rounded-2xl border-2 border-white/20 overflow-hidden">
        {/* Hedef bandı */}
        <div
          className="absolute left-0 right-0 bg-tuna-gold/15 border-y border-tuna-gold/40"
          style={{ bottom: `${TARGET_MIN * 85}%`, height: `${(TARGET_MAX - TARGET_MIN) * 85}%` }}
        />
        {/* Top */}
        <div
          className="absolute left-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-white shadow-lg transition-none"
          style={{ bottom: `${height * 85 + 5}%`, backgroundImage: "radial-gradient(circle at 30% 30%, #fff, #ccc)" }}
        />

        {feedback && (
          <div className={`absolute top-3 left-1/2 -translate-x-1/2 font-display text-lg ${feedback === "basarili" ? "text-tuna-gold" : "text-red-400"}`}>
            {feedback === "basarili" ? "SÜPER! 🤾" : "KAÇTI! 😅"}
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
        <button
          onClick={handleTap}
          disabled={!running}
          className="px-8 py-3 rounded-xl border border-tuna-gold/30 text-tuna-gold hover:bg-tuna-gold/10 hover:border-tuna-gold transition-all disabled:opacity-40 disabled:cursor-not-allowed font-medium"
        >
          ⚽ Sektir!
        </button>
      ) : (
        <p className="text-tuna-mist">Oyun bitti! Sonucun kaydediliyor...</p>
      )}
    </div>
  );
}
