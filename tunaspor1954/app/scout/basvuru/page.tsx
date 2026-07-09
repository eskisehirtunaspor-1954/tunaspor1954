"use client";

import { useState } from "react";

export default function ScoutBasvuruPage() {
  const [form, setForm] = useState({ club_name: "", contact_name: "", email: "", password: "", phone: "" });
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const res = await fetch("/api/scout/apply", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setLoading(false);
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Başvuru gönderilemedi.");
      return;
    }
    setDone(true);
  }

  if (done) {
    return (
      <div className="max-w-md mx-auto px-4 py-24 text-center">
        <p className="font-display text-2xl text-tuna-gold mb-4">Başvurun alındı! 🔍</p>
        <p className="text-tuna-mist">
          Kulüp ekibimiz başvurunu inceleyip onayladıktan sonra e-posta adresine bilgi
          verilecek. Onaylandıktan sonra <a href="/scout/giris" className="text-tuna-gold underline">giriş sayfasından</a> erişebilirsin.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto px-4 py-24">
      <p className="eyebrow mb-3 text-center">Tunaspor 1954</p>
      <h1 className="font-display text-3xl mb-2 text-center">Scout Başvurusu</h1>
      <p className="text-tuna-mist text-sm text-center mb-8">
        Kulübünüz adına oyuncu takip etmek için başvurun. Başvurular kulüp tarafından
        incelenip onaylanır.
      </p>

      <form onSubmit={handleSubmit} className="glass-panel p-6 space-y-3">
        <input required placeholder="Kulüp Adı" value={form.club_name}
          onChange={(e) => setForm({ ...form, club_name: e.target.value })}
          className="w-full bg-white/5 rounded-lg px-3 py-2 border border-white/10 outline-none focus:border-tuna-gold" />
        <input required placeholder="Yetkili Ad Soyad" value={form.contact_name}
          onChange={(e) => setForm({ ...form, contact_name: e.target.value })}
          className="w-full bg-white/5 rounded-lg px-3 py-2 border border-white/10 outline-none focus:border-tuna-gold" />
        <input required type="email" placeholder="E-posta" value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          className="w-full bg-white/5 rounded-lg px-3 py-2 border border-white/10 outline-none focus:border-tuna-gold" />
        <input placeholder="Telefon (opsiyonel)" value={form.phone}
          onChange={(e) => setForm({ ...form, phone: e.target.value })}
          className="w-full bg-white/5 rounded-lg px-3 py-2 border border-white/10 outline-none focus:border-tuna-gold" />
        <input required type="password" placeholder="Şifre (en az 10 karakter)" value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          className="w-full bg-white/5 rounded-lg px-3 py-2 border border-white/10 outline-none focus:border-tuna-gold" />
        {error && <p className="text-red-400 text-sm">{error}</p>}
        <button disabled={loading} className="w-full bg-tuna-gold text-tuna-black font-semibold px-6 py-3 rounded-lg disabled:opacity-50">
          {loading ? "Gönderiliyor..." : "Başvuruyu Gönder"}
        </button>
        <p className="text-xs text-tuna-mist text-center">
          Zaten onaylı bir hesabın var mı? <a href="/scout/giris" className="text-tuna-gold underline">Giriş yap</a>
        </p>
      </form>
    </div>
  );
}
