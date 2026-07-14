"use client";

import { useEffect, useState, useCallback } from "react";
import dynamic from "next/dynamic";
import * as THREE from "three";
import { JerseyPreview } from "@/components/jersey/JerseyPreview";
import { JerseyDesignCanvas, type Pattern, type DesignLayer, type TextEffect } from "@/components/jersey/JerseyDesignCanvas";
import type { CollarType, SleeveType, Fabric, JerseyView } from "@/components/jersey/Jersey3D";
import { COLOR_PALETTES, JERSEY_TEMPLATES } from "@/components/jersey/jerseyPresets";
import jsPDF from "jspdf";

// three.js window nesnesine ihtiyaç duyar — yalnızca istemci tarafında render edilir.
const Jersey3D = dynamic(() => import("@/components/jersey/Jersey3D").then((m) => m.Jersey3D), {
  ssr: false,
  loading: () => <div className="flex h-full w-full items-center justify-center text-tuna-mist text-sm">3D model yükleniyor...</div>,
});

interface Design {
  id: string;
  designer_name: string;
  primary_color: string;
  secondary_color: string;
  tertiary_color?: string;
  pattern: Pattern;
  player_name?: string;
  player_number?: string;
  votes: number;
}

interface Sponsor {
  id: string;
  name: string;
  logo_url: string;
}

const PATTERNS: { value: Pattern; label: string }[] = [
  { value: "duz", label: "Düz" },
  { value: "cizgili", label: "Çizgili" },
  { value: "capraz", label: "Çapraz Bant" },
  { value: "parcali", label: "Parçalı" },
  { value: "geometrik", label: "Geometrik" },
  { value: "kamuflaj", label: "Kamuflaj" },
  { value: "gradient", label: "Gradient" },
];

const KIT_TYPES = [
  { value: "ev_sahibi", label: "Ev Sahibi" },
  { value: "deplasman", label: "Deplasman" },
  { value: "kaleci", label: "Kaleci" },
  { value: "antrenman", label: "Antrenman" },
];
const COLLAR_TYPES: { value: CollarType; label: string }[] = [
  { value: "bisiklet", label: "Bisiklet Yaka" },
  { value: "polo", label: "Polo Yaka" },
  { value: "v_yaka", label: "V Yaka" },
];
const SLEEVE_TYPES: { value: SleeveType; label: string }[] = [
  { value: "kisa", label: "Kısa Kol" },
  { value: "uzun", label: "Uzun Kol" },
];
const FABRICS: { value: Fabric; label: string }[] = [
  { value: "klasik", label: "Klasik" },
  { value: "mat", label: "Mat" },
  { value: "parlak", label: "Parlak" },
];
const TEXT_FONTS = ["sans-serif", "Georgia, serif", "'Courier New', monospace", "Impact, sans-serif"];
const TEXT_EFFECTS: { value: TextEffect; label: string }[] = [
  { value: "yok", label: "Yok" },
  { value: "kontur", label: "Kontur" },
  { value: "golge", label: "Gölge" },
  { value: "kabartma", label: "Kabartma" },
];

const DRAFT_KEY = "tuna_jersey_draft_v2";

function upsertLayer(
  layers: DesignLayer[],
  id: string,
  patch: Partial<DesignLayer> & Pick<DesignLayer, "kind" | "canvas">,
  initial: { x: number; y: number; scale: number; rotation: number }
): DesignLayer[] {
  const idx = layers.findIndex((l) => l.id === id);
  if (idx === -1) return [...layers, { id, x: initial.x, y: initial.y, scale: initial.scale, rotation: initial.rotation, ...patch }];
  const next = [...layers];
  next[idx] = { ...next[idx], ...patch };
  return next;
}
function removeLayer(layers: DesignLayer[], id: string): DesignLayer[] {
  return layers.filter((l) => l.id !== id);
}
function layerScale(layers: DesignLayer[], id: string, fallback: number): number {
  return layers.find((l) => l.id === id)?.scale ?? fallback;
}

