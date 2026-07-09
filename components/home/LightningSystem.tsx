"use client";

import { useEffect, useRef, useState } from "react";
import { Volume2, VolumeX } from "lucide-react";
import { useAtmosphere } from "@/components/layout/AtmosphereProvider";

export type LightningIntensity = "dusuk" | "orta" | "yuksek";

// Yoğunluğa göre ortalama çakma aralığı (saniye) ve tek çakmanın parlaklığı.
const INTENSITY_CONFIG: Record<LightningIntensity, { minGap: number; maxGap: number; peakAlpha: number }> = {
  dusuk: { minGap: 25, maxGap: 55, peakAlpha: 0.5 },
  orta: { minGap: 12, maxGap: 30, peakAlpha: 0.75 },
  yuksek: { minGap: 5, maxGap: 15, peakAlpha: 0.95 },
};

// Gök gürültüsü: alçak frekanslı, filtrelenmiş gürültü patlaması + yavaş sönümlenme.
// Harici ses dosyasına ihtiyaç duymaz (lisans riski yok), Web Audio API ile anlık üretilir.
function playThunder(ctx: AudioContext) {
  const bufferSize = ctx.sampleRate * 1.8;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

  const src = ctx.createBufferSource();
  src.buffer = buffer;

  const lowpass = ctx.createBiquadFilter();
  lowpass.type = "lowpass";
  lowpass.frequency.value = 220;

  const gain = ctx.createGain();
  const now = ctx.currentTime;
  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(0.5, now + 0.05);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 1.7);

  src.connect(lowpass).connect(gain).connect(ctx.destination);
  src.start(now);
  src.stop(now + 1.8);
}

interface LightningSystemProps {
  intensity?: LightningIntensity;
  /** Şimşek çaktığında ekstra flash/aydınlatma katmanına verilecek z-index bağlamı için */
  className?: string;
}

// Modüler şimşek sistemi — yalnızca "firtinali" hava durumu efektinde değil,
// herhangi bir yerde (Hero, başka bir sayfa vb.) bağımsız olarak kullanılabilir.
export function LightningSystem({ intensity = "orta" }: LightningSystemProps) {
  const { weatherMode } = useAtmosphere();
  const [flashAlpha, setFlashAlpha] = useState(0);
  const [soundOn, setSoundOn] = useState(false);
  const ctxRef = useRef<AudioContext | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Flash dizisi içindeki tüm alt-timeout'lar (çift çakma vb.) burada toplanır —
  // cleanup'ta hepsi birden iptal edilir, hiçbiri "unmount sonrası" ateşlenemez.
  const flashTimeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const active = weatherMode === "firtinali";

  useEffect(() => {
    if (!active) {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      flashTimeoutsRef.current.forEach(clearTimeout);
      flashTimeoutsRef.current = [];
      setFlashAlpha(0);
      return;
    }

    // Mobil/coarse-pointer cihazlarda çakma sıklığını otomatik azalt (pil + performans).
    const isMobile = window.matchMedia("(pointer: coarse)").matches || window.innerWidth < 768;
    const base = INTENSITY_CONFIG[intensity];
    const { minGap, maxGap, peakAlpha } = isMobile
      ? { minGap: base.minGap * 1.6, maxGap: base.maxGap * 1.6, peakAlpha: base.peakAlpha }
      : base;

    function strike() {
      const doubleStrike = !isMobile && Math.random() < 0.3; // mobilde çift çakma yok (daha az iş)
      setFlashAlpha(peakAlpha);
      flashTimeoutsRef.current.push(setTimeout(() => setFlashAlpha(0), 90));
      if (doubleStrike) {
        flashTimeoutsRef.current.push(setTimeout(() => setFlashAlpha(peakAlpha * 0.7), 180));
        flashTimeoutsRef.current.push(setTimeout(() => setFlashAlpha(0), 260));
      }

      if (soundOn && ctxRef.current) {
        try { playThunder(ctxRef.current); } catch {}
      }

      const nextGap = minGap + Math.random() * (maxGap - minGap);
      timeoutRef.current = setTimeout(strike, nextGap * 1000);
    }

    const firstDelay = 2 + Math.random() * 5;
    timeoutRef.current = setTimeout(strike, firstDelay * 1000);

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      flashTimeoutsRef.current.forEach(clearTimeout);
      flashTimeoutsRef.current = [];
    };
  }, [active, intensity, soundOn]);

  useEffect(() => {
    if (!soundOn) { ctxRef.current?.close(); ctxRef.current = null; return; }
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioCtx) ctxRef.current = new AudioCtx();
    return () => { ctxRef.current?.close(); ctxRef.current = null; };
  }, [soundOn]);

  if (!active) return null;

  return (
    <>
      {/* Ekran flash'ı — gökyüzünü/hero arka planını kısa süreliğine aydınlatır */}
      <div
        className="pointer-events-none fixed inset-0 z-30 bg-white transition-opacity duration-75"
        style={{ opacity: flashAlpha }}
        aria-hidden="true"
      />
      {/* Şimşek anında arka planı altınımsı aydınlatan ek katman (gökyüzü illüzyonu) */}
      <div
        className="pointer-events-none fixed inset-0 -z-10 transition-opacity duration-100"
        style={{
          opacity: flashAlpha * 0.6,
          background: "radial-gradient(circle at 50% 20%, rgba(255,250,230,0.9) 0%, transparent 60%)",
        }}
        aria-hidden="true"
      />

      <button
        onClick={() => setSoundOn((v) => !v)}
        aria-label={soundOn ? "Gök gürültüsü sesini kapat" : "Gök gürültüsü sesini aç"}
        className="fixed bottom-24 right-5 z-40 glass-panel p-3 text-tuna-gold hover:scale-105 transition-transform"
      >
        {soundOn ? <Volume2 size={18} /> : <VolumeX size={18} />}
      </button>
    </>
  );
}
