"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function VeliGirisPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const res = await fetch("/api/parent/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    setLoading(false);
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Giriş başarısız.");
      return;
    }
    router.push("/veli/panel");
  }

  return (
    <div className="max-w-md mx-auto px-4 py-24">
      <p className="eyebrow mb-3 text-center">Tunaspor 1954 Akademi</p>
      <h1 className="font-display text-3xl mb-8 text-center">Veli Girişi</h1>

      <form onSubmit={handleSubmit} className="glass-panel p-6 space-y-4">
        <label className="block">
          <span className="text-sm text-tuna-mist block mb-1">E-posta</span>
          <input
            required
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-white/5 rounded-lg px-3 py-2 border border-white/10 outline-none focus:border-tuna-gold"
          />
        </label>
        <label className="block">
          <span className="text-sm text-tuna-mist block mb-1">Şifre</span>
          <input
            required
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-white/5 rounded-lg px-3 py-2 border border-white/10 outline-none focus:border-tuna-gold"
          />
        </label>
        {error && <p className="text-red-400 text-sm">{error}</p>}
        <button disabled={loading} className="w-full bg-tuna-gold text-tuna-black font-semibold px-6 py-3 rounded-lg disabled:opacity-50">
          {loading ? "Giriş yapılıyor..." : "Giriş Yap"}
        </button>
        <p className="text-xs text-tuna-mist text-center">
          Hesabın yoksa, akademi antrenörünle veya kulüp ofisiyle iletişime geç —
          veli hesapları güvenlik gereği yalnızca kulüp tarafından oluşturulur.
        </p>
      </form>
    </div>
  );
}
