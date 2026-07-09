"use client";

import { useEffect, useRef } from "react";

// Gece gökyüzünde yıldızlar — canvas tabanlı, çok hafif twinkle (parlaklık titreşimi).
// Yalnızca birkaç yüz noktadan oluştuğu için GPU/CPU maliyeti neredeyse sıfırdır.
export function StarField({ visible }: { visible: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!visible) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight * 0.6); // yıldızlar yalnızca üst gökyüzünde

    function resize() {
      width = canvas!.width = window.innerWidth;
      height = canvas!.height = window.innerHeight * 0.6;
    }
    window.addEventListener("resize", resize);

    const starCount = Math.min(160, Math.round((width * height) / 6000));
    const stars = Array.from({ length: starCount }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      r: 0.5 + Math.random() * 1.3,
      phase: Math.random() * Math.PI * 2,
      speed: 0.005 + Math.random() * 0.015,
    }));

    let frame: number;
    function draw() {
      ctx!.clearRect(0, 0, width, height);
      for (const s of stars) {
        s.phase += s.speed;
        const twinkle = 0.4 + Math.abs(Math.sin(s.phase)) * 0.6;
        ctx!.beginPath();
        ctx!.fillStyle = `rgba(255,255,255,${twinkle})`;
        ctx!.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx!.fill();
      }
      frame = requestAnimationFrame(draw);
    }
    draw();

    return () => { cancelAnimationFrame(frame); window.removeEventListener("resize", resize); };
  }, [visible]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute top-0 inset-x-0 pointer-events-none transition-opacity duration-[2500ms]"
      style={{ opacity: visible ? 1 : 0, height: "60%" }}
      aria-hidden="true"
    />
  );
}
