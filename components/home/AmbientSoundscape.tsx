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

// Uzaktan gelen bozkurt uluması: yavaş bir glide ile yükselip alçalan, lowpass
// filtreli bir osilatör. Spesifikasyon gereği gece atmosferi başına YALNIZCA
// BİR KEZ çalar (sürekli tekrar etmez) — bittiğinde `onComplete` çağrılır ki
// ardından taraftar atmosferi devreye girebilsin.
function playWolfHowlOnce(ctx: AudioContext, master: GainNode, timeoutIdRef: { current: ReturnType<typeof setTimeout> | null }, onComplete: () => void) {
  function howlOnce() {
    const now = ctx.currentTime;
    const duration = 4 + Math.random() * 3; // 4-7sn — kısa ama belirgin, gerçekçi bir tek uluma

    const osc = ctx.createOscillator();
    osc.type = "sawtooth";
    const baseFreq = 260 + Math.random() * 60;
    osc.frequency.setValueAtTime(baseFreq * 0.6, now);
    osc.frequency.linearRampToValueAtTime(baseFreq, now + duration * 0.35);
    osc.frequency.linearRampToValueAtTime(baseFreq * 0.5, now + duration);

    const lowpass = ctx.createBiquadFilter();
    lowpass.type = "lowpass";
    lowpass.frequency.value = 750;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.11, now + duration * 0.25);
    gain.gain.linearRampToValueAtTime(0.11, now + duration * 0.7);
    gain.gain.linearRampToValueAtTime(0, now + duration);

    osc.connect(lowpass).connect(gain).connect(master);
    osc.start(now);
    osc.stop(now + duration + 0.1);

    timeoutIdRef.current = setTimeout(onComplete, duration * 1000);
  }
  // İlk (ve tek) uluma hemen değil, sayfa açılışından biraz sonra gelsin (daha doğal).
  timeoutIdRef.current = setTimeout(howlOnce, (3 + Math.random() * 5) * 1000);
}

// Hafif rüzgar: düşük geçiren filtreli beyaz gürültü + çok yavaş bir LFO ile
// esinti şiddetinin dalgalanması. Gündüz ve gece atmosferinde sabit, çok kısık
// bir katman olarak diğer seslerin (kuş/kalabalık) altına karışır. Sert bir
// "aç/kapa" hissi vermemesi için 2.5sn'de yumuşakça içeri süzülür (fade in).
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
  const now = ctx.currentTime;
  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(0.025, now + 2.5);

  lfo.connect(lfoGain).connect(gain.gain);
  src.connect(lowpass).connect(gain);
  lfo.start();
  src.start();

  return {
    gain,
    stop: () => { src.stop(); lfo.stop(); },
  };
}

// Stadyum taraftar tezahüratı: filtrelenmiş, ritmik genlik modülasyonlu beyaz
// gürültü — uzaktan gelen bir kalabalık uğultusu hissi verir. LFO periyodu
// (~3sn) "Tu-na-spor" gibi 3 heceli bir tezahürat kadansını çağrıştıracak
// şekilde ayarlandı. DÜRÜSTLÜK NOTU: Web Audio API ile gerçekten "Tunaspor"
// kelimesini telaffuz eden bir ses üretmek mümkün değil (bu, kayıtlı ses veya
// text-to-speech gerektirir) — burada yalnızca ritmik bir kalabalık hissi var,
// kelimenin kendisi duyulmaz.
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
  lfo.frequency.value = 0.33; // ~3sn periyot — "Tu-na-spor" kadansına yakın ritim
  const lfoGain = ctx.createGain();
  lfoGain.gain.value = 0.03;

  const gain = ctx.createGain();
  gain.gain.value = 0; // fadeInCrowdOnce devreye girene kadar sessiz başlar

  lfo.connect(lfoGain).connect(gain.gain);
  src.connect(bandpass).connect(gain);
  lfo.start();
  src.start();

  return {
    gain,
    stop: () => { src.stop(); lfo.stop(); },
  };
}

function isPastCrowdGate(): boolean {
  const now = new Date();
  return now.getHours() > 20 || (now.getHours() === 20 && now.getMinutes() >= 30);
}

// Taraftar atmosferi yalnızca saat 20:30'dan SONRA devreye girer (gece modu
// kendisi 20:00'da başlasa da) ve tek kez, yumuşakça düşük bir seviyeye kadar
// açılıp öylece sürekli çalar — spesifikasyon gereği artık aralıklı
// "tezahürat patlamaları" değil, kısık sesli, sürekli bir stat atmosferi.
function fadeInCrowdOnce(ctx: AudioContext, gainParam: AudioParam, timeoutIdRef: { current: ReturnType<typeof setTimeout> | null }) {
  const TARGET_GAIN = 0.045; // düşük ses seviyesi — arka planda hissedilir ama baskın olmaz

  function attemptFadeIn() {
    if (!isPastCrowdGate()) {
      timeoutIdRef.current = setTimeout(attemptFadeIn, 60_000); // saat 20:30'u her dakika kontrol et
      return;
    }
    const now = ctx.currentTime;
    gainParam.cancelScheduledValues(now);
    gainParam.setValueAtTime(0, now);
    gainParam.linearRampToValueAtTime(TARGET_GAIN, now + 3);
  }
  timeoutIdRef.current = setTimeout(attemptFadeIn, 1000);
}

export function AmbientSoundscape() {
  const { atmosphere, soundEnabled, volume } = useAtmosphere();
  const [isClearWeather, setIsClearWeather] = useState(false);
  const ctxRef = useRef<AudioContext | null>(null);
  const cleanupRef = useRef<(() => void) | null>(null);
  const chirpTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const howlTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const swellTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const masterRef = useRef<GainNode | null>(null);

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
    master.gain.value = volume;
    masterRef.current = master;
    master.connect(ctx.destination);

    // Rüzgar her zaman (gündüz + gece) çok kısık bir taban katman olarak çalar.
    const wind = createWindLayer(ctx);
    wind.gain.connect(master);
    const stopFns: Array<() => void> = [wind.stop];

    if (birdsShouldChirp) {
      scheduleBirdChirps(ctx, master, chirpTimeoutRef);
      stopFns.push(() => { if (chirpTimeoutRef.current) clearTimeout(chirpTimeoutRef.current); });
    } else if (atmosphere === "gece") {
      // Sıra: rüzgar (zaten çalıyor) → tek seferlik kurt uluması → uluma
      // bitince taraftar atmosferi düşük seviyede içeri süzülüp sürekli çalar.
      const crowd = createCrowdAmbience(ctx);
      crowd.gain.connect(master);
      stopFns.push(crowd.stop);

      playWolfHowlOnce(ctx, master, howlTimeoutRef, () => {
        fadeInCrowdOnce(ctx, crowd.gain.gain, swellTimeoutRef);
      });
      stopFns.push(
        () => { if (howlTimeoutRef.current) clearTimeout(howlTimeoutRef.current); },
        () => { if (swellTimeoutRef.current) clearTimeout(swellTimeoutRef.current); }
      );
    }

    cleanupRef.current = () => { stopFns.forEach((fn) => fn()); ctx.close(); };
    return () => { cleanupRef.current?.(); cleanupRef.current = null; };
  }, [soundEnabled, atmosphere, birdsShouldChirp]);

  // Ses seviyesi kaydırıcısı anlık olarak (yeniden bağlanmadan) uygulanır.
  useEffect(() => {
    if (masterRef.current && ctxRef.current) {
      masterRef.current.gain.setTargetAtTime(volume, ctxRef.current.currentTime, 0.05);
    }
  }, [volume]);

  return null;
}
