"use client";

import { useEffect, useRef, useState, useCallback } from "react";

export type Pattern = "duz" | "cizgili" | "capraz" | "parcali" | "geometrik" | "kamuflaj" | "gradient";
export type LayerKind = "logo" | "sponsor" | "text";
export type LayerCanvas = "front" | "back" | "sleeve" | "shorts";
export type TextEffect = "yok" | "kontur" | "golge" | "kabartma";

export interface DesignLayer {
  id: string;
  kind: LayerKind;
  canvas: LayerCanvas;
  x: number; // % (0-100)
  y: number; // % (0-100)
  scale: number;
  rotation: number; // derece
  imageUrl?: string;
  text?: string;
  color?: string;
  font?: string;
  effect?: TextEffect;
}

const CANVAS_W = 512;
const CANVAS_H = 640;
const SMALL_W = 256;
const SMALL_H = 256;

const imageCache = new Map<string, HTMLImageElement>();
function loadImage(url: string): Promise<HTMLImageElement> {
  if (imageCache.has(url)) return Promise.resolve(imageCache.get(url)!);
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => { imageCache.set(url, img); resolve(img); };
    img.onerror = reject;
    img.src = url;
  });
}

// Prosedürel kumaş "hissi": gerçek bir normal map değil, dokunun üzerine
// bindirilen çok hafif, tekrarlı bir gren deseni — yakından bakınca düz bir
// dijital renk yerine dokulu bir yüzey hissi verir.
function drawFabricGrain(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const imageData = ctx.getImageData(0, 0, w, h);
  const d = imageData.data;
  for (let i = 0; i < d.length; i += 4) {
    const grain = (Math.random() - 0.5) * 14;
    d[i] = Math.min(255, Math.max(0, d[i] + grain));
    d[i + 1] = Math.min(255, Math.max(0, d[i + 1] + grain));
    d[i + 2] = Math.min(255, Math.max(0, d[i + 2] + grain));
  }
  ctx.putImageData(imageData, 0, 0);
}

// Yaka/kol/yan dikiş çizgilerini simüle eden ince, kesikli kontur çizgileri.
function drawStitchLines(ctx: CanvasRenderingContext2D, w: number, h: number, color: string) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.globalAlpha = 0.35;
  ctx.lineWidth = 1.5;
  ctx.setLineDash([4, 4]);
  // Yaka
  ctx.beginPath();
  ctx.arc(w / 2, h * 0.09, w * 0.14, 0, Math.PI * 2);
  ctx.stroke();
  // Yan dikişler
  ctx.beginPath();
  ctx.moveTo(w * 0.06, h * 0.18);
  ctx.lineTo(w * 0.06, h * 0.95);
  ctx.moveTo(w * 0.94, h * 0.18);
  ctx.lineTo(w * 0.94, h * 0.95);
  ctx.stroke();
  ctx.restore();
}

