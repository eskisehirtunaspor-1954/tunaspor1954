"use client";

import { useEffect, useRef } from "react";
import { useAtmosphere } from "@/components/layout/AtmosphereProvider";

// Sinematik atmosfer sistemi — sentetik (Web Audio osilatör) seslerin yerini
// gerçek ses dosyaları aldı. Dosyalar public/audio/ altına kulüp tarafından
// eklenir; kod yalnızca bu yolları referans alır, dosya üretmez.
const SOUND_FILES = {
  birds: "/audio/birds.mp3",
  wind: "/audio/wind.mp3",
  rain: "/audio/rain.mp3",
  thunder: "/audio/thunder.mp3",
  wolf: "/audio/wolf.mp3",
  drums: "/audio/drums.mp3",
  crowd: "/audio/crowd.mp3",
} as const;

type SoundKey = keyof typeof SOUND_FILES;
const ALL_KEYS = Object.keys(SOUND_FILES) as SoundKey[];

// Her katmanın göreli karışım seviyesi (0-1) — kullanıcının tek bir ana ses
// seviyesi kaydırıcısıyla çarpılır. Örn. gök gürültüsü doğası gereği rüzgardan
// daha baskın olmalı; taraftar sesi sürekli çaldığı için düşük tutulur.
const LEVELS: Record<SoundKey, number> = {
  birds: 0.35,
  wind: 0.3,
  rain: 0.45,
  thunder: 0.6,
  wolf: 0.65,
  drums: 0.35,
  crowd: 0.3,
};

const FADE_MS = 4000; // "3-5 saniyelik yumuşak geçiş"

// Tek bir ses dosyasının <audio> elemanını ve yumuşak ses seviyesi geçişini
// (fade in/out) yöneten küçük yardımcı — AudioContext/GainNode grafiği yerine
// doğrudan HTMLAudioElement.volume üzerinde requestAnimationFrame ile
// enterpolasyon yapar; gerçek dosya oynatımı için bu, sentetik sesteki Web
// Audio grafiğinden daha basit ve yeterlidir.
class SoundLayer {
  private audio: HTMLAudioElement | null = null;
  private rafId: number | null = null;
  private lastError = false;

  constructor(private src: string, private loop: boolean) {}

  private ensure(): HTMLAudioElement | null {
    if (typeof window === "undefined") return null;
    if (!this.audio) {
      const audio = new Audio(this.src);
      audio.loop = this.loop;
      audio.volume = 0;
      audio.preload = "auto";
      // Dosya eksik/bozuksa sessizce yut — kulüp henüz public/audio/ dosyalarını
      // eklememiş olabilir, bu durumda atmosfer sistemi çökmemeli.
      audio.addEventListener("error", () => { this.lastError = true; });
      this.audio = audio;
    }
    return this.audio;
  }

  fadeTo(target: number, ms = FADE_MS) {
    const audio = this.ensure();
    if (!audio || this.lastError) return;
    if (this.rafId !== null) cancelAnimationFrame(this.rafId);

    if (target > 0 && audio.paused) {
      audio.play().catch(() => { this.lastError = true; });
    }

    const start = audio.volume;
    const startTime = performance.now();
    const step = (now: number) => {
      const t = ms <= 0 ? 1 : Math.min(1, (now - startTime) / ms);
      audio.volume = Math.max(0, Math.min(1, start + (target - start) * t));
      if (t < 1) {
        this.rafId = requestAnimationFrame(step);
      } else {
        this.rafId = null;
        if (target === 0) audio.pause();
      }
    };
    this.rafId = requestAnimationFrame(step);
  }

  stopImmediately() {
    if (this.rafId !== null) cancelAnimationFrame(this.rafId);
    this.audio?.pause();
  }
}

