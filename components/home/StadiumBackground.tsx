"use client";

import { useEffect, useRef, useState } from "react";
import { useAtmosphere, Atmosphere } from "@/components/layout/AtmosphereProvider";
import { StarField } from "./StarField";

// Dört atmosfer durumu, üç gerçek fotoğrafı paylaşır: sabah ve öğle aynı gündüz
// fotoğrafını kullanır (ikisi arasında görsel geçişe gerek yok, yalnızca üstteki
// efektler/ses/rozet değişir), akşam gün batımı fotoğrafını, gece de gece fotoğrafını kullanır.
const IMAGE_FOR_ATMOSPHERE: Record<Atmosphere, string> = {
  sabah: "/images/stadium-day.webp",
  ogle: "/images/stadium-day.webp",
  aksam: "/images/stadium-sunset.webp",
  gece: "/images/stadium-night.webp",
};
const UNIQUE_IMAGES = Array.from(new Set(Object.values(IMAGE_FOR_ATMOSPHERE)));

// Performans notu: Three.js yerine bilinçli olarak Canvas 2D + CSS transform/opacity
// tercih edildi. Bu sahne birkaç düz katmandan oluşuyor (WebGL context, mesh, shader
// gerektirmiyor); GPU'da yalnızca compositing (transform/opacity) çalışması, ekstra
// ~600KB'lık bir 3D kütüphanesinden çok daha hafif ve daha az pil/CPU tüketir.
export function StadiumBackground() {
  const { atmosphere } = useAtmosphere();
  const containerRef = useRef<HTMLDivElement>(null);
  const [parallax, setParallax] = useState({ x: 0, y: 0 });
  const [imgError, setImgError] = useState<Record<string, boolean>>({});

  useEffect(() => {
    let raf: number | null = null;
    function handleMouseMove(e: MouseEvent) {
      // rAF ile sınırla — mousemove saniyede yüzlerce kez tetiklenebilir,
      // state güncellemesini bir sonraki frame'e erteleyerek gereksiz render'ı önlüyoruz.
      if (raf) return;
      raf = requestAnimationFrame(() => {
        const { innerWidth, innerHeight } = window;
        const x = (e.clientX / innerWidth - 0.5) * 2;
        const y = (e.clientY / innerHeight - 0.5) * 2;
        setParallax({ x: x * 14, y: y * 10 });
        raf = null;
      });
    }
    if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      window.addEventListener("mousemove", handleMouseMove, { passive: true });
    }
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  const activeImage = IMAGE_FOR_ATMOSPHERE[atmosphere];
  const anyImageMissing = Object.values(imgError).some(Boolean) || Object.keys(imgError).length === 0;
  const isNight = atmosphere === "gece";
  const isEvening = atmosphere === "aksam";
  const floodlightStrength = isNight ? 1 : isEvening ? 0.5 : 0;

  return (
    <div ref={containerRef} className="absolute inset-0 overflow-hidden -z-20 bg-tuna-black">
      {/* KATMAN 1 — Arka plan fotoğrafı: en yavaş parallax (uzak plan hissi) */}
      <div
        className="absolute -inset-[5%] animate-floatSlow motion-reduce:animate-none will-change-transform"
        style={{
          transform: `translate(${parallax.x}px, ${parallax.y}px) scale(1.06)`,
          transition: "transform 0.6s ease-out",
        }}
      >
        {UNIQUE_IMAGES.map((src) => (
          <div
            key={src}
            className="absolute inset-0 bg-cover bg-center transition-opacity duration-[2500ms] ease-in-out"
            style={{ backgroundImage: `url(${src})`, opacity: activeImage === src ? 1 : 0 }}
          >
            <img src={src} alt="" className="hidden" onError={() => setImgError((p) => ({ ...p, [src]: true }))} />
          </div>
        ))}
      </div>

      {/* Görseller henüz yüklenmediyse (fallback): atmosfere göre degrade zemin */}
      {anyImageMissing && (
        <div
          className="absolute inset-0 -z-10 transition-colors duration-[2500ms]"
          style={{
            background:
              atmosphere === "sabah"
                ? "linear-gradient(180deg, #7FB3E8 0%, #A8D5F0 40%, #2D5A3D 100%)"
                : atmosphere === "ogle"
                ? "linear-gradient(180deg, #4A90D9 0%, #87CEEB 40%, #1B4D2E 100%)"
                : atmosphere === "aksam"
                ? "linear-gradient(180deg, #FF7A3D 0%, #C89B3C 45%, #1B1B1B 100%)"
                : "linear-gradient(180deg, #0A0E27 0%, #111111 60%, #050505 100%)",
          }}
        />
      )}

      {/* KATMAN 2 — Yıldızlar: yalnızca gece, en arkada (gökyüzü düzleminde) */}
      <StarField visible={isNight} />

      {/* KATMAN 3 — Ay ışığı: yumuşak, sabit konumlu glow (gece) */}
      <div
        className="absolute top-[8%] right-[15%] w-40 h-40 rounded-full pointer-events-none transition-opacity duration-[2500ms]"
        style={{
          opacity: isNight ? 1 : 0,
          background: "radial-gradient(circle, rgba(230,236,255,0.55) 0%, rgba(230,236,255,0.15) 40%, transparent 70%)",
          filter: "blur(2px)",
        }}
      />

      {/* KATMAN 4 — Bulutlar: orta hızda parallax, sürekli kayan katman (derinlik hissi) */}
      <div
        className="absolute -inset-x-[10%] top-0 h-1/2 pointer-events-none will-change-transform"
        style={{
          transform: `translate(${parallax.x * 1.6}px, ${parallax.y * 0.6}px)`,
          transition: "transform 0.6s ease-out",
        }}
      >
        <div className="absolute top-[10%] w-1/3 h-20 bg-white/[0.07] rounded-full blur-2xl animate-cloudDrift" style={{ animationDuration: "85s" }} />
        <div className="absolute top-[22%] w-1/4 h-14 bg-white/[0.05] rounded-full blur-2xl animate-cloudDrift" style={{ animationDuration: "110s", animationDelay: "-40s" }} />
        <div className="absolute top-[4%] w-1/5 h-12 bg-white/[0.04] rounded-full blur-xl animate-cloudDrift" style={{ animationDuration: "70s", animationDelay: "-15s" }} />
      </div>

      {/* KATMAN 5 — Zemin sisi: en hızlı parallax (ön plan hissi), yavaşça yatay kayıyor */}
      <div
        className="absolute inset-x-0 bottom-0 h-1/3 pointer-events-none will-change-transform overflow-hidden"
        style={{
          transform: `translate(${parallax.x * 2.2}px, 0)`,
          transition: "transform 0.6s ease-out",
          opacity: atmosphere === "sabah" ? 0.9 : atmosphere === "gece" ? 0.55 : 0.25,
        }}
      >
        <div className="absolute -inset-x-1/4 bottom-0 h-full bg-white/10 blur-3xl animate-[shimmer_24s_linear_infinite]" />
        <div className="absolute -inset-x-1/4 bottom-0 h-2/3 bg-white/[0.06] blur-2xl animate-[shimmer_34s_linear_infinite_reverse]" />
      </div>

      {/* KATMAN 6 — Projektörler: akşamdan itibaren yanmaya başlar, gecede tam güçte */}
      <div className="absolute inset-0 pointer-events-none transition-opacity duration-[2500ms]" style={{ opacity: floodlightStrength }}>
        <div
          className="absolute top-0 left-[8%] w-24 h-2/3"
          style={{ background: "linear-gradient(180deg, rgba(255,215,0,0.22) 0%, transparent 80%)", filter: "blur(8px)", transform: "skewX(-8deg)" }}
        />
        <div
          className="absolute top-0 right-[8%] w-24 h-2/3"
          style={{ background: "linear-gradient(180deg, rgba(255,215,0,0.22) 0%, transparent 80%)", filter: "blur(8px)", transform: "skewX(8deg)" }}
        />
        <div
          className="absolute top-0 left-[30%] w-16 h-1/2"
          style={{ background: "linear-gradient(180deg, rgba(255,215,0,0.14) 0%, transparent 80%)", filter: "blur(10px)" }}
        />
        <div
          className="absolute top-0 right-[30%] w-16 h-1/2"
          style={{ background: "linear-gradient(180deg, rgba(255,215,0,0.14) 0%, transparent 80%)", filter: "blur(10px)" }}
        />
      </div>

      {/* Işık huzmeleri / lens flare — atmosfere göre konum ve renk değişir */}
      <div
        className="absolute inset-0 mix-blend-screen transition-opacity duration-[2500ms]"
        style={{
          background:
            atmosphere === "gece"
              ? "radial-gradient(circle at 20% 15%, rgba(255,215,0,0.18) 0%, transparent 35%), radial-gradient(circle at 80% 20%, rgba(255,215,0,0.14) 0%, transparent 30%)"
              : atmosphere === "aksam"
              ? "radial-gradient(circle at 50% 30%, rgba(255,215,0,0.28) 0%, transparent 45%)"
              : atmosphere === "sabah"
              ? "radial-gradient(circle at 30% 15%, rgba(255,255,255,0.16) 0%, transparent 40%)"
              : "radial-gradient(circle at 60% 10%, rgba(255,255,255,0.12) 0%, transparent 40%)",
        }}
      />

      {/* Vinyet — istek üzerine hafifletildi (0.55 → 0.32): stad detayları ve
          gökyüzü artık daha net görünüyor, siyah tema boğucu olmaktan çıktı. */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: "radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.32) 100%)" }}
      />

      <div className="absolute inset-0 bg-gradient-to-t from-tuna-black/70 via-tuna-black/20 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-r from-tuna-black/45 via-transparent to-tuna-black/20" />
    </div>
  );
}
