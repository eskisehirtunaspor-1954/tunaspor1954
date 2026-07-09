"use client";

import { useEffect, useRef, useState } from "react";
import { Volume2, VolumeX } from "lucide-react";
import { useAtmosphere } from "@/components/layout/AtmosphereProvider";

// Mobil / düşük güçlü cihazlarda parçacık sayısını otomatik azaltır (performans).
// Küçük ekran + coarse pointer + düşük çekirdek sayısı birlikte değerlendirilir.
function useParticleBudget() {
  const [budget, setBudget] = useState(1);
  useEffect(() => {
    const isCoarse = window.matchMedia("(pointer: coarse)").matches;
    const isSmall = window.innerWidth < 768;
    const lowCores = (navigator.hardwareConcurrency ?? 8) <= 4;
    if (isSmall && (isCoarse || lowCores)) setBudget(0.3);
    else if (isCoarse || isSmall) setBudget(0.5);
    else setBudget(1);
  }, []);
  return budget;
}

// Web Audio API ile gerçek zamanlı, lisanssız yağmur sesi sentezler (filtrelenmiş beyaz gürültü).
// Harici bir ses dosyasına ihtiyaç duymaz, telif riski taşımaz.
function useSynthRainSound(enabled: boolean) {
  const ctxRef = useRef<AudioContext | null>(null);
  const nodesRef = useRef<{ src?: AudioBufferSourceNode; gain?: GainNode } >({});

  useEffect(() => {
    if (!enabled) {
      nodesRef.current.src?.stop();
      nodesRef.current = {};
      return;
    }
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    ctxRef.current = ctx;

    const bufferSize = 2 * ctx.sampleRate;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

    const src = ctx.createBufferSource();
    src.buffer = buffer;
    src.loop = true;

    const bandpass = ctx.createBiquadFilter();
    bandpass.type = "bandpass";
    bandpass.frequency.value = 3200;
    bandpass.Q.value = 0.6;

    const gain = ctx.createGain();
    gain.gain.value = 0.05;

    src.connect(bandpass).connect(gain).connect(ctx.destination);
    src.start();
    nodesRef.current = { src, gain };

    return () => {
      src.stop();
      ctx.close();
    };
  }, [enabled]);
}