export default function FormaTasarimPage() {
  const [primaryColor, setPrimaryColor] = useState("#FFD700");
  const [secondaryColor, setSecondaryColor] = useState("#111111");
  const [tertiaryColor, setTertiaryColor] = useState("#FFFFFF");
  const [pattern, setPattern] = useState<Pattern>("cizgili");
  const [kitType, setKitType] = useState("ev_sahibi");
  const [collarType, setCollarType] = useState<CollarType>("bisiklet");
  const [sleeveType, setSleeveType] = useState<SleeveType>("kisa");
  const [fabric, setFabric] = useState<Fabric>("klasik");
  const [shortsColor, setShortsColor] = useState("#111111");
  const [socksColor, setSocksColor] = useState("#FFD700");
  const [designerName, setDesignerName] = useState("");
  const [playerName, setPlayerName] = useState("");
  const [playerNumber, setPlayerNumber] = useState("");
  const [textColor, setTextColor] = useState("#FFFFFF");
  const [textFont, setTextFont] = useState(TEXT_FONTS[0]);
  const [textEffect, setTextEffect] = useState<TextEffect>("kontur");
  const [layers, setLayers] = useState<DesignLayer[]>([]);
  const [sponsorId, setSponsorId] = useState("");
  const [sponsors, setSponsors] = useState<Sponsor[]>([]);
  const [view, setView] = useState<JerseyView>("free");
  const [hiRes, setHiRes] = useState(true);

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [gallery, setGallery] = useState<Design[]>([]);
  const [votedIds, setVotedIds] = useState<Set<string>>(new Set());

  const [frontCanvas, setFrontCanvas] = useState<HTMLCanvasElement | null>(null);
  const [backCanvas, setBackCanvas] = useState<HTMLCanvasElement | null>(null);
  const [sleeveCanvas, setSleeveCanvas] = useState<HTMLCanvasElement | null>(null);
  const [shortsCanvas, setShortsCanvas] = useState<HTMLCanvasElement | null>(null);
  const [glCanvas, setGlCanvas] = useState<HTMLCanvasElement | null>(null);
  const [glRenderer, setGlRenderer] = useState<THREE.WebGLRenderer | null>(null);

  const sponsorLogoUrl = sponsors.find((s) => s.id === sponsorId)?.logo_url ?? null;

  async function loadGallery() {
    const res = await fetch("/api/jersey-designs");
    const data = await res.json();
    setGallery(data.data ?? []);
  }
  useEffect(() => {
    loadGallery();
    fetch("/api/sponsors-public").then((r) => r.json()).then((d) => setSponsors(d.data ?? []));
    try {
      const saved = localStorage.getItem(DRAFT_KEY);
      if (saved) {
        const d = JSON.parse(saved);
        setPrimaryColor(d.primaryColor ?? "#FFD700");
        setSecondaryColor(d.secondaryColor ?? "#111111");
        setTertiaryColor(d.tertiaryColor ?? "#FFFFFF");
        setPattern(d.pattern ?? "cizgili");
        setKitType(d.kitType ?? "ev_sahibi");
        setCollarType(d.collarType ?? "bisiklet");
        setSleeveType(d.sleeveType ?? "kisa");
        setFabric(d.fabric ?? "klasik");
        setShortsColor(d.shortsColor ?? "#111111");
        setSocksColor(d.socksColor ?? "#FFD700");
        setPlayerName(d.playerName ?? "");
        setPlayerNumber(d.playerNumber ?? "");
        setTextColor(d.textColor ?? "#FFFFFF");
        setTextFont(d.textFont ?? TEXT_FONTS[0]);
        setTextEffect(d.textEffect ?? "kontur");
        setLayers(d.layers ?? []);
        setSponsorId(d.sponsorId ?? "");
      }
    } catch {}
  }, []);

  useEffect(() => {
    const draft = { primaryColor, secondaryColor, tertiaryColor, pattern, kitType, collarType, sleeveType, fabric, shortsColor, socksColor, playerName, playerNumber, textColor, textFont, textEffect, layers, sponsorId };
    localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
  }, [primaryColor, secondaryColor, tertiaryColor, pattern, kitType, collarType, sleeveType, fabric, shortsColor, socksColor, playerName, playerNumber, textColor, textFont, textEffect, layers, sponsorId]);

  // Kulüp logosu her zaman ön kalıpta bir katman olarak bulunur.
  useEffect(() => {
    setLayers((prev) => upsertLayer(prev, "auto-logo", { kind: "logo", canvas: "front", imageUrl: "/images/logo.png" }, { x: 30, y: 22, scale: 1, rotation: 0 }));
  }, []);

  useEffect(() => {
    setLayers((prev) =>
      sponsorLogoUrl
        ? upsertLayer(prev, "auto-sponsor", { kind: "sponsor", canvas: "front", imageUrl: sponsorLogoUrl }, { x: 50, y: 45, scale: 1, rotation: 0 })
        : removeLayer(prev, "auto-sponsor")
    );
  }, [sponsorLogoUrl]);

  useEffect(() => {
    setLayers((prev) =>
      playerName
        ? upsertLayer(prev, "auto-name", { kind: "text", canvas: "back", text: playerName.toUpperCase(), color: textColor, font: textFont, effect: textEffect }, { x: 50, y: 15, scale: 1, rotation: 0 })
        : removeLayer(prev, "auto-name")
    );
  }, [playerName, textColor, textFont, textEffect]);

  useEffect(() => {
    setLayers((prev) =>
      playerNumber
        ? upsertLayer(prev, "auto-number", { kind: "text", canvas: "back", text: playerNumber, color: textColor, font: textFont, effect: textEffect }, { x: 50, y: 52, scale: 2.4, rotation: 0 })
        : removeLayer(prev, "auto-number")
    );
  }, [playerNumber, textColor, textFont, textEffect]);

  function applyPalette(p: (typeof COLOR_PALETTES)[number]) {
    setPrimaryColor(p.primary);
    setSecondaryColor(p.secondary);
    setTertiaryColor(p.tertiary);
  }

  function applyTemplate(t: (typeof JERSEY_TEMPLATES)[number]) {
    setPattern(t.pattern);
    setPrimaryColor(t.primary);
    setSecondaryColor(t.secondary);
    setTertiaryColor(t.tertiary);
    setCollarType(t.collarType);
    setSleeveType(t.sleeveType);
    setFabric(t.fabric);
  }

  const handleCanvasesReady = useCallback((c: { front: HTMLCanvasElement; back: HTMLCanvasElement; sleeve: HTMLCanvasElement; shorts: HTMLCanvasElement }) => {
    setFrontCanvas(c.front);
    setBackCanvas(c.back);
    setSleeveCanvas(c.sleeve);
    setShortsCanvas(c.shorts);
  }, []);

  const handleGlReady = useCallback((canvas: HTMLCanvasElement, renderer: THREE.WebGLRenderer) => {
    setGlCanvas(canvas);
    setGlRenderer(renderer);
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setSubmitError(null);
    const res = await fetch("/api/jersey-designs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        designer_name: designerName,
        primary_color: primaryColor,
        secondary_color: secondaryColor,
        tertiary_color: tertiaryColor,
        pattern,
        player_name: playerName || undefined,
        player_number: playerNumber || undefined,
        kit_type: kitType,
        collar_type: collarType,
        sleeve_type: sleeveType,
        shorts_color: shortsColor,
        socks_color: socksColor,
        fabric,
        sponsor_logo_url: sponsorLogoUrl || undefined,
        text_color: textColor,
        text_font: textFont,
        text_effect: textEffect,
        design_layout: layers,
      }),
    });
    setSubmitting(false);
    const data = await res.json();
    if (!res.ok) {
      setSubmitError(data.error ?? "Gönderilemedi.");
      return;
    }
    setSubmitted(true);
    localStorage.removeItem(DRAFT_KEY);
    setDesignerName("");
  }

  async function handleVote(id: string) {
    if (votedIds.has(id)) return;
    const res = await fetch("/api/jersey-designs/vote", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ designId: id }),
    });
    if (res.ok) {
      setVotedIds((prev) => new Set(prev).add(id));
      loadGallery();
    }
  }

  async function withHiResRender(fn: () => void) {
    if (!glRenderer) return;
    const originalPixelRatio = glRenderer.getPixelRatio();
    if (hiRes) {
      glRenderer.setPixelRatio(originalPixelRatio * 2.5);
      await new Promise((r) => setTimeout(r, 120)); // birkaç frame'in yeni çözünürlükte çizilmesini bekle
    }
    fn();
    if (hiRes) {
      glRenderer.setPixelRatio(originalPixelRatio);
    }
  }

  function exportPng() {
    if (!glCanvas) return;
    withHiResRender(() => {
      const link = document.createElement("a");
      link.download = "tunaspor-forma-tasarimi.png";
      link.href = glCanvas.toDataURL("image/png");
      link.click();
    });
  }

  function exportPdf() {
    if (!glCanvas) return;
    withHiResRender(() => {
      const png = glCanvas.toDataURL("image/png");
      const doc = new jsPDF({ orientation: "portrait", unit: "px", format: [glCanvas.width, glCanvas.height] });
      doc.addImage(png, "PNG", 0, 0, glCanvas.width, glCanvas.height);
      doc.save("tunaspor-forma-tasarimi.pdf");
    });
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-20">
      <p className="eyebrow mb-3">Taraftar Atölyesi</p>
      <h1 className="font-display text-4xl mb-2">Forma Tasarla</h1>
      <p className="text-tuna-mist max-w-2xl mb-12">
        Kendi Tunaspor 1954 forma tasarımını profesyonel 3D stüdyoda oluştur, gönder. Yönetici
        onayından sonra galeride yayınlanır ve diğer taraftarlar oy verebilir.
      </p>

      <div className="grid lg:grid-cols-[1.15fr_1fr] gap-10 mb-20">
        {/* 3D önizleme */}
        <div className="glass-panel p-4 flex flex-col gap-3">
          <div className="h-[28rem] rounded-xl overflow-hidden bg-gradient-to-b from-black/40 to-black/10">
            <Jersey3D
              frontCanvas={frontCanvas}
              backCanvas={backCanvas}
              sleeveCanvas={sleeveCanvas}
              shortsCanvas={shortsCanvas}
              secondaryColor={secondaryColor}
              shortsColor={shortsColor}
              socksColor={socksColor}
              collarType={collarType}
              sleeveType={sleeveType}
              fabric={fabric}
              view={view}
              onCanvasReady={handleGlReady}
            />
          </div>
          <div className="flex flex-wrap gap-2 justify-center">
            {(["front", "back", "right", "left", "free"] as const).map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => setView(v)}
                className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${view === v ? "border-tuna-gold text-tuna-gold bg-tuna-gold/10" : "border-white/15 text-white/70 hover:border-white/30"}`}
              >
                {v === "front" ? "Ön" : v === "back" ? "Arka" : v === "right" ? "Sağ Yan" : v === "left" ? "Sol Yan" : "Serbest (döndür)"}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <label className="flex items-center gap-1.5 text-xs text-tuna-mist">
              <input type="checkbox" checked={hiRes} onChange={(e) => setHiRes(e.target.checked)} />
              Yüksek çözünürlük
            </label>
            <button type="button" onClick={exportPng} className="text-xs border border-tuna-gold/40 text-tuna-gold px-3 py-1.5 rounded-full hover:bg-tuna-gold/10">
              PNG İndir
            </button>
            <button type="button" onClick={exportPdf} className="text-xs border border-tuna-gold/40 text-tuna-gold px-3 py-1.5 rounded-full hover:bg-tuna-gold/10">
              PDF İndir
            </button>
          </div>

          <JerseyDesignCanvas
            primaryColor={primaryColor}
            secondaryColor={secondaryColor}
            tertiaryColor={tertiaryColor}
            pattern={pattern}
            layers={layers}
            onLayersChange={setLayers}
            onCanvasesReady={handleCanvasesReady}
          />
        </div>

        {/* Kontroller */}
        <form onSubmit={handleSubmit} className="glass-panel p-6 space-y-4 max-h-[70rem] overflow-y-auto">
          {submitted ? (
            <div className="text-center py-8">
              <p className="text-tuna-gold font-display text-xl mb-2">Tasarımın gönderildi! 🎨</p>
              <p className="text-tuna-mist text-sm">
                Yönetici onayından sonra galeride görünecek. Yeni bir tasarım daha yapmak için
                aşağıdaki butona tıklayabilirsin.
              </p>
              <button onClick={() => setSubmitted(false)} className="mt-4 bg-tuna-gold text-tuna-black font-semibold px-6 py-2 rounded-lg">
                Yeni Tasarım Yap
              </button>
            </div>
          ) : (
            <>
              <label className="block">
                <span className="text-sm text-tuna-mist block mb-1">Hazır Şablonlar</span>
                <div className="flex gap-2 flex-wrap">
                  {JERSEY_TEMPLATES.map((t) => (
                    <button type="button" key={t.name} onClick={() => applyTemplate(t)}
                      className="px-3 py-1.5 rounded-full text-xs border border-white/15 text-white/80 hover:border-tuna-gold hover:text-tuna-gold transition-all">
                      {t.name}
                    </button>
                  ))}
                </div>
              </label>

              <label className="block">
                <span className="text-sm text-tuna-mist block mb-1">Renk Kütüphanesi</span>
                <div className="flex gap-2 flex-wrap">
                  {COLOR_PALETTES.map((p) => (
                    <button type="button" key={p.name} onClick={() => applyPalette(p)} title={p.name}
                      className="w-8 h-8 rounded-full border-2 border-white/20 hover:border-tuna-gold transition-all overflow-hidden flex">
                      <span className="w-1/2 h-full" style={{ background: p.primary }} />
                      <span className="w-1/2 h-full" style={{ background: p.secondary }} />
                    </button>
                  ))}
                </div>
              </label>

              <label className="block">
                <span className="text-sm text-tuna-mist block mb-1">Forma Türü</span>
                <div className="flex gap-2 flex-wrap">
                  {KIT_TYPES.map((k) => (
                    <button type="button" key={k.value} onClick={() => setKitType(k.value)}
                      className={`px-3 py-1.5 rounded-full text-xs border transition-all ${kitType === k.value ? "border-tuna-gold text-tuna-gold bg-tuna-gold/10" : "border-white/15 text-white/70 hover:border-white/30"}`}>
                      {k.label}
                    </button>
                  ))}
                </div>
              </label>

              <div className="grid grid-cols-3 gap-3">
                <label className="block">
                  <span className="text-xs text-tuna-mist block mb-1">Ana Renk</span>
                  <input type="color" value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} className="w-full h-10 rounded-lg cursor-pointer bg-transparent" />
                </label>
                <label className="block">
                  <span className="text-xs text-tuna-mist block mb-1">2. Renk</span>
                  <input type="color" value={secondaryColor} onChange={(e) => setSecondaryColor(e.target.value)} className="w-full h-10 rounded-lg cursor-pointer bg-transparent" />
                </label>
                <label className="block">
                  <span className="text-xs text-tuna-mist block mb-1">3. Renk</span>
                  <input type="color" value={tertiaryColor} onChange={(e) => setTertiaryColor(e.target.value)} className="w-full h-10 rounded-lg cursor-pointer bg-transparent" />
                </label>
                <label className="block">
                  <span className="text-xs text-tuna-mist block mb-1">Şort Rengi</span>
                  <input type="color" value={shortsColor} onChange={(e) => setShortsColor(e.target.value)} className="w-full h-10 rounded-lg cursor-pointer bg-transparent" />
                </label>
                <label className="block">
                  <span className="text-xs text-tuna-mist block mb-1">Çorap Rengi</span>
                  <input type="color" value={socksColor} onChange={(e) => setSocksColor(e.target.value)} className="w-full h-10 rounded-lg cursor-pointer bg-transparent" />
                </label>
              </div>

              <label className="block">
                <span className="text-sm text-tuna-mist block mb-1">Desen</span>
                <div className="flex gap-2 flex-wrap">
                  {PATTERNS.map((p) => (
                    <button type="button" key={p.value} onClick={() => setPattern(p.value)}
                      className={`px-3 py-2 rounded-full text-xs border transition-all ${pattern === p.value ? "border-tuna-gold text-tuna-gold bg-tuna-gold/10" : "border-white/15 text-white/70 hover:border-white/30"}`}>
                      {p.label}
                    </button>
                  ))}
                </div>
              </label>

              <div className="grid grid-cols-2 gap-4">
                <label className="block">
                  <span className="text-sm text-tuna-mist block mb-1">Yaka Tipi</span>
                  <select value={collarType} onChange={(e) => setCollarType(e.target.value as CollarType)} className="w-full bg-white/5 rounded-lg px-3 py-2 border border-white/10 outline-none focus:border-tuna-gold">
                    {COLLAR_TYPES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                  </select>
                </label>
                <label className="block">
                  <span className="text-sm text-tuna-mist block mb-1">Kol Tipi</span>
                  <select value={sleeveType} onChange={(e) => setSleeveType(e.target.value as SleeveType)} className="w-full bg-white/5 rounded-lg px-3 py-2 border border-white/10 outline-none focus:border-tuna-gold">
                    {SLEEVE_TYPES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                  </select>
                </label>
              </div>

              <label className="block">
                <span className="text-sm text-tuna-mist block mb-1">Kumaş Dokusu</span>
                <div className="flex gap-2 flex-wrap">
                  {FABRICS.map((f) => (
                    <button type="button" key={f.value} onClick={() => setFabric(f.value)}
                      className={`px-3 py-1.5 rounded-full text-xs border transition-all ${fabric === f.value ? "border-tuna-gold text-tuna-gold bg-tuna-gold/10" : "border-white/15 text-white/70 hover:border-white/30"}`}>
                      {f.label}
                    </button>
                  ))}
                </div>
              </label>

              <label className="block">
                <span className="text-sm text-tuna-mist block mb-1">Kulüp Logosu Boyutu</span>
                <input type="range" min={0.5} max={2} step={0.05} value={layerScale(layers, "auto-logo", 1)}
                  onChange={(e) => setLayers((prev) => prev.map((l) => (l.id === "auto-logo" ? { ...l, scale: parseFloat(e.target.value) } : l)))}
                  className="w-full accent-tuna-gold" />
              </label>

              {sponsors.length > 0 && (
                <>
                  <label className="block">
                    <span className="text-sm text-tuna-mist block mb-1">Sponsor Logosu (opsiyonel)</span>
                    <select value={sponsorId} onChange={(e) => setSponsorId(e.target.value)} className="w-full bg-white/5 rounded-lg px-3 py-2 border border-white/10 outline-none focus:border-tuna-gold">
                      <option value="">Yok</option>
                      {sponsors.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                  </label>
                  {sponsorId && (
                    <label className="block">
                      <span className="text-sm text-tuna-mist block mb-1">Sponsor Logosu Boyutu</span>
                      <input type="range" min={0.5} max={2} step={0.05} value={layerScale(layers, "auto-sponsor", 1)}
                        onChange={(e) => setLayers((prev) => prev.map((l) => (l.id === "auto-sponsor" ? { ...l, scale: parseFloat(e.target.value) } : l)))}
                        className="w-full accent-tuna-gold" />
                    </label>
                  )}
                </>
              )}

              <div className="grid grid-cols-2 gap-4">
                <label className="block">
                  <span className="text-sm text-tuna-mist block mb-1">Sırt İsmi (opsiyonel)</span>
                  <input maxLength={12} value={playerName} onChange={(e) => setPlayerName(e.target.value)} className="w-full bg-white/5 rounded-lg px-3 py-2 border border-white/10 outline-none focus:border-tuna-gold" />
                </label>
                <label className="block">
                  <span className="text-sm text-tuna-mist block mb-1">Numara (opsiyonel)</span>
                  <input maxLength={2} inputMode="numeric" value={playerNumber} onChange={(e) => setPlayerNumber(e.target.value.replace(/\D/g, ""))} className="w-full bg-white/5 rounded-lg px-3 py-2 border border-white/10 outline-none focus:border-tuna-gold" />
                </label>
              </div>

              {(playerName || playerNumber) && (
                <div className="grid grid-cols-2 gap-3">
                  <label className="block">
                    <span className="text-xs text-tuna-mist block mb-1">Yazı Rengi</span>
                    <input type="color" value={textColor} onChange={(e) => setTextColor(e.target.value)} className="w-full h-9 rounded-lg cursor-pointer bg-transparent" />
                  </label>
                  <label className="block">
                    <span className="text-xs text-tuna-mist block mb-1">Yazı Tipi</span>
                    <select value={textFont} onChange={(e) => setTextFont(e.target.value)} className="w-full bg-white/5 rounded-lg px-2 py-2 text-xs border border-white/10 outline-none focus:border-tuna-gold">
                      {TEXT_FONTS.map((f) => <option key={f} value={f} style={{ fontFamily: f }}>{f.split(",")[0].replace(/'/g, "")}</option>)}
                    </select>
                  </label>
                  <label className="block col-span-2">
                    <span className="text-xs text-tuna-mist block mb-1">Yazı Efekti</span>
                    <div className="flex gap-2 flex-wrap">
                      {TEXT_EFFECTS.map((e) => (
                        <button type="button" key={e.value} onClick={() => setTextEffect(e.value)}
                          className={`px-3 py-1 rounded-full text-xs border transition-all ${textEffect === e.value ? "border-tuna-gold text-tuna-gold bg-tuna-gold/10" : "border-white/15 text-white/70 hover:border-white/30"}`}>
                          {e.label}
                        </button>
                      ))}
                    </div>
                  </label>
                </div>
              )}

              <label className="block">
                <span className="text-sm text-tuna-mist block mb-1">Adın / Rumuzun</span>
                <input required minLength={2} maxLength={60} value={designerName} onChange={(e) => setDesignerName(e.target.value)} placeholder="Tasarımın altında görünecek" className="w-full bg-white/5 rounded-lg px-3 py-2 border border-white/10 outline-none focus:border-tuna-gold" />
              </label>

              {submitError && <p className="text-red-400 text-sm">{submitError}</p>}

              <button disabled={submitting} className="w-full bg-tuna-gold text-tuna-black font-semibold px-6 py-3 rounded-lg disabled:opacity-50">
                {submitting ? "Gönderiliyor..." : "Tasarımı Gönder"}
              </button>
            </>
          )}
        </form>
      </div>

      {/* Galeri */}
      <section>
        <h2 className="font-display text-2xl mb-6">Taraftar Galerisi — En Çok Beğenilenler</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {gallery.map((d) => (
            <div key={d.id} className="glass-panel p-4 text-center">
              <JerseyPreview
                primaryColor={d.primary_color}
                secondaryColor={d.secondary_color}
                tertiaryColor={d.tertiary_color}
                pattern={d.pattern}
                playerName={d.player_name}
                playerNumber={d.player_number}
                className="w-full h-32 mb-3"
              />
              <p className="text-sm font-medium">{d.designer_name}</p>
              <button
                onClick={() => handleVote(d.id)}
                disabled={votedIds.has(d.id)}
                className="mt-2 text-xs border border-tuna-gold/30 text-tuna-gold px-3 py-1 rounded-full hover:bg-tuna-gold/10 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {votedIds.has(d.id) ? "✓ Oy Verildi" : "👍 Beğen"} ({d.votes})
              </button>
            </div>
          ))}
          {!gallery.length && (
            <p className="text-tuna-mist col-span-full">Henüz onaylanmış tasarım yok — ilk sen ol!</p>
          )}
        </div>
      </section>
    </div>
  );
}
