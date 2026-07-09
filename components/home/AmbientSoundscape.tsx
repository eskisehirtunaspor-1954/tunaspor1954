"use client";

import { useEffect, useRef, useState } from "react";
import { Volume2, VolumeX } from "lucide-react";
import { useAtmosphere } from "@/components/layout/AtmosphereProvider";

// Kuş cıvıltısı: kısa, rastgele aralıklarla tekrar eden yüksek frekanslı "cıvıltı" sesleri.
// Zamanlayıcı ID'si dışarıya (ref üzerinden) verilir ki cleanup anında iptal edilebilsin —
// önceki sürümde yalnızca bir "durdu" bayrağı kontrol ediliyordu, bu da temizliği
// bir sonraki döngüye kadar geciktiriyordu.
function scheduleBirdChirps(ctx: AudioContext, master: GainNode, timeoutIdRef: { current: ReturnType<typeof setTimeout> | null }) {
  function chirpOnce() {
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    const baseFreq = 2200 + Math.random() * 1400;
    osc.frequency.setValueAtTime(baseFreq, now);
    osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.4, now + 0.08);
    osc.frequency.exponentialRampToValueAtTime(baseFreq * 0.8, now + 0.16);
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.06, now + 0.02);
    gain.gain.linearRampToValueAtTime(0, now + 0.2);
    osc.connect(gain).connect(master);
    osc.start(now);
    osc.stop(now + 0.22);

    const nextDelay = 1.2 + Math.random() * 3.5;
    timeoutIdRef.current = setTimeout(chirpOnce, nextDelay * 1000);
  }
  chirpOnce();
}

// Taraftar tezahüratı: filtrelenmiş, ritmik genlik modülasyonlu beyaz gürültü —
// uzaktan gelen bir kalabalık uğultusu hissi verir.
function createCrowdAmbience(ctx: AudioContext): { gain: GainNode; stop: () => void } {
  const bufferSize = 4 * ctx.sampleRate;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

  const src = ctx.createBufferSource();
  src.buffer = buffer;
  src.loop = true;

  const bandpass = ctx.createBiquadFilter();
  bandpass.type = "bandpass";
  bandpass.frequency.value = 900;
  bandpass.Q.value = 0.5;

  const lfo = ctx.createOscillator();
  lfo.frequency.value = 0.3; // yavaş "dalga dalga" tezahürat hissi
  const lfoGain = ctx.createGain();
  lfoGain.gain.value = 0.03;

  const gain = ctx.createGain();
  gain.gain.value = 0.04;

  lfo.connect(lfoGain).connect(gain.gain);
  src.connect(bandpass).connect(gain);
  lfo.start();
  src.start();

  return {
    gain,
    stop: () => { src.stop(); lfo.stop(); },
  };
}

export function AmbientSoundscape() {
  const { atmosphere } = useAtmosphere();
  const [enabled, setEnabled] = useState(false);
  const [isClearWeather, setIsClearWeather] = useState(false);
  const ctxRef = useRef<AudioContext | null>(null);
  const cleanupRef = useRef<(() => void) | null>(null);
  const chirpTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Hava açık/güneşliyken (gündüz saatlerinde) de kuş cıvıltısı duyulsun istendi —
  // sadece "sabah" atmosferiyle sınırlı kalmasın.
  useEffect(() => {
    fetch("/api/weather")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => setIsClearWeather(data?.conditionCode === "Clear"))
      .catch(() => setIsClearWeather(false));
  }, []);

  const birdsShouldChirp = atmosphere === "sabah" || (isClearWeather && atmosphere !== "gece");

  useEffect(() => {
    if (!enabled) {
      cleanupRef.current?.();
      cleanupRef.current = null;
      return;
    }

    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    ctxRef.current = ctx;
    const master = ctx.createGain();
    master.gain.value = 1;
    master.connect(ctx.destination);

    if (birdsShouldChirp) {
      scheduleBirdChirps(ctx, master, chirpTimeoutRef);
      cleanupRef.current = () => {
        if (chirpTimeoutRef.current) clearTimeout(chirpTimeoutRef.current);
        ctx.close();
      };
    } else if (atmosphere === "gece") {
      const crowd = createCrowdAmbience(ctx);
      crowd.gain.connect(master);
      cleanupRef.current = () => { crowd.stop(); ctx.close(); };
    } else {
      // Öğle/akşam (kapalı hava) için şimdilik sessiz — ileride stadyum anonsu/rüzgar eklenebilir
      cleanupRef.current = () => ctx.close();
    }

    return () => { cleanupRef.current?.(); cleanupRef.current = null; };
  }, [enabled, atmosphere, birdsShouldChirp]);

  const hasAmbience = birdsShouldChirp || atmosphere === "gece";
  if (!hasAmbience) return null;

  return (
    <button
      onClick={() => setEnabled((v) => !v)}
      aria-label={enabled ? "Ortam sesini kapat" : "Ortam sesini aç"}
      title={birdsShouldChirp ? "Kuş cıvıltısı" : "Gece ortam sesi (taraftar uğultusu)"}
      className="fixed bottom-24 left-5 z-40 glass-panel p-3 text-tuna-gold hover:scale-105 transition-transform"
    >
      {enabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
    </button>
  );
}
