"use client";

import { useEffect, useState } from "react";
import { JerseyPreview } from "@/components/jersey/JerseyPreview";

interface Design {
  id: string;
  designer_name: string;
  primary_color: string;
  secondary_color: string;
  pattern: "duz" | "cizgili" | "capraz";
  player_name?: string;
  player_number?: string;
  votes: number;
}

const PATTERNS: { value: Design["pattern"]; label: string }[] = [
  { value: "duz", label: "Düz Kenar" },
  { value: "cizgili", label: "Çizgili" },
  { value: "capraz", label: "Çapraz Bant" },
];

export default function FormaTasarimPage() {
  const [primaryColor, setPrimaryColor] = useState("#FFD700");
  const [secondaryColor, setSecondaryColor] = useState("#111111");
  const [pattern, setPattern] = useState<Design["pattern"]>("cizgili");
  const [designerName, setDesignerName] = useState("");
  const [playerName, setPlayerName] = useState("");
  const [playerNumber, setPlayerNumber] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const [gallery, setGallery] = useState<Design[]>([]);
  const [votedIds, setVotedIds] = useState<Set<string>>(new Set());

  async function loadGallery() {
    const res = await fetch("/api/jersey-designs");
    const data = await res.json();
    setGallery(data.data ?? []);
  }
  useEffect(() => {
    loadGallery();
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
        pattern,
        player_name: playerName || undefined,
        player_number: playerNumber || undefined,
      }),
    });
    setSubmitting(false);
    const data = await res.json();
    if (!res.ok) {
      setSubmitError(data.error ?? "Gönderilemedi.");
      return;
    }
    setSubmitted(true);
    setDesignerName("");
    setPlayerName("");
    setPlayerNumber("");
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

  return (
    <div className="max-w-6xl mx-auto px-4 py-20">
      <p className="eyebrow mb-3">Taraftar Atölyesi</p>
      <h1 className="font-display text-4xl mb-2">Forma Tasarla</h1>
      <p className="text-tuna-mist max-w-2xl mb-12">
        Kendi sarı-siyah Tunaspor 1954 forma tasarımını yap, gönder. Yönetici onayından sonra
        galeride yayınlanır ve diğer taraftarlar oy verebilir.
      </p>

      <div className="grid lg:grid-cols-[1fr_1.2fr] gap-10 mb-20">
        {/* Canlı önizleme */}
        <div className="glass-panel p-8 flex items-center justify-center">
          <JerseyPreview
            primaryColor={primaryColor}
            secondaryColor={secondaryColor}
            pattern={pattern}
            playerName={playerName}
            playerNumber={playerNumber}
            className="w-64 h-64"
          />
        </div>

        {/* Kontroller */}
        <form onSubmit={handleSubmit} className="glass-panel p-6 space-y-4">
          {submitted ? (
            <div className="text-center py-8">
              <p className="text-tuna-gold font-display text-xl mb-2">Tasarımın gönderildi! 🎨</p>
              <p className="text-tuna-mist text-sm">
                Yönetici onayından sonra galeride görünecek. Yeni bir tasarım daha yapmak için
                aşağıdaki butona tıklayabilirsin.
              </p>
              <button
                onClick={() => setSubmitted(false)}
                className="mt-4 bg-tuna-gold text-tuna-black font-semibold px-6 py-2 rounded-lg"
              >
                Yeni Tasarım Yap
              </button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-4">
                <label className="block">
                  <span className="text-sm text-tuna-mist block mb-1">Ana Renk</span>
                  <input
                    type="color"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="w-full h-12 rounded-lg cursor-pointer bg-transparent"
                  />
                </label>
                <label className="block">
                  <span className="text-sm text-tuna-mist block mb-1">Desen Rengi</span>
                  <input
                    type="color"
                    value={secondaryColor}
                    onChange={(e) => setSecondaryColor(e.target.value)}
                    className="w-full h-12 rounded-lg cursor-pointer bg-transparent"
                  />
                </label>
              </div>

              <label className="block">
                <span className="text-sm text-tuna-mist block mb-1">Desen</span>
                <div className="flex gap-2 flex-wrap">
                  {PATTERNS.map((p) => (
                    <button
                      type="button"
                      key={p.value}
                      onClick={() => setPattern(p.value)}
                      className={`px-4 py-2 rounded-full text-sm border transition-all ${
                        pattern === p.value
                          ? "border-tuna-gold text-tuna-gold bg-tuna-gold/10"
                          : "border-white/15 text-white/70 hover:border-white/30"
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </label>

              <div className="grid grid-cols-2 gap-4">
                <label className="block">
                  <span className="text-sm text-tuna-mist block mb-1">Sırt İsmi (opsiyonel)</span>
                  <input
                    maxLength={12}
                    value={playerName}
                    onChange={(e) => setPlayerName(e.target.value)}
                    className="w-full bg-white/5 rounded-lg px-3 py-2 border border-white/10 outline-none focus:border-tuna-gold"
                  />
                </label>
                <label className="block">
                  <span className="text-sm text-tuna-mist block mb-1">Numara (opsiyonel)</span>
                  <input
                    maxLength={2}
                    inputMode="numeric"
                    value={playerNumber}
                    onChange={(e) => setPlayerNumber(e.target.value.replace(/\D/g, ""))}
                    className="w-full bg-white/5 rounded-lg px-3 py-2 border border-white/10 outline-none focus:border-tuna-gold"
                  />
                </label>
              </div>

              <label className="block">
                <span className="text-sm text-tuna-mist block mb-1">Adın / Rumuzun</span>
                <input
                  required
                  minLength={2}
                  maxLength={60}
                  value={designerName}
                  onChange={(e) => setDesignerName(e.target.value)}
                  placeholder="Tasarımın altında görünecek"
                  className="w-full bg-white/5 rounded-lg px-3 py-2 border border-white/10 outline-none focus:border-tuna-gold"
                />
              </label>

              {submitError && <p className="text-red-400 text-sm">{submitError}</p>}

              <button
                disabled={submitting}
                className="w-full bg-tuna-gold text-tuna-black font-semibold px-6 py-3 rounded-lg disabled:opacity-50"
              >
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