export function AmbientSoundscape() {
  const { atmosphere, weatherMode, soundEnabled, volume } = useAtmosphere();
  const layersRef = useRef<Partial<Record<SoundKey, SoundLayer>>>({});
  const activeBaseRef = useRef<Record<SoundKey, number>>(
    Object.fromEntries(ALL_KEYS.map((k) => [k, 0])) as Record<SoundKey, number>
  );
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const stormLoopRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function getLayer(key: SoundKey, loop = true): SoundLayer {
    if (!layersRef.current[key]) layersRef.current[key] = new SoundLayer(SOUND_FILES[key], loop);
    return layersRef.current[key]!;
  }

  // Bir katmanı "aktif taban seviyesi" olarak işaretler ve o seviyeye (ana ses
  // seviyesiyle çarpılmış olarak) fade eder — böylece ses seviyesi kaydırıcısı
  // değiştiğinde (ayrı efekt) hangi katmanların yeniden ölçekleneceği bilinir.
  function setLayer(key: SoundKey, baseLevel: number, ms = FADE_MS, loop = true) {
    activeBaseRef.current[key] = baseLevel;
    getLayer(key, loop).fadeTo(baseLevel * volume, ms);
  }

  useEffect(() => {
    if (!soundEnabled) {
      ALL_KEYS.forEach((k) => getLayer(k).fadeTo(0, 1200));
      activeBaseRef.current = Object.fromEntries(ALL_KEYS.map((k) => [k, 0])) as Record<SoundKey, number>;
      return;
    }

    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
    if (stormLoopRef.current) clearTimeout(stormLoopRef.current);

    // --- Günün saatine göre taban atmosfer ---
    if (atmosphere === "sabah" || atmosphere === "ogle") {
      // ☀️ Gündüz: hafif kuş + hafif rüzgar, sürekli düşük seviye loop.
      setLayer("birds", LEVELS.birds * 0.6);
      setLayer("wind", LEVELS.wind * 0.5);
      setLayer("drums", 0);
      setLayer("wolf", 0, 800, false);
      setLayer("crowd", 0);
    } else if (atmosphere === "aksam") {
      // 🌇 Gün batımı: rüzgar biraz artar, çok hafif davul başlar (maç havasına geçiş).
      setLayer("birds", 0);
      setLayer("wind", LEVELS.wind * 0.75);
      setLayer("drums", LEVELS.drums * 0.25);
      setLayer("wolf", 0, 800, false);
      setLayer("crowd", 0);
    } else {
      // 🌙 Gece: rüzgar hemen → 1 kez kurt uluması → +2sn davul → +3sn taraftar sesi.
      setLayer("birds", 0);
      setLayer("wind", LEVELS.wind);
      setLayer("drums", 0);
      setLayer("crowd", 0);
      getLayer("wolf", false).fadeTo(LEVELS.wolf * volume, 1500);
      const t1 = setTimeout(() => setLayer("drums", LEVELS.drums), 2000);
      const t2 = setTimeout(() => setLayer("crowd", LEVELS.crowd * 0.6), 3000);
      timersRef.current.push(t1, t2);
    }

    // --- Hava durumuna göre üst katman (Eskişehir hava durumu API'sinden) ---
    if (weatherMode === "yagmurlu") {
      // 🌧️ Yağmurlu: yağmur + rüzgar
      setLayer("rain", LEVELS.rain);
      setLayer("thunder", 0, 800, false);
    } else if (weatherMode === "firtinali") {
      // ⛈️ Fırtına: yağmur + gök gürültüsü + kuvvetli rüzgar
      setLayer("rain", LEVELS.rain);
      setLayer("wind", (activeBaseRef.current.wind || LEVELS.wind) * 1.4);
      const scheduleThunder = () => {
        stormLoopRef.current = setTimeout(() => {
          getLayer("thunder", false).fadeTo(LEVELS.thunder * volume, 400);
          setTimeout(() => getLayer("thunder", false).fadeTo(0, 1800), 2500);
          scheduleThunder();
        }, (20 + Math.random() * 40) * 1000);
      };
      scheduleThunder();
    } else if (weatherMode === "sisli") {
      // 🌫️ Sis: sessiz ortam + hafif rüzgar (kuş sesi kesilir)
      setLayer("birds", 0);
      setLayer("wind", (activeBaseRef.current.wind || LEVELS.wind) * 0.5);
      setLayer("rain", 0);
      setLayer("thunder", 0, 800, false);
    } else if (weatherMode === "karli") {
      // ❄️ Karlı: hafif rüzgar, sakin atmosfer
      setLayer("wind", (activeBaseRef.current.wind || LEVELS.wind) * 0.55);
      setLayer("rain", 0);
      setLayer("thunder", 0, 800, false);
    } else {
      // ☀️ açık / ☁️ bulutlu / parçalı bulutlu: yağmur-gök gürültüsü kapalı kalır.
      setLayer("rain", 0);
      setLayer("thunder", 0, 800, false);
    }

    return () => {
      timersRef.current.forEach(clearTimeout);
      if (stormLoopRef.current) clearTimeout(stormLoopRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [soundEnabled, atmosphere, weatherMode]);

  // Ana ses seviyesi kaydırıcısı değiştiğinde, sekansı yeniden başlatmadan
  // (kurt ulumasını tekrar tetiklemeden) yalnızca o an aktif katmanları
  // orantılı olarak yeniden ölçekler.
  useEffect(() => {
    if (!soundEnabled) return;
    ALL_KEYS.forEach((key) => {
      const base = activeBaseRef.current[key];
      if (base > 0) getLayer(key).fadeTo(base * volume, 300);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [volume]);

  useEffect(() => {
    return () => {
      Object.values(layersRef.current).forEach((layer) => layer?.stopImmediately());
    };
  }, []);

  return null;
}