export function WeatherEffects() {
  const { weatherMode } = useAtmosphere();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const budget = useParticleBudget();
  const [soundOn, setSoundOn] = useState(false);
  useSynthRainSound(soundOn && weatherMode === "yagmurlu");

  useEffect(() => { if (weatherMode !== "yagmurlu") setSoundOn(false); }, [weatherMode]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    // Bu üç mod dışında canvas'ta hiçbir şey çizilmiyor — FPS'yi boşuna
    // düşürmemek için animasyon döngüsünü hiç başlatmıyoruz.
    const needsCanvas = weatherMode === "yagmurlu" || weatherMode === "karli" || weatherMode === "firtinali";
    if (!needsCanvas) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      return;
    }

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reducedMotion) return;

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    function resize() {
      width = canvas!.width = window.innerWidth;
      height = canvas!.height = window.innerHeight;
    }
    window.addEventListener("resize", resize);

    const rainCount = Math.round(160 * budget);
    const snowCount = Math.round(90 * budget);

    // Rüzgar: sabit değil, saniyeler içinde yavaşça dalgalanan bir yön/şiddet.
    // Bu, damlaların "gerçek rüzgarda" hissi vermesini sağlıyor — hepsi aynı
    // açıyla değil, ortak bir rüzgar etrafında hafif bireysel sapmayla düşüyor.
    let windPhase = Math.random() * Math.PI * 2;
    const windBaseDirection = Math.random() < 0.5 ? -1 : 1; // sağdan mı soldan mı esiyor

    const rainDrops = Array.from({ length: rainCount }, () => ({
      x: Math.random() * width, y: Math.random() * height,
      len: 14 + Math.random() * 20, speed: 7 + Math.random() * 9,
      windJitter: 0.6 + Math.random() * 0.8,
    }));
    const snowFlakes = Array.from({ length: snowCount }, () => ({
      x: Math.random() * width, y: Math.random() * height,
      r: 1.5 + Math.random() * 2.5, speed: 0.6 + Math.random() * 1.2,
      drift: Math.random() * 1 - 0.5,
    }));

    let frame: number;

    function draw() {
      ctx!.clearRect(0, 0, width, height);

      // Rüzgar şiddeti -2.5..2.5 arasında yavaşça salınır (gerçekçi, kesintisiz his)
      windPhase += 0.004;
      const wind = windBaseDirection * (1.2 + Math.sin(windPhase) * 1.3);

      if (weatherMode === "yagmurlu" || weatherMode === "firtinali") {
        const isStorm = weatherMode === "firtinali";
        ctx!.strokeStyle = isStorm ? "rgba(180,200,255,0.3)" : "rgba(180,200,255,0.35)";
        ctx!.lineWidth = 1;
        const speedMultiplier = isStorm ? 1.3 : 1;
        for (const d of rainDrops) {
          const tilt = wind * d.windJitter;
          ctx!.beginPath();
          ctx!.moveTo(d.x, d.y);
          ctx!.lineTo(d.x + tilt * 0.4, d.y + d.len);
          ctx!.stroke();
          d.y += d.speed * speedMultiplier;
          d.x += tilt * 0.15;
          if (d.y > height) { d.y = -d.len; d.x = Math.random() * width; }
          if (d.x < -20) d.x = width + 20;
          if (d.x > width + 20) d.x = -20;
        }
        // Islak zemin yansıması — alt kısımda hafif parlak şerit
        const groundGrad = ctx!.createLinearGradient(0, height - 60, 0, height);
        groundGrad.addColorStop(0, "rgba(255,215,0,0)");
        groundGrad.addColorStop(1, "rgba(180,200,255,0.06)");
        ctx!.fillStyle = groundGrad;
        ctx!.fillRect(0, height - 60, width, 60);
        // Not: şimşek çakması artık ayrı ve modüler <LightningSystem /> bileşeninde yönetiliyor.
      }

      if (weatherMode === "karli") {
        ctx!.fillStyle = "rgba(255,255,255,0.85)";
        for (const f of snowFlakes) {
          ctx!.beginPath();
          ctx!.arc(f.x, f.y, f.r, 0, Math.PI * 2);
          ctx!.fill();
          f.y += f.speed;
          f.x += f.drift + wind * 0.1;
          if (f.y > height) { f.y = -5; f.x = Math.random() * width; }
          if (f.x < -10) f.x = width + 10;
          if (f.x > width + 10) f.x = -10;
        }
      }

      frame = requestAnimationFrame(draw);
    }
    draw();

    return () => { cancelAnimationFrame(frame); window.removeEventListener("resize", resize); };
  }, [weatherMode, budget]);

  return (
    <>
      <canvas ref={canvasRef} className="pointer-events-none fixed inset-0 z-10" aria-hidden="true" />

      {/* Açık/Güneşli: çok hafif, tek bir bulut hareketi (spesifikasyondaki "hafif bulut hareketi") */}
      {weatherMode === "acik" && (
        <div className="pointer-events-none fixed inset-0 z-10 overflow-hidden">
          <div className="absolute top-[10%] w-1/4 h-14 bg-white/[0.08] rounded-full blur-2xl animate-cloudDrift" style={{ animationDuration: "100s" }} />
        </div>
      )}

      {/* Parçalı Bulutlu: hafif, seyrek, aydınlık bulutlar — doğal ve yumuşak */}
      {weatherMode === "parcali_bulutlu" && (
        <div className="pointer-events-none fixed inset-0 z-10 overflow-hidden">
          <div className="absolute top-[8%] w-1/3 h-24 bg-white/15 rounded-full blur-2xl animate-cloudDrift" style={{ animationDuration: "70s" }} />
          <div className="absolute top-[18%] w-1/4 h-16 bg-white/10 rounded-full blur-2xl animate-cloudDrift" style={{ animationDuration: "90s", animationDelay: "-30s" }} />
        </div>
      )}

      {/* Bulutlu: koyu, daha yoğun bulutlar + dramatik hafif gölgeleme */}
      {weatherMode === "bulutlu" && (
        <div className="pointer-events-none fixed inset-0 z-10 overflow-hidden">
          <div className="absolute inset-0 bg-black/15" />
          <div className="absolute top-[5%] w-2/5 h-32 bg-gray-400/20 rounded-full blur-3xl animate-cloudDrift" style={{ animationDuration: "55s" }} />
          <div className="absolute top-[22%] w-1/3 h-24 bg-gray-500/15 rounded-full blur-3xl animate-cloudDrift" style={{ animationDuration: "75s", animationDelay: "-20s" }} />
          <div className="absolute top-[12%] w-1/4 h-20 bg-gray-400/15 rounded-full blur-2xl animate-cloudDrift" style={{ animationDuration: "65s", animationDelay: "-45s" }} />
        </div>
      )}

      {/* Sisli mod: katmanlı, blur'lu sis (canvas'a gerek yok, CSS animasyonu yeterli ve daha performanslı) */}
      {weatherMode === "sisli" && (
        <div className="pointer-events-none fixed inset-0 z-10 overflow-hidden">
          <div className="absolute -inset-x-1/4 bottom-0 h-2/3 bg-white/10 blur-3xl animate-[shimmer_18s_linear_infinite]" />
          <div className="absolute -inset-x-1/4 bottom-0 h-1/2 bg-white/[0.08] blur-2xl animate-[shimmer_26s_linear_infinite_reverse]" />
        </div>
      )}

      {/* Fırtınalı mod: koyu bulut örtüsü */}
      {weatherMode === "firtinali" && (
        <div className="pointer-events-none fixed inset-0 z-10 bg-black/25" />
      )}

      {/* Yağmur sesi aç/kapa — yalnızca yağmurlu modda görünür */}
      {weatherMode === "yagmurlu" && (
        <button
          onClick={() => setSoundOn((v) => !v)}
          aria-label={soundOn ? "Yağmur sesini kapat" : "Yağmur sesini aç"}
          className="fixed bottom-24 right-5 z-40 glass-panel p-3 text-tuna-gold hover:scale-105 transition-transform"
        >
          {soundOn ? <Volume2 size={18} /> : <VolumeX size={18} />}
        </button>
      )}
    </>
  );
}
