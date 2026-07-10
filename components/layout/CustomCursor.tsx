"use client";

import { useEffect, useRef } from "react";

/**
 * Özel imleç sistemi. Tasarım kararları:
 * - Performans: pozisyon her frame'de React state değil, doğrudan DOM transform
 *   üzerinden (ref) güncelleniyor — re-render tetiklemez, 60 FPS'de akıcı kalır.
 * - Hover tespiti: her elemana ayrı listener eklemek yerine tek bir document-level
 *   'pointerover' dinleyicisiyle event delegation kullanılıyor (closest() ile).
 * - Mobil/dokunmatik cihazlarda component hiçbir şey render etmiyor ve body'ye
 *   "cursor: none" sınıfı da eklenmiyor — varsayılan davranış tamamen korunuyor.
 * - Sayfa yapısına dokunmuyor: tek bir fixed, pointer-events:none katman + global
 *   bir "cursor: none" kuralı (yalnızca ince işaretçili/fare cihazlarda aktifleşir).
 */
export function CustomCursor() {
  const cursorRef = useRef<HTMLDivElement>(null);
  const eyeGlowRef = useRef<HTMLDivElement>(null);
  const layerRef = useRef<HTMLDivElement>(null);

  const target = useRef({ x: -100, y: -100 });
  const current = useRef({ x: -100, y: -100 });
  const rafId = useRef<number | null>(null);
  const state = useRef<"default" | "link" | "button" | "card">("default");
  const tilt = useRef(0);

  useEffect(() => {
    // İnce işaretçi (fare) olmayan cihazlarda (dokunmatik) hiçbir şey yapma
    const isFinePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    if (!isFinePointer) return;

    document.body.classList.add("tuna-cursor-active");

    function onPointerMove(e: PointerEvent) {
      target.current.x = e.clientX;
      target.current.y = e.clientY;
    }

    function onPointerOver(e: PointerEvent) {
      const el = (e.target as HTMLElement)?.closest?.(
        "button, a, [role='button'], input, select, textarea"
      );
      const card = (e.target as HTMLElement)?.closest?.(".glass-panel");

      if (el) {
        const isLink = el.tagName === "A";
        state.current = isLink ? "link" : "button";
      } else if (card) {
        state.current = "card";
      } else {
        state.current = "default";
      }
      applyState();
    }

    function applyState() {
      const cursor = cursorRef.current;
      const glow = eyeGlowRef.current;
      if (!cursor || !glow) return;

      cursor.dataset.state = state.current;
    }

    function onMouseDown(e: MouseEvent) {
      spawnBall(e.clientX, e.clientY);
    }

    window.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener("pointerover", onPointerOver, { passive: true });
    window.addEventListener("mousedown", onMouseDown);

    function loop() {
      // Smooth follow: hedefe doğru lerp (gecikme hissi olmadan yumuşak takip)
      current.current.x += (target.current.x - current.current.x) * 0.22;
      current.current.y += (target.current.y - current.current.y) * 0.22;

      // Hafif "sağa sola eğilme" hissi için yatay hıza göre tilt hesapla
      const vx = target.current.x - current.current.x;
      tilt.current += (vx * 0.6 - tilt.current) * 0.15;

      if (cursorRef.current) {
        const scale =
          state.current === "button" ? 1.1 : state.current === "link" ? 1.15 : state.current === "card" ? 1.05 : 1;
        const cardTilt = state.current === "card" ? tilt.current : 0;

        cursorRef.current.style.transform = `translate(${current.current.x}px, ${current.current.y}px) translate(-50%, -50%) scale(${scale}) rotate(${cardTilt}deg)`;
      }

      rafId.current = requestAnimationFrame(loop);
    }
    rafId.current = requestAnimationFrame(loop);

    return () => {
      document.body.classList.remove("tuna-cursor-active");
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerover", onPointerOver);
      window.removeEventListener("mousedown", onMouseDown);
      if (rafId.current) cancelAnimationFrame(rafId.current);
    };
  }, []);

  function spawnBall(x: number, y: number) {
    const layer = layerRef.current;
    if (!layer) return;

    const ball = document.createElement("div");
    ball.className = "tuna-cursor-ball";
    ball.style.left = `${x}px`;
    ball.style.top = `${y}px`;
    layer.appendChild(ball);

    // Basit sekme fiziği: yerçekimi + her sekmede azalan geri sıçrama (restitution)
    let vy = -9 - Math.random() * 3;
    let vx = (Math.random() - 0.5) * 6;
    let posY = 0;
    let posX = 0;
    let rotation = 0;
    const gravity = 0.55;
    const restitution = 0.55;
    let bounces = 0;
    const maxBounces = 3 + Math.floor(Math.random() * 2); // 3-4 sekme
    const startTime = performance.now();
    const maxDuration = 1000;

function spawnParticles(px: number, py: number, targetLayer: HTMLDivElement) {
      for (let i = 0; i < 5; i++) {
        const p = document.createElement("div");
        p.className = "tuna-cursor-particle";
        const angle = Math.random() * Math.PI - Math.PI / 2;
        const dist = 10 + Math.random() * 14;
        p.style.left = `${px}px`;
        p.style.top = `${py}px`;
        p.style.setProperty("--dx", `${Math.cos(angle) * dist}px`);
        p.style.setProperty("--dy", `${-Math.abs(Math.sin(angle) * dist)}px`);
        p.style.background = Math.random() > 0.5 ? "#8a6d3b" : "#4a7c3f";
        targetLayer.appendChild(p);
        setTimeout(() => p.remove(), 500);
      }
    }

    function frame(now: number) {
      const elapsed = now - startTime;
      vy += gravity;
      posY += vy;
      posX += vx;
      rotation += 18;

      if (posY >= 0 && vy > 0) {
        // Zemine (tıklama noktasının y'sine) değdi — sek
        posY = 0;
        vy = -Math.abs(vy) * restitution;
        bounces++;
        spawnParticles(x + posX, y, layer!);
        if (bounces >= maxBounces || Math.abs(vy) < 2) {
          finish();
          return;
        }
      }

      const fadeStart = maxDuration * 0.7;
      const opacity = elapsed > fadeStart ? Math.max(0, 1 - (elapsed - fadeStart) / (maxDuration - fadeStart)) : 1;
      const scale = elapsed > fadeStart ? Math.max(0.2, opacity) : 1;

      ball.style.transform = `translate(${posX}px, ${posY}px) rotate(${rotation}deg) scale(${scale})`;
      ball.style.opacity = String(opacity);

      if (elapsed < maxDuration) {
        requestAnimationFrame(frame);
      } else {
        finish();
      }
    }

    function finish() {
      ball.style.transition = "opacity 0.2s ease, transform 0.2s ease";
      ball.style.opacity = "0";
      setTimeout(() => ball.remove(), 220);
    }

    requestAnimationFrame(frame);
  }

  return (
    <>
      <div ref={cursorRef} className="tuna-custom-cursor" data-state="default">
        <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
          {/* Kurt kafası — basit, tanınabilir siluet */}
          <path
            d="M14 2 L18 6 L22 4 L21 9 L25 12 L20 13 L21 18 L16 16 L14 20 L12 16 L7 18 L8 13 L3 12 L7 9 L6 4 L10 6 Z"
            fill="#1a1a1a"
            stroke="#FFD700"
            strokeWidth="1"
          />
          {/* Gözler — hover'da altın parlama alacak */}
          <circle className="tuna-cursor-eye" cx="11" cy="11" r="1.6" fill="#FFD700" />
          <circle className="tuna-cursor-eye" cx="17" cy="11" r="1.6" fill="#FFD700" />
        </svg>
        <div ref={eyeGlowRef} className="tuna-cursor-glow" />
      </div>
      <div ref={layerRef} className="tuna-cursor-fx-layer" />

      <style jsx global>{`
        /* Yalnızca aktifken (ince işaretçili cihaz) varsayılan imleci gizle */
        body.tuna-cursor-active,
        body.tuna-cursor-active * {
          cursor: none !important;
        }

        .tuna-custom-cursor {
          position: fixed;
          top: 0;
          left: 0;
          width: 28px;
          height: 28px;
          pointer-events: none;
          z-index: 99999;
          will-change: transform;
          filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.4));
          transition: filter 0.2s ease;
        }
        .tuna-custom-cursor[data-state="button"],
        .tuna-custom-cursor[data-state="link"] {
          filter: drop-shadow(0 0 8px rgba(255, 215, 0, 0.75)) drop-shadow(0 2px 4px rgba(0, 0, 0, 0.4));
        }
        .tuna-custom-cursor[data-state="link"]::after {
          content: "";
          position: absolute;
          inset: -8px;
          border: 1.5px solid rgba(255, 215, 0, 0.6);
          border-radius: 50%;
          animation: tunaCursorRing 0.4s ease-out;
        }
        @keyframes tunaCursorRing {
          from { transform: scale(0.6); opacity: 0.9; }
          to { transform: scale(1); opacity: 1; }
        }

        .tuna-cursor-eye {
          transition: fill 0.15s ease, filter 0.15s ease;
        }
        .tuna-custom-cursor[data-state="button"] .tuna-cursor-eye,
        .tuna-custom-cursor[data-state="link"] .tuna-cursor-eye {
          fill: #fff7c2;
          filter: drop-shadow(0 0 3px #ffd700);
        }

        .tuna-cursor-fx-layer {
          position: fixed;
          inset: 0;
          pointer-events: none;
          z-index: 99998;
        }

        .tuna-cursor-ball {
          position: absolute;
          width: 14px;
          height: 14px;
          margin: -7px 0 0 -7px;
          border-radius: 50%;
          background: radial-gradient(circle at 30% 30%, #fffde8, #ffd700 60%, #b8960a 100%);
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.4);
        }

        .tuna-cursor-particle {
          position: absolute;
          width: 4px;
          height: 4px;
          margin: -2px 0 0 -2px;
          border-radius: 50%;
          animation: tunaParticleFly 0.45s ease-out forwards;
        }
        @keyframes tunaParticleFly {
          from { transform: translate(0, 0); opacity: 1; }
          to { transform: translate(var(--dx), var(--dy)); opacity: 0; }
        }

        /* Mobil / kaba işaretçili cihazlarda bu dosyanın hiçbir kuralı devreye
           girmez çünkü component zaten render edilmiyor (bkz. useEffect erken çıkış) */
      `}</style>
    </>
  );
}
