"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const CATEGORIES = [
  { value: "", label: "Tüm Kategoriler" },
  { value: "a_takim", label: "A Takım" },
  { value: "u18", label: "U18" }, { value: "u17", label: "U17" },
  { value: "u16", label: "U16" }, { value: "u15", label: "U15" },
  { value: "kadin_takimi", label: "Kadın Futbol Takımı" },
];
// Not: U9-U14 arası genç akademi kategorileri scout panelinde kasıtlı olarak
// gösterilmiyor (çocuk güvenliği kararı — bkz. /api/scout/players).

export default function ScoutPanelPage() {
  const router = useRouter();
  const [players, setPlayers] = useState<any[]>([]);
  const [videos, setVideos] = useState<any[]>([]);
  const [watchlist, setWatchlist] = useState<any[]>([]);
  const [category, setCategory] = useState("");
  const [position, setPosition] = useState("");
  const [selectedPlayer, setSelectedPlayer] = useState<any | null>(null);
  const [contactMessage, setContactMessage] = useState("");
  const [contactSent, setContactSent] = useState(false);
  const [loading, setLoading] = useState(true);

  async function loadPlayers() {
    const params = new URLSearchParams();
    if (category) params.set("category", category);
    if (position) params.set("position", position);
    const res = await fetch(`/api/scout/players?${params}`);
    if (res.status === 401) {
      router.push("/scout/giris");
      return;
    }
    const data = await res.json();
    setPlayers(data.data ?? []);
    setVideos(data.videos ?? []);
    setLoading(false);
  }

  async function loadWatchlist() {
    const res = await fetch("/api/scout/watchlist");
    const data = await res.json();
    setWatchlist(data.data ?? []);
  }

  useEffect(() => {
    loadPlayers();
    loadWatchlist();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category, position]);

  const watchlistIds = new Set(watchlist.map((w) => w.players?.id));

  async function toggleWatchlist(playerId: string) {
    if (watchlistIds.has(playerId)) {
      await fetch(`/api/scout/watchlist?playerId=${playerId}`, { method: "DELETE" });
    } else {
      await fetch("/api/scout/watchlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerId }),
      });
    }
    loadWatchlist();
  }

  async function handleContact(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedPlayer) return;
    const res = await fetch("/api/scout/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ playerId: selectedPlayer.id, message: contactMessage }),
    });
    if (res.ok) {
      setContactSent(true);
      setContactMessage("");
    }
  }

  async function handleLogout() {
    await fetch("/api/scout/auth/logout", { method: "POST" });
    router.push("/scout/giris");
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-16">
      <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
        <h1 className="font-display text-3xl">Scout Paneli</h1>
        <button onClick={handleLogout} className="text-sm text-tuna-mist hover:text-white border border-white/15 rounded-full px-4 py-2">
          Çıkış Yap
        </button>
      </div>

      {/* Filtreler */}
      <div className="flex gap-3 mb-8 flex-wrap">
        <select value={category} onChange={(e) => setCategory(e.target.value)}
          className="bg-white/5 rounded-lg px-3 py-2 border border-white/10 outline-none focus:border-tuna-gold">
          {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
        </select>
        <input
          placeholder="Mevki ara (örn. forvet)"
          value={position}
          onChange={(e) => setPosition(e.target.value)}
          className="bg-white/5 rounded-lg px-3 py-2 border border-white/10 outline-none focus:border-tuna-gold"
        />
      </div>

      <div className="grid lg:grid-cols-[1fr_320px] gap-8">
        {/* Oyuncu listesi */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {players.map((p) => (
            <div key={p.id} className="glass-panel p-4 text-center">
              {p.photo_url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={p.photo_url} alt={p.full_name} className="w-16 h-16 rounded-full object-cover mx-auto mb-2" />
              )}
              <p className="font-medium text-sm">{p.full_name}</p>
              <p className="text-xs text-tuna-mist mb-2">{p.teams?.display_name} · {p.position}</p>
              <div className="flex gap-1 justify-center">
                <button
                  onClick={() => { setSelectedPlayer(p); setContactSent(false); }}
                  className="text-xs border border-tuna-gold/30 text-tuna-gold px-2 py-1 rounded-full"
                >
                  Detay
                </button>
                <button
                  onClick={() => toggleWatchlist(p.id)}
                  className={`text-xs px-2 py-1 rounded-full border ${
                    watchlistIds.has(p.id) ? "border-tuna-gold bg-tuna-gold/10 text-tuna-gold" : "border-white/20 text-white/60"
                  }`}
                >
                  {watchlistIds.has(p.id) ? "★ Listede" : "☆ Listeye Ekle"}
                </button>
              </div>
            </div>
          ))}
          {!loading && !players.length && <p className="text-tuna-mist col-span-full">Bu filtrelerde oyuncu bulunamadı.</p>}
        </div>

        {/* İzleme listesi */}
        <div className="glass-panel p-5 h-fit">
          <h2 className="font-display text-lg mb-4">İzleme Listem ({watchlist.length})</h2>
          <div className="space-y-2">
            {watchlist.map((w) => (
              <div key={w.id} className="text-sm flex items-center justify-between border-b border-white/10 pb-2">
                <span>{w.players?.full_name}</span>
                <button onClick={() => toggleWatchlist(w.players?.id)} className="text-red-400 text-xs">Çıkar</button>
              </div>
            ))}
            {!watchlist.length && <p className="text-tuna-mist text-sm">Henüz boş.</p>}
          </div>
        </div>
      </div>

      {/* Oyuncu detay + video + iletişim modal */}
      {selectedPlayer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="glass-panel max-w-lg w-full p-6 max-h-[85vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="font-display text-xl">{selectedPlayer.full_name}</h2>
                <p className="text-sm text-tuna-mist">
                  {selectedPlayer.teams?.display_name} · {selectedPlayer.position} · Forma No: {selectedPlayer.jersey_number ?? "-"}
                </p>
              </div>
              <button onClick={() => setSelectedPlayer(null)} className="text-white/60 hover:text-white">✕</button>
            </div>

            <div className="grid grid-cols-2 gap-2 text-sm mb-6">
              <p><span className="text-tuna-mist">Doğum:</span> {selectedPlayer.birth_date ?? "-"}</p>
              <p><span className="text-tuna-mist">Boy/Kilo:</span> {selectedPlayer.height_cm ?? "-"}cm / {selectedPlayer.weight_kg ?? "-"}kg</p>
              <p><span className="text-tuna-mist">Uyruk:</span> {selectedPlayer.nationality}</p>
            </div>

            {/* İlgili videolar */}
            {videos.filter((v) => v.team_id === selectedPlayer.team_id).slice(0, 2).map((v) => (
              <div key={v.id} className="aspect-video mb-4 rounded-lg overflow-hidden">
                <iframe className="w-full h-full" src={`https://www.youtube.com/embed/${v.youtube_id}`} title={v.title} allowFullScreen />
              </div>
            ))}

            {/* İletişim */}
            {contactSent ? (
              <p className="text-tuna-gold text-sm">Talebin kulübe iletildi, seninle iletişime geçilecek. ✓</p>
            ) : (
              <form onSubmit={handleContact} className="space-y-2">
                <textarea
                  required
                  minLength={5}
                  placeholder="Kulübe iletmek istediğin mesaj..."
                  value={contactMessage}
                  onChange={(e) => setContactMessage(e.target.value)}
                  rows={3}
                  className="w-full bg-white/5 rounded-lg px-3 py-2 border border-white/10 outline-none focus:border-tuna-gold"
                />
                <button className="w-full bg-tuna-gold text-tuna-black font-semibold px-4 py-2 rounded-lg text-sm">
                  Kulübe İlet
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
