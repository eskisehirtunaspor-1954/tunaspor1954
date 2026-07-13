"use client";

import { useEffect, useState } from "react";

interface Team {
  id: string;
  display_name: string;
}
interface CoachRow {
  id: string;
  email: string;
  full_name: string;
  phone?: string;
  is_active: boolean;
  teams: string[];
}

export default function AntrenorlerPage() {
  const [coaches, setCoaches] = useState<CoachRow[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [form, setForm] = useState({ email: "", password: "", full_name: "", phone: "" });
  const [selectedTeams, setSelectedTeams] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function load() {
    const [coachesRes, teamsRes] = await Promise.all([
      fetch("/api/admin/coach-accounts"),
      fetch("/api/admin/teams"),
    ]);
    const coachesData = await coachesRes.json();
    const teamsData = await teamsRes.json();
    setCoaches(coachesData.data ?? []);
    setTeams((teamsData.data ?? []).map((t: any) => ({ id: t.id, display_name: t.display_name })));
  }
  useEffect(() => {
    load();
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const res = await fetch("/api/admin/coach-accounts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, team_ids: selectedTeams }),
    });
    setSaving(false);
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Oluşturulamadı.");
      return;
    }
    setForm({ email: "", password: "", full_name: "", phone: "" });
    setSelectedTeams([]);
    load();
  }

  async function toggleActive(c: CoachRow) {
    await fetch("/api/admin/coach-accounts", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: c.id, is_active: !c.is_active }),
    });
    load();
  }

  return (
    <div className="min-h-screen px-4 py-10 max-w-3xl mx-auto">
      <h1 className="font-display text-3xl text-tuna-yellow mb-2">Antrenör Hesapları</h1>
      <p className="text-sm text-tuna-mist mb-8">
        Antrenör hesapları ve takım/kategori ataması yalnızca buradan, süper admin
        tarafından yapılabilir. Antrenörler kendi paneline (/antrenor/giris) bu
        hesapla giriş yapar — bu panel (admin) ile antrenör paneli tamamen ayrı
        oturum sistemleridir, süper admin dahil hiç kimse antrenör paneline
        admin girişiyle giremez.
      </p>

      <form onSubmit={handleCreate} className="glass-panel p-6 space-y-3 mb-10">
        <h2 className="font-semibold mb-2">Yeni Antrenör Hesabı</h2>
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
          <span className="text-sm text-tuna-mist block mb-2">Atanacak Takım/Kategori(ler)</span>
          <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto">
            {teams.map((t) => (
              <button
                type="button"
                key={t.id}
                onClick={() =>
                  setSelectedTeams((prev) =>
                    prev.includes(t.id) ? prev.filter((id) => id !== t.id) : [...prev, t.id]
                  )
                }
                className={`px-3 py-1.5 rounded-full text-sm border transition-all ${
                  selectedTeams.includes(t.id)
                    ? "border-tuna-yellow text-tuna-yellow bg-tuna-yellow/10"
                    : "border-white/15 text-white/70"
                }`}
              >
                {t.display_name}
              </button>
            ))}
            {!teams.length && <p className="text-tuna-mist text-sm">Önce Takımlar bölümünden kategori ekle.</p>}
          </div>
        </div>

        <button disabled={saving || !selectedTeams.length} className="bg-tuna-yellow text-tuna-black font-semibold px-6 py-2 rounded-lg disabled:opacity-50">
          {saving ? "Oluşturuluyor..." : "Antrenör Hesabı Oluştur"}
        </button>
      </form>

      <h2 className="font-semibold mb-4">Mevcut Antrenörler</h2>
      <div className="space-y-2">
        {coaches.map((c) => (
          <div key={c.id} className="glass-panel p-4 flex items-center justify-between flex-wrap gap-2">
            <div>
              <p className="font-medium">{c.full_name}</p>
              <p className="text-xs text-tuna-mist">{c.email} — {c.teams.join(", ") || "takım atanmadı"}</p>
            </div>
            <button onClick={() => toggleActive(c)} className={`text-sm ${c.is_active ? "text-red-400" : "text-tuna-yellow"}`}>
              {c.is_active ? "Pasifleştir" : "Aktifleştir"}
            </button>
          </div>
        ))}
        {!coaches.length && <p className="text-tuna-mist">Henüz antrenör hesabı oluşturulmadı.</p>}
      </div>
    </div>
  );
}
