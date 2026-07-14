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

type BusyRef = { current: "wolf" | "crowd" | null };

// Uzaktan gelen bozkurt uluması: yavaş bir glide ile yükselip alçalan, lowpass
// filtreli bir osilatör. 5-10 dakikada bir tekrar eder (her seferinde farklı
// perde/süre ile, "aynı kayıt" hissi vermez) — tribün tezahüratıyla çakışmasın
// diye `busyRef` paylaşılan kilidini kontrol eder.
function scheduleWolfHowls(ctx: AudioContext, master: GainNode, timeoutIdRef: { current: ReturnType<typeof setTimeout> | null }, busyRef: BusyRef) {
  function attemptHowl() {
    if (busyRef.current === "crowd") {
      timeoutIdRef.current = setTimeout(attemptHowl, (5 + Math.random() * 10) * 1000);
      return;
    }
    busyRef.current = "wolf";

    const now = ctx.currentTime;
    const duration = 4 + Math.random() * 3; // 4-7sn, her seferinde farklı

    const osc = ctx.createOscillator();
    osc.type = "sawtooth";
    const baseFreq = 260 + Math.random() * 60; // her uluma farklı bir perdeden başlar
    osc.frequency.setValueAtTime(baseFreq * 0.6, now);
    osc.frequency.linearRampToValueAtTime(baseFreq, now + duration * 0.35);
    osc.frequency.linearRampToValueAtTime(baseFreq * 0.5, now + duration);

    const lowpass = ctx.createBiquadFilter();
    lowpass.type = "lowpass";
    lowpass.frequency.value = 750;

    const gain = ctx.createGain();
    const peak = 0.09 + Math.random() * 0.02; // "orta" seviye
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(peak, now + duration * 0.25);
    gain.gain.linearRampToValueAtTime(peak, now + duration * 0.7);
    gain.gain.linearRampToValueAtTime(0, now + duration);

    osc.connect(lowpass).connect(gain).connect(master);
    osc.start(now);
    osc.stop(now + duration + 0.1);

    setTimeout(() => { if (busyRef.current === "wolf") busyRef.current = null; }, duration * 1000);

    const nextDelay = 300 + Math.random() * 300; // 5-10 dakika
    timeoutIdRef.current = setTimeout(attemptHowl, nextDelay * 1000);
  }
  // İlk uluma hemen değil, sayfa açılışından biraz sonra gelsin (daha doğal).
  timeoutIdRef.current = setTimeout(attemptHowl, (6 + Math.random() * 10) * 1000);
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

// Stadyum taraftar atmosferi: filtrelenmiş, ritmik genlik modülasyonlu beyaz
// gürültü — uzaktan gelen bir kalabalık uğultusu hissi verir. Bandpass frekansı
// ve LFO ritmi her ziyarette (AudioContext her mount'ta yeniden kurulduğu için)
// hafifçe rastgele seçilir ki "hep aynı kayıt" hissi vermesin. DÜRÜSTLÜK NOTU:
// Web Audio API ile gerçekten "Tunaspor" kelimesini telaffuz eden bir ses
// üretmek mümkün değil (bu, kayıtlı ses veya text-to-speech gerektirir) —
// burada yalnızca ritmik bir kalabalık hissi var, kelimenin kendisi duyulmaz.
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
  bandpass.frequency.value = 850 + Math.random() * 150;
  bandpass.Q.value = 0.5;

  const lfo = ctx.createOscillator();
  lfo.frequency.value = 0.3 + Math.random() * 0.08; // ~3sn periyot, "Tu-na-spor" kadansına yakın
  const lfoGain = ctx.createGain();
  lfoGain.gain.value = 0.03;

  const gain = ctx.createGain();
  gain.gain.value = 0; // fadeInCrowdBaseline devreye girene kadar sessiz başlar

  lfo.connect(lfoGain).connect(gain.gain);
  src.connect(bandpass).connect(gain);
  lfo.start();
  src.start();

  return {
    gain,
    stop: () => { src.stop(); lfo.stop(); },
  };
}

