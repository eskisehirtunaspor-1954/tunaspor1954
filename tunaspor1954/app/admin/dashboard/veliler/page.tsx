"use client";

import { useEffect, useState } from "react";

interface Player {
  id: string;
  full_name: string;
}
interface ParentRow {
  id: string;
  email: string;
  full_name: string;
  phone?: string;
  is_active: boolean;
  children: string[];
}

export default function VelilerPage() {
  const [parents, setParents] = useState<ParentRow[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [form, setForm] = useState({ email: "", password: "", full_name: "", phone: "" });
  const [selectedPlayers, setSelectedPlayers] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function load() {
    const [parentsRes, playersRes] = await Promise.all([
      fetch("/api/admin/parent-accounts"),
      fetch("/api/admin/players"),
    ]);
    const parentsData = await parentsRes.json();
    const playersData = await playersRes.json();
    setParents(parentsData.data ?? []);
    setPlayers((playersData.data ?? []).map((p: any) => ({ id: p.id, full_name: p.full_name })));
  }
  useEffect(() => {
    load();
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const res = await fetch("/api/admin/parent-accounts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, player_ids: selectedPlayers }),
    });
    setSaving(false);
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Oluşturulamadı.");
      return;
    }
    setForm({ email: "", password: "", full_name: "", phone: "" });
    setSelectedPlayers([]);
    load();
  }

  async function toggleActive(p: ParentRow) {
    await fetch("/api/admin/parent-accounts", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: p.id, is_active: !p.is_active }),
    });
    load();
  }

  return (
    <div className="min-h-screen px-4 py-10 max-w-3xl mx-auto">
      <h1 className="font-display text-3xl text-tuna-yellow mb-2">Veli Hesapları</h1>
      <p className="text-sm text-tuna-mist mb-8">
        Veli hesapları ve çocuk eşleştirmesi yalnızca buradan, süper yönetici tarafından
        yapılabilir. Veliler kendi kendine kayıt olamaz.
      </p>

      <form onSubmit={handleCreate} className="glass-panel p-6 space-y-3 mb-10">
        <h2 className="font-semibold mb-2">Yeni Veli Hesabı</h2>
        {error && <p className="text-red-400 text-sm">{error}</p>}
        <input required placeholder="Ad Soyad" value={form.full_name}
          onChange={(e) => setForm({ ...form, full_name: e.target.value })}
          className="w-full bg-white/5 rounded-lg px-3 py-2 border border-white/10 outline-none focus:border-tuna-yellow" />
        <input required type="email" placeholder="E-posta" value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          className="w-full bg-white/5 rounded-lg px-3 py-2 border border-white/10 outline-none focus:border-tuna-yellow" />
        <input placeholder="Telefon (opsiyonel)" value={form.phone}
          onChange={(e) => setForm({ ...form, phone: e.target.value })}
          className="w-full bg-white/5 rounded-lg px-3 py-2 border border-white/10 outline-none focus:border-tuna-yellow" />
        <input required type="password" placeholder="Geçici Şifre (en az 10 karakter)" value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          className="w-full bg-white/5 rounded-lg px-3 py-2 border border-white/10 outline-none focus:border-tuna-yellow" />

        <div>
          <span className="text-sm text-tuna-mist block mb-2">Bağlanacak Çocuk(lar)</span>
          <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto">
            {players.map((pl) => (
              <button
                type="button"
                key={pl.id}
                onClick={() =>
                  setSelectedPlayers((prev) =>
                    prev.includes(pl.id) ? prev.filter((id) => id !== pl.id) : [...prev, pl.id]
                  )
                }
                className={`px-3 py-1.5 rounded-full text-sm border transition-all ${
                  selectedPlayers.includes(pl.id)
                    ? "border-tuna-yellow text-tuna-yellow bg-tuna-yellow/10"
                    : "border-white/15 text-white/70"
                }`}
              >
                {pl.full_name}
              </button>
            ))}
            {!players.length && <p className="text-tuna-mist text-sm">Önce Takımlar bölümünden oyuncu ekle.</p>}
          </div>
        </div>

        <button disabled={saving || !selectedPlayers.length} className="bg-tuna-yellow text-tuna-black font-semibold px-6 py-2 rounded-lg disabled:opacity-50">
          {saving ? "Oluşturuluyor..." : "Veli Hesabı Oluştur"}
        </button>
      </form>

      <h2 className="font-semibold mb-4">Mevcut Veliler</h2>
      <div className="space-y-2">
        {parents.map((p) => (
          <div key={p.id} className="glass-panel p-4 flex items-center justify-between flex-wrap gap-2">
            <div>
              <p className="font-medium">{p.full_name}</p>
              <p className="text-xs text-tuna-mist">{p.email} — {p.children.join(", ") || "çocuk bağlanmadı"}</p>
            </div>
            <button onClick={() => toggleActive(p)} className={`text-sm ${p.is_active ? "text-red-400" : "text-tuna-yellow"}`}>
              {p.is_active ? "Pasifleştir" : "Aktifleştir"}
            </button>
          </div>
        ))}
        {!parents.length && <p className="text-tuna-mist">Henüz veli hesabı oluşturulmadı.</p>}
      </div>
    </div>
  );
}
