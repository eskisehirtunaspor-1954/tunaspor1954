"use client";

import { useEffect, useRef, useState, useCallback } from "react";

export interface LayoutItem {
  x: number; // % (0-100)
  y: number; // % (0-100)
  scale: number;
}

export interface DesignLayout {
  logo: LayoutItem;
  sponsor: LayoutItem;
  name: LayoutItem;
  number: LayoutItem;
}

export const DEFAULT_DESIGN_LAYOUT: DesignLayout = {
  logo: { x: 30, y: 22, scale: 1 },
  sponsor: { x: 50, y: 45, scale: 1 },
  name: { x: 50, y: 15, scale: 1 },
  number: { x: 50, y: 52, scale: 2.4 },
};

interface JerseyDesignCanvasProps {
  primaryColor: string;
  secondaryColor: string;
  pattern: "duz" | "cizgili" | "capraz";
  playerName?: string;
  playerNumber?: string;
  logoUrl?: string | null;
  sponsorLogoUrl?: string | null;
  layout: DesignLayout;
  onLayoutChange: (layout: DesignLayout) => void;
  onCanvasesReady: (front: HTMLCanvasElement, back: HTMLCanvasElement) => void;
}

const CANVAS_W = 512;
const CANVAS_H = 640;

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

function drawBase(ctx: CanvasRenderingContext2D, primaryColor: string, secondaryColor: string, pattern: string) {
  ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);
  ctx.fillStyle = primaryColor;
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

  if (pattern === "cizgili") {
    ctx.fillStyle = secondaryColor;
    const stripeWidth = CANVAS_W / 10;
    for (let i = 0; i < 10; i += 2) ctx.fillRect(i * stripeWidth, 0, stripeWidth, CANVAS_H);
  } else if (pattern === "capraz") {
    ctx.save();
    ctx.strokeStyle = secondaryColor;
    ctx.lineWidth = 60;
    ctx.beginPath();
    ctx.moveTo(-100, CANVAS_H * 0.3);
    ctx.lineTo(CANVAS_W + 100, CANVAS_H * 0.9);
    ctx.stroke();
    ctx.restore();
  }
}

// Bu bileşen, forma tasarımının 2D "kalıbını" (ön ve arka) bir <canvas>'a çizer.
// Bu canvas hem PNG dışa aktarma için hem de Jersey3D'nin doku (texture) olarak
// giydireceği kaynak olarak kullanılır. Logo/sponsor/isim/numara, kalıp üzerinde
// yüzde bazlı konumlarla (DesignLayout) sürükle-bırak ile taşınabilir.
export function JerseyDesignCanvas({
  primaryColor, secondaryColor, pattern, playerName, playerNumber,
  logoUrl, sponsorLogoUrl, layout, onLayoutChange, onCanvasesReady,
}: JerseyDesignCanvasProps) {
  const frontRef = useRef<HTMLCanvasElement>(null);
  const backRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState<keyof DesignLayout | null>(null);
  const [logoImg, setLogoImg] = useState<HTMLImageElement | null>(null);
  const [sponsorImg, setSponsorImg] = useState<HTMLImageElement | null>(null);

  useEffect(() => {
    if (logoUrl) loadImage(logoUrl).then(setLogoImg).catch(() => setLogoImg(null));
    else setLogoImg(null);
  }, [logoUrl]);

  useEffect(() => {
    if (sponsorLogoUrl) loadImage(sponsorLogoUrl).then(setSponsorImg).catch(() => setSponsorImg(null));
    else setSponsorImg(null);
  }, [sponsorLogoUrl]);

  const redraw = useCallback(() => {
    const front = frontRef.current;
    const back = backRef.current;
    if (!front || !back) return;
    const fCtx = front.getContext("2d");
    const bCtx = back.getContext("2d");
    if (!fCtx || !bCtx) return;

    drawBase(fCtx, primaryColor, secondaryColor, pattern);
    drawBase(bCtx, primaryColor, secondaryColor, pattern);

    if (logoImg) {
      const { x, y, scale } = layout.logo;
      const size = 70 * scale;
      fCtx.drawImage(logoImg, (x / 100) * CANVAS_W - size / 2, (y / 100) * CANVAS_H - size / 2, size, size);
    }
    if (sponsorImg) {
      const { x, y, scale } = layout.sponsor;
      const w = 140 * scale;
      const h = 50 * scale;
      fCtx.drawImage(sponsorImg, (x / 100) * CANVAS_W - w / 2, (y / 100) * CANVAS_H - h / 2, w, h);
    }
    if (playerName) {
      const { x, y, scale } = layout.name;
      bCtx.fillStyle = secondaryColor;
      bCtx.font = `bold ${32 * scale}px sans-serif`;
      bCtx.textAlign = "center";
      bCtx.fillText(playerName.toUpperCase(), (x / 100) * CANVAS_W, (y / 100) * CANVAS_H);
    }
    if (playerNumber) {
      const { x, y, scale } = layout.number;
      bCtx.fillStyle = secondaryColor;
      bCtx.font = `bold ${80 * scale}px sans-serif`;
      bCtx.textAlign = "center";
      bCtx.textBaseline = "middle";
      bCtx.fillText(playerNumber, (x / 100) * CANVAS_W, (y / 100) * CANVAS_H);
    }

    onCanvasesReady(front, back);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [primaryColor, secondaryColor, pattern, playerName, playerNumber, logoImg, sponsorImg, layout]);

  useEffect(() => { redraw(); }, [redraw]);

  function handlePointerDown(key: keyof DesignLayout) {
    return (e: React.PointerEvent) => {
      e.preventDefault();
      setDragging(key);
    };
  }

  function handlePointerMove(e: React.PointerEvent) {
    if (!dragging || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
    const y = Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100));
    onLayoutChange({ ...layout, [dragging]: { ...layout[dragging], x, y } });
  }

  function handlePointerUp() {
    setDragging(null);
  }

  const draggableMarkers: Array<{ key: keyof DesignLayout; label: string; show: boolean }> = [
    { key: "logo", label: "Logo", show: Boolean(logoImg) },
    { key: "sponsor", label: "Sponsor", show: Boolean(sponsorImg) },
    { key: "name", label: "İsim", show: Boolean(playerName) },
    { key: "number", label: "No", show: Boolean(playerNumber) },
  ];

  return (
    <div className="space-y-2">
      <div
        ref={containerRef}
        className="relative mx-auto"
        style={{ width: CANVAS_W / 2, height: CANVAS_H / 2 }}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
      >
        <canvas ref={frontRef} width={CANVAS_W} height={CANVAS_H} className="absolute inset-0 h-full w-full rounded-lg" />
        {draggableMarkers.filter((m) => m.show).map((m) => (
          <div
            key={m.key}
            onPointerDown={handlePointerDown(m.key)}
            style={{ left: `${layout[m.key].x}%`, top: `${layout[m.key].y}%` }}
            className="absolute -translate-x-1/2 -translate-y-1/2 cursor-move rounded-full border-2 border-dashed border-tuna-yellow/70 bg-tuna-yellow/10 px-2 py-1 text-[10px] text-tuna-yellow touch-none"
          >
            {m.label}
          </div>
        ))}
      </div>
      <canvas ref={backRef} width={CANVAS_W} height={CANVAS_H} className="hidden" />
      <p className="text-center text-xs text-tuna-mist">Sarı işaretçileri sürükleyerek konumlandırın (önizleme ön yüz — logo/sponsor)</p>
    </div>
  );
}