const CROWD_BASELINE_GAIN = 0.035; // stat ambiyansı — sürekli, düşük seviye

// Gece moduna girildiğinde stat ambiyansı yumuşakça düşük/sürekli seviyesine
// kadar açılır — bu taban asla tamamen susmaz, yalnızca tezahürat anlarında
// (scheduleTribuneSwell) geçici olarak yükselir.
function fadeInCrowdBaseline(ctx: AudioContext, gainParam: AudioParam) {
  const now = ctx.currentTime;
  gainParam.cancelScheduledValues(now);
  gainParam.setValueAtTime(0, now);
  gainParam.linearRampToValueAtTime(CROWD_BASELINE_GAIN, now + 3);
}

// Tunaspor'a özel tribün tezahüratı: taban stat ambiyansının üzerine binen,
// belirli (doğal/rastgele) aralıklarla tekrar eden bir ses yükselişi — "orta
// seviyenin biraz üzerinde" bir tepe seviyeye çıkar, sonra tabana geri iner.
// Her tekrarında tepe seviyesi ve süresi biraz farklıdır (aynı kayıt hissi
// vermesin diye). Kurt ulumasıyla çakışmayı önlemek için `busyRef` kilidini kontrol eder.
function scheduleTribuneSwell(ctx: AudioContext, gainParam: AudioParam, timeoutIdRef: { current: ReturnType<typeof setTimeout> | null }, busyRef: BusyRef) {
  function attemptSwell() {
    if (busyRef.current === "wolf") {
      timeoutIdRef.current = setTimeout(attemptSwell, (5 + Math.random() * 10) * 1000);
      return;
    }
    busyRef.current = "crowd";

    const now = ctx.currentTime;
    const fadeIn = 2;
    const fadeOut = 2.5;
    const totalDuration = 10 + Math.random() * 10; // toplam 10-20sn
    const hold = Math.max(0, totalDuration - fadeIn - fadeOut);
    const peak = 0.085 + Math.random() * 0.03; // "orta seviyenin biraz üzerinde", her seferinde farklı

    gainParam.cancelScheduledValues(now);
    gainParam.setValueAtTime(CROWD_BASELINE_GAIN, now);
    gainParam.linearRampToValueAtTime(peak, now + fadeIn);
    gainParam.setValueAtTime(peak, now + fadeIn + hold);
    gainParam.linearRampToValueAtTime(CROWD_BASELINE_GAIN, now + fadeIn + hold + fadeOut); // tam sessizliğe değil, tabana döner

    setTimeout(() => { if (busyRef.current === "crowd") busyRef.current = null; }, totalDuration * 1000);

    const silenceMinutes = 8 + Math.random() * 12; // 8-20 dakika arası doğal aralık
    timeoutIdRef.current = setTimeout(attemptSwell, (totalDuration + silenceMinutes * 60) * 1000);
  }
  // Taban seviye oturduktan biraz sonra ilk tezahürat gelsin.
  timeoutIdRef.current = setTimeout(attemptSwell, 15_000);
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
      // Sıra: rüzgar (zaten çalıyor) → kurt uluması (5-10 dk'da bir tekrarlar) →
      // stat ambiyansı sürekli düşük seviyede devam eder → üzerine belirli
      // aralıklarla Tunaspor tribün tezahüratı biner. Kurt ulumasıyla tribün
      // tezahürat tepe noktası asla aynı anda çalmasın diye paylaşılan kilit.
      const busyRef: BusyRef = { current: null };

      scheduleWolfHowls(ctx, master, howlTimeoutRef, busyRef);
      stopFns.push(() => { if (howlTimeoutRef.current) clearTimeout(howlTimeoutRef.current); });

      const crowd = createCrowdAmbience(ctx);
      crowd.gain.connect(master);
      fadeInCrowdBaseline(ctx, crowd.gain.gain);
      scheduleTribuneSwell(ctx, crowd.gain.gain, swellTimeoutRef, busyRef);
      stopFns.push(crowd.stop, () => { if (swellTimeoutRef.current) clearTimeout(swellTimeoutRef.current); });
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
