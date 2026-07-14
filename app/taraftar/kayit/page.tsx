"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function TaraftarKayitPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const res = await fetch("/api/taraftar/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ full_name: fullName, email, phone, password }),
    });
    const data = await res.json();
    if (!res.ok) {
      setLoading(false);
      setError(data.error ?? "Kayıt başarısız.");
      return;
    }
    const loginRes = await fetch("/api/taraftar/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ identifier: email || phone, password }),
    });
    setLoading(false);
    if (loginRes.ok) router.push("/taraftar/panel");
    else router.push("/taraftar/giris");
  }

  return (
    <div className="max-w-md mx-auto px-4 py-24">
      <p className="eyebrow mb-3 text-center">Tunaspor 1954</p>
      <h1 className="font-display text-3xl mb-8 text-center">Dijital Kulüp Üyeliği</h1>

      <form onSubmit={handleSubmit} className="glass-panel p-6 space-y-4">
        <label className="block">
          <span className="text-sm text-tuna-mist block mb-1">Ad Soyad</span>
          <input
            required
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="w-full bg-white/5 rounded-lg px-3 py-2 border border-white/10 outline-none focus:border-tuna-gold"
          />
        </label>
        <label className="block">
          <span className="text-sm text-tuna-mist block mb-1">E-posta</span>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-white/5 rounded-lg px-3 py-2 border border-white/10 outline-none focus:border-tuna-gold"
          />
        </label>
        <label className="block">
          <span className="text-sm text-tuna-mist block mb-1">Telefon</span>
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="E-posta girmediyseniz zorunlu"
            className="w-full bg-white/5 rounded-lg px-3 py-2 border border-white/10 outline-none focus:border-tuna-gold"
          />
        </label>
        <label className="block">
          <span className="text-sm text-tuna-mist block mb-1">Şifre</span>
          <input
            required
            type="password"
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-white/5 rounded-lg px-3 py-2 border border-white/10 outline-none focus:border-tuna-gold"
          />
        </label>
        {error && <p className="text-red-400 text-sm">{error}</p>}
        <button disabled={loading} className="w-full bg-tuna-gold text-tuna-black font-semibold px-6 py-3 rounded-lg disabled:opacity-50">
          {loading ? "Kaydediliyor..." : "Üye Ol"}
        </button>
        <p className="text-xs text-tuna-mist text-center">
          Zaten üye misin? <Link href="/taraftar/giris" className="text-tuna-gold hover:underline">Giriş yap</Link>
        </p>
      </form>
    </div>
  );
}
