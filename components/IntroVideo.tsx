"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";

/**
 * Tam ekran giriş (intro) videosu.
 *
 * Davranış:
 * - Oynatma modu admin panelinden (Site Ayarları → "Giriş Videosu Oynatma Modu") kontrol edilir:
 *   "once_per_session"  → tarayıcı sekmesi başına bir kez oynar (varsayılan)
 *   "always"            → her tam sayfa yüklemesinde tekrar oynar
 *   "disabled"          → hiç gösterilmez
 * - Bu bileşen kök layout'ta (app/layout.tsx) bir kez mount edilir; App Router
 *   sayfa içi (client-side) geçişlerde layout'u yeniden mount etmediği için
 *   intro normalde zaten sayfa geçişlerinde tekrar oynamaz.
 * - Video oynatılamaz/yüklenemezse (ağ hatası, format desteklenmiyor vb.)
 *   otomatik olarak CSS tabanlı bir yedek animasyon (logo + "TUNASPOR 1954"
 *   başlığı + şimşek/yağmur hissi veren katmanlar) devreye girer; kullanıcı
 *   asla boş siyah ekranla kalmaz.
 * - Video hazır olana kadar (canPlay) marka renkli bir yükleniyor katmanı
 *   gösterilir, böylece "siyah ekran" veya ilk kare takılması yaşanmaz.
 */

const SESSION_KEY = "tunaspor_intro_seen_session";
type IntroMode = "once_per_session" | "always" | "disabled";

export default function IntroVideo() {
  const [introMode, setIntroMode] = useState<IntroMode>("once_per_session");
  const [visible, setVisible] = useState(false);
  const [fading, setFading] = useState(false);
  const [muted, setMuted] = useState(true);
  const [progress, setProgress] = useState(0);
  const [videoReady, setVideoReady] = useState(false);
  const [videoFailed, setVideoFailed] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const endIntro = useCallback(() => {
    if (introMode !== "always") {
      try {
        sessionStorage.setItem(SESSION_KEY, "1");
      } catch {
        // sessionStorage kapalıysa (gizli sekme vb.) sessizce yok say — intro
        // her seferinde tekrar oynar, bu bir hataya yol açmaz.
      }
    }
    setFading(true);
    window.setTimeout(() => setVisible(false), 800);
  }, [introMode]);

  // 1) Admin ayarını çek, ardından oturum/mod kuralına göre intro'yu gösterip
  //    göstermeyeceğine karar ver.
  useEffect(() => {
    let cancelled = false;

    fetch("/api/site-settings-public")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (cancelled) return;
        const mode: IntroMode =
          d?.intro_mode === "always" || d?.intro_mode === "disabled" ? d.intro_mode : "once_per_session";
        setIntroMode(mode);

        if (mode === "disabled") return;

        if (mode === "once_per_session") {
          let alreadySeen = false;
          try {
            alreadySeen = !!sessionStorage.getItem(SESSION_KEY);
          } catch {
            alreadySeen = false;
          }
          if (alreadySeen) return;
        }

        setVisible(true);
      })
      .catch(() => {
        // Ayar sunucusuna ulaşılamazsa güvenli varsayılan: oturum başına bir kez göster.
        let alreadySeen = false;
        try {
          alreadySeen = !!sessionStorage.getItem(SESSION_KEY);
        } catch {
          alreadySeen = false;
        }
        if (!alreadySeen && !cancelled) setVisible(true);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  // 2) Video oynatma, ilerleme takibi ve klavye ile geçme.
  useEffect(() => {
    if (!visible) return;
    const video = videoRef.current;
    if (!video) return;

    video.play().catch(() => {
      // Tarayıcı autoplay'i engellediyse ilk kullanıcı etkileşiminde başlat.
      const startOnInteraction = () => {
        video.play().catch(() => {});
        window.removeEventListener("click", startOnInteraction);
        window.removeEventListener("keydown", startOnInteraction);
      };
      window.addEventListener("click", startOnInteraction);
      window.addEventListener("keydown", startOnInteraction);
    });

    const handleTimeUpdate = () => {
      if (video.duration > 0) setProgress((video.currentTime / video.duration) * 100);
    };
    const handleCanPlay = () => setVideoReady(true);
    const handleError = () => setVideoFailed(true);
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") endIntro();
    };

    video.addEventListener("timeupdate", handleTimeUpdate);
    video.addEventListener("ended", endIntro);
    video.addEventListener("canplaythrough", handleCanPlay);
    video.addEventListener("error", handleError);
    window.addEventListener("keydown", handleEsc);

    return () => {
      video.removeEventListener("timeupdate", handleTimeUpdate);
      video.removeEventListener("ended", endIntro);
      video.removeEventListener("canplaythrough", handleCanPlay);
      video.removeEventListener("error", handleError);
      window.removeEventListener("keydown", handleEsc);
    };
  }, [visible, endIntro]);

  // Yedek animasyon kullanılıyorsa sabit bir süre sonra otomatik kapat.
  useEffect(() => {
    if (!visible || !videoFailed) return;
    const timeout = window.setTimeout(endIntro, 4200);
    return () => window.clearTimeout(timeout);
  }, [visible, videoFailed, endIntro]);

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-label="Tunaspor 1954 giriş animasyonu"
      style={{
        position: "fixed",
        inset: 0,
        background: "#050506",
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        opacity: fading ? 0 : 1,
        pointerEvents: fading ? "none" : "auto",
        transition: "opacity 0.8s ease",
      }}
    >
      {!videoFailed && (
        <video
          ref={videoRef}
          muted={muted}
          playsInline
          autoPlay
          preload="auto"
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            opacity: videoReady ? 1 : 0,
            transition: "opacity 0.5s ease",
          }}
        >
          <source src="/videos/tunaspor-intro.mp4" type="video/mp4" />
        </video>
      )}

      {/* Video hazır olana kadar (veya hiç yüklenemezse) marka temalı yükleniyor/yedek katman —
          böylece kullanıcı asla boş siyah ekran görmez. */}
      {(!videoReady || videoFailed) && <FallbackScene failed={videoFailed} />}

      {/* İlerleme çubuğu — yalnızca video gerçekten oynatılırken anlamlı */}
      {!videoFailed && (
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            height: 3,
            width: `${progress}%`,
            background: "linear-gradient(90deg, #e10600, #ffd700)",
            zIndex: 10,
            transition: "width 0.1s linear",
          }}
        />
      )}

      {!videoFailed && (
        <button
          onClick={() => setMuted((m) => !m)}
          aria-label={muted ? "Sesi aç" : "Sesi kapat"}
          style={btnStyle("left")}
        >
          {muted ? "🔇 Sesi Aç" : "🔊 Sesi Kapat"}
        </button>
      )}

      <button onClick={endIntro} aria-label="Girişi geç" style={btnStyle("right")}>
        Geç ›
      </button>
    </div>
  );
}

