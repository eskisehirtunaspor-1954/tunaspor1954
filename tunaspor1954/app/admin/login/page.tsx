"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const router = useRouter();
  const [step, setStep] = useState<"credentials" | "totp">("credentials");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [totpToken, setTotpToken] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submitCredentials(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const res = await fetch("/api/admin/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Giriş bilgileri hatalı.");
      return;
    }
    setStep("totp");
  }

  async function submitTotp(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const res = await fetch("/api/admin/auth/verify-totp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, token: totpToken }),
    });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Doğrulama kodu hatalı.");
      return;
    }
    router.push("/admin/dashboard");
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="glass-panel w-full max-w-sm p-8">
        <h1 className="font-display text-2xl text-tuna-yellow mb-1">Yönetici Girişi</h1>
        <p className="text-sm text-tuna-mist mb-6">Tunaspor 1954 Yönetim Paneli</p>

        {error && (
          <p className="mb-4 text-sm text-red-400 bg-red-950/40 border border-red-900 rounded-lg px-3 py-2">
            {error}
          </p>
        )}

        {step === "credentials" ? (
          <form onSubmit={submitCredentials} className="space-y-4">
            <input
              type="email"
              required
              placeholder="E-posta"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-white/5 rounded-lg px-3 py-2 outline-none border border-white/10 focus:border-tuna-yellow"
            />
            <input
              type="password"
              required
              placeholder="Şifre"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-white/5 rounded-lg px-3 py-2 outline-none border border-white/10 focus:border-tuna-yellow"
            />
            <button
              disabled={loading}
              className="w-full bg-tuna-yellow text-tuna-black font-semibold py-2 rounded-lg disabled:opacity-50"
            >
              {loading ? "Kontrol ediliyor..." : "Devam Et"}
            </button>
          </form>
        ) : (
          <form onSubmit={submitTotp} className="space-y-4">
            <p className="text-sm text-tuna-mist">
              Kimlik doğrulama uygulamanızdaki 6 haneli kodu girin.
            </p>
            <input
              inputMode="numeric"
              pattern="[0-9]{6}"
              maxLength={6}
              required
              placeholder="123456"
              value={totpToken}
              onChange={(e) => setTotpToken(e.target.value)}
              className="w-full text-center tracking-[0.5em] bg-white/5 rounded-lg px-3 py-2 outline-none border border-white/10 focus:border-tuna-yellow"
            />
            <button
              disabled={loading}
              className="w-full bg-tuna-yellow text-tuna-black font-semibold py-2 rounded-lg disabled:opacity-50"
            >
              {loading ? "Doğrulanıyor..." : "Giriş Yap"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