function drawBase(ctx: CanvasRenderingContext2D, w: number, h: number, primary: string, secondary: string, tertiary: string, pattern: Pattern) {
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = primary;
  ctx.fillRect(0, 0, w, h);

  if (pattern === "cizgili") {
    ctx.fillStyle = secondary;
    const stripeWidth = w / 10;
    for (let i = 0; i < 10; i += 2) ctx.fillRect(i * stripeWidth, 0, stripeWidth, h);
  } else if (pattern === "capraz") {
    ctx.save();
    ctx.strokeStyle = secondary;
    ctx.lineWidth = w * 0.12;
    ctx.beginPath();
    ctx.moveTo(-w * 0.2, h * 0.3);
    ctx.lineTo(w * 1.2, h * 0.9);
    ctx.stroke();
    ctx.restore();
  } else if (pattern === "parcali") {
    ctx.fillStyle = secondary;
    ctx.fillRect(0, 0, w / 2, h);
    ctx.fillStyle = tertiary;
    ctx.beginPath();
    ctx.moveTo(w / 2, 0);
    ctx.lineTo(w, 0);
    ctx.lineTo(w, h * 0.15);
    ctx.lineTo(w / 2, h * 0.15);
    ctx.closePath();
    ctx.fill();
  } else if (pattern === "geometrik") {
    ctx.fillStyle = secondary;
    const size = w / 8;
    for (let y = 0; y < h + size; y += size) {
      for (let x = -size; x < w + size; x += size * 2) {
        const offset = (Math.floor(y / size) % 2) * size;
        ctx.beginPath();
        ctx.moveTo(x + offset, y);
        ctx.lineTo(x + offset + size / 2, y + size / 2);
        ctx.lineTo(x + offset, y + size);
        ctx.lineTo(x + offset - size / 2, y + size / 2);
        ctx.closePath();
        ctx.fill();
      }
    }
  } else if (pattern === "kamuflaj") {
    const colors = [secondary, tertiary, primary];
    for (let i = 0; i < 60; i++) {
      ctx.fillStyle = colors[i % colors.length];
      ctx.globalAlpha = 0.55;
      const bx = Math.random() * w;
      const by = Math.random() * h;
      const r = 20 + Math.random() * 45;
      ctx.beginPath();
      ctx.ellipse(bx, by, r, r * (0.6 + Math.random() * 0.5), Math.random() * Math.PI, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  } else if (pattern === "gradient") {
    const grad = ctx.createLinearGradient(0, 0, w, h);
    grad.addColorStop(0, primary);
    grad.addColorStop(0.5, secondary);
    grad.addColorStop(1, tertiary);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);
  }
  // "duz" — yalnızca ana renk, ek çizim yok.
}

function applyTextEffect(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, effect: TextEffect, color: string) {
  ctx.textAlign = "center";
  if (effect === "kontur") {
    ctx.lineWidth = 3;
    ctx.strokeStyle = "#000000";
    ctx.strokeText(text, x, y);
  } else if (effect === "golge") {
    ctx.save();
    ctx.shadowColor = "rgba(0,0,0,0.6)";
    ctx.shadowBlur = 8;
    ctx.shadowOffsetX = 3;
    ctx.shadowOffsetY = 3;
  } else if (effect === "kabartma") {
    ctx.fillStyle = "rgba(255,255,255,0.35)";
    ctx.fillText(text, x - 1.5, y - 1.5);
    ctx.fillStyle = "rgba(0,0,0,0.35)";
    ctx.fillText(text, x + 1.5, y + 1.5);
  }
  ctx.fillStyle = color;
  ctx.fillText(text, x, y);
  if (effect === "golge") ctx.restore();
}

interface CanvasSet {
  front: HTMLCanvasElement;
  back: HTMLCanvasElement;
  sleeve: HTMLCanvasElement;
  shorts: HTMLCanvasElement;
}

interface JerseyDesignCanvasProps {
  primaryColor: string;
  secondaryColor: string;
  tertiaryColor: string;
  pattern: Pattern;
  layers: DesignLayer[];
  onLayersChange: (layers: DesignLayer[]) => void;
  onCanvasesReady: (canvases: CanvasSet) => void;
}

// Formanın 2D "kalıplarını" (ön, arka, kol, şort) canvas'a çizer — bu canvas'lar
// hem PNG dışa aktarma hem de Jersey3D'nin doku olarak giydireceği kaynak.
// Logo/sponsor/isim/numara katmanları (DesignLayer[]) ön ve arka kalıp
// üzerinde serbestçe sürüklenebilir; kol ve şort için ölçek kontrolü yeterli
// görülüp sürükleme basitleştirildi.
export function JerseyDesignCanvas({
  primaryColor, secondaryColor, tertiaryColor, pattern, layers, onLayersChange, onCanvasesReady,
}: JerseyDesignCanvasProps) {
  const frontRef = useRef<HTMLCanvasElement>(null);
  const backRef = useRef<HTMLCanvasElement>(null);
  const sleeveRef = useRef<HTMLCanvasElement>(null);
  const shortsRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeCanvas, setActiveCanvas] = useState<"front" | "back">("front");
  const [dragging, setDragging] = useState<string | null>(null);
  const [images, setImages] = useState<Record<string, HTMLImageElement>>({});

  useEffect(() => {
    const urls = Array.from(new Set(layers.filter((l) => l.imageUrl).map((l) => l.imageUrl!)));
    urls.forEach((url) => {
      if (!images[url]) loadImage(url).then((img) => setImages((prev) => ({ ...prev, [url]: img }))).catch(() => {});
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [layers]);

  const redraw = useCallback(() => {
    const canvases: Record<LayerCanvas, HTMLCanvasElement | null> = {
      front: frontRef.current, back: backRef.current, sleeve: sleeveRef.current, shorts: shortsRef.current,
    };
    if (!canvases.front || !canvases.back || !canvases.sleeve || !canvases.shorts) return;

    (Object.entries(canvases) as [LayerCanvas, HTMLCanvasElement][]).forEach(([canvasName, canvas]) => {
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      const w = canvas.width;
      const h = canvas.height;

      drawBase(ctx, w, h, primaryColor, secondaryColor, tertiaryColor, pattern);
      drawFabricGrain(ctx, w, h);
      drawStitchLines(ctx, w, h, secondaryColor);

      for (const layer of layers.filter((l) => l.canvas === canvasName)) {
        ctx.save();
        const px = (layer.x / 100) * w;
        const py = (layer.y / 100) * h;
        ctx.translate(px, py);
        ctx.rotate((layer.rotation * Math.PI) / 180);

        if (layer.kind === "text" && layer.text) {
          const fontSize = 28 * layer.scale;
          ctx.font = `bold ${fontSize}px ${layer.font ?? "sans-serif"}`;
          applyTextEffect(ctx, layer.text, 0, fontSize / 3, layer.effect ?? "yok", layer.color ?? secondaryColor);
        } else if (layer.imageUrl && images[layer.imageUrl]) {
          const img = images[layer.imageUrl];
          const size = 60 * layer.scale;
          const aspect = img.naturalWidth / img.naturalHeight || 1;
          ctx.drawImage(img, -size * aspect / 2, -size / 2, size * aspect, size);
        }
        ctx.restore();
      }
    });

    onCanvasesReady({ front: canvases.front, back: canvases.back, sleeve: canvases.sleeve, shorts: canvases.shorts });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [primaryColor, secondaryColor, tertiaryColor, pattern, layers, images]);

  useEffect(() => { redraw(); }, [redraw]);

  function handlePointerDown(id: string) {
    return (e: React.PointerEvent) => { e.preventDefault(); setDragging(id); };
  }

  function handlePointerMove(e: React.PointerEvent) {
    if (!dragging || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
    const y = Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100));
    onLayersChange(layers.map((l) => (l.id === dragging ? { ...l, x, y } : l)));
  }

  function handlePointerUp() { setDragging(null); }

  const visibleLayers = layers.filter((l) => l.canvas === activeCanvas);

  return (
    <div className="space-y-3">
      <div className="flex justify-center gap-2">
        {(["front", "back"] as const).map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => setActiveCanvas(c)}
            className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${activeCanvas === c ? "border-tuna-gold text-tuna-gold bg-tuna-gold/10" : "border-white/15 text-white/70 hover:border-white/30"}`}
          >
            {c === "front" ? "Ön Kalıp" : "Arka Kalıp"}
          </button>
        ))}
      </div>

      <div
        ref={containerRef}
        className="relative mx-auto"
        style={{ width: CANVAS_W / 2, height: CANVAS_H / 2 }}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
      >
        <canvas
          ref={frontRef}
          width={CANVAS_W} height={CANVAS_H}
          className={`absolute inset-0 h-full w-full rounded-lg ${activeCanvas === "front" ? "" : "hidden"}`}
        />
        <canvas
          ref={backRef}
          width={CANVAS_W} height={CANVAS_H}
          className={`absolute inset-0 h-full w-full rounded-lg ${activeCanvas === "back" ? "" : "hidden"}`}
        />

        {visibleLayers.map((l) => (
          <div
            key={l.id}
            onPointerDown={handlePointerDown(l.id)}
            style={{ left: `${l.x}%`, top: `${l.y}%` }}
            className="absolute -translate-x-1/2 -translate-y-1/2 cursor-move rounded-full border-2 border-dashed border-tuna-yellow/70 bg-tuna-yellow/10 px-2 py-1 text-[10px] text-tuna-yellow touch-none whitespace-nowrap"
          >
            {l.kind === "text" ? l.text || "Yazı" : l.kind === "logo" ? "Logo" : "Sponsor"}
          </div>
        ))}
      </div>

      <canvas ref={sleeveRef} width={SMALL_W} height={SMALL_H} className="hidden" />
      <canvas ref={shortsRef} width={SMALL_W} height={SMALL_H} className="hidden" />

      <p className="text-center text-xs text-tuna-mist">Sarı işaretçileri sürükleyerek {activeCanvas === "front" ? "ön" : "arka"} kalıp üzerinde konumlandırın</p>
    </div>
  );
}