// Video oynatılamadığında (veya henüz hazır değilken arkada) gösterilen,
// tamamen CSS/keyframe tabanlı, bağımlılıksız yedek sahne. Logo, kulüp adı,
// kuruluş yılı ve stadyum gece atmosferini anımsatan bir şimşek/parıltı
// efektiyle markaya sadık, hafif bir deneyim sağlar.
function FallbackScene({ failed }: { failed: boolean }) {
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 16,
        background:
          "radial-gradient(ellipse at center, #14151a 0%, #050506 70%)",
        animation: failed ? "tuna-intro-lightning 3.2s ease-in-out infinite" : undefined,
      }}
    >
      <Image
        src="/images/logo.png"
        alt="Tunaspor 1954 logosu"
        width={96}
        height={96}
        priority
        style={{ animation: "tuna-intro-pulse 2.4s ease-in-out infinite" }}
      />
      <div
        style={{
          fontFamily: "var(--font-display)",
          letterSpacing: "0.35em",
          fontSize: 32,
          color: "#ffd700",
          textAlign: "center",
        }}
      >
        TUNASPOR
      </div>
      <div style={{ fontSize: 16, color: "#e5e5e5", letterSpacing: "0.5em" }}>1954</div>

      <style>{`
        @keyframes tuna-intro-pulse {
          0%, 100% { opacity: 0.75; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.06); }
        }
        @keyframes tuna-intro-lightning {
          0%, 92%, 100% { box-shadow: inset 0 0 0 9999px rgba(255,255,255,0); }
          93% { box-shadow: inset 0 0 0 9999px rgba(255,255,255,0.18); }
          94% { box-shadow: inset 0 0 0 9999px rgba(255,255,255,0); }
        }
      `}</style>
    </div>
  );
}

function btnStyle(side: "left" | "right"): CSSProperties {
  return {
    position: "absolute",
    bottom: 32,
    [side]: 32,
    padding: "10px 20px",
    background: "rgba(255,255,255,0.12)",
    border: "1px solid rgba(255,255,255,0.4)",
    color: "#fff",
    fontSize: 14,
    borderRadius: 30,
    cursor: "pointer",
    backdropFilter: "blur(6px)",
    zIndex: 10,
  };
}
