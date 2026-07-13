"use client";

import { useEffect, useRef, useState } from "react";
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

// Hafif rüzgar: düşük geçiren filtreli beyaz gürültü + çok yavaş bir LFO ile
// esinti şiddetinin dalgalanması. Gündüz ve gece atmosferinde sabit, çok kısık
// bir katman olarak diğer seslerin (kuş/kalabalık) altına karışır.
function createWindLayer(ctx: AudioContext): { gain: GainNode; stop: () => void } {
  const bufferSize = 4 * ctx.sampleRate;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

  const src = ctx.createBufferSource();
  src.buffer = buffer;
  src.loop = true;

  const lowpass = ctx.createBiquadFilter();
  lowpass.type = "lowpass";
  lowpass.frequency.value = 500;
  lowpass.Q.value = 0.4;

  const lfo = ctx.createOscillator();
  lfo.frequency.value = 0.08; // çok yavaş "esinti geliyor gidiyor" hissi
  const lfoGain = ctx.createGain();
  lfoGain.gain.value = 0.012;

  const gain = ctx.createGain();
  gain.gain.value = 0.025;

  lfo.connect(lfoGain).connect(gain.gain);
  src.connect(lowpass).connect(gain);
  lfo.start();
  src.start();

  return {
    gain,
    stop: () => { src.stop(); lfo.stop(); },
  };
}

export function AmbientSoundscape() {
  const { atmosphere, soundEnabled } = useAtmosphere();
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
    if (!soundEnabled) {
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

    // Rüzgar her zaman (gündüz + gece) çok kısık bir taban katman olarak çalar.
    const wind = createWindLayer(ctx);
    wind.gain.connect(master);
    const stopFns: Array<() => void> = [wind.stop];

    if (birdsShouldChirp) {
      scheduleBirdChirps(ctx, master, chirpTimeoutRef);
      stopFns.push(() => { if (chirpTimeoutRef.current) clearTimeout(chirpTimeoutRef.current); });
    } else if (atmosphere === "gece") {
      const crowd = createCrowdAmbience(ctx);
      crowd.gain.connect(master);
      stopFns.push(crowd.stop);
    }

    cleanupRef.current = () => { stopFns.forEach((fn) => fn()); ctx.close(); };
    return () => { cleanupRef.current?.(); cleanupRef.current = null; };
  }, [soundEnabled, atmosphere, birdsShouldChirp]);

  return null;
}
