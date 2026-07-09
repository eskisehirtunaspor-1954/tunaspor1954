"use client";

import { useState } from "react";

export default function Page() {
  const [form, setForm] = useState({ title: "", body: "", url: "/" });
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [result, setResult] = useState<{ sent: number; failed: number } | null>(null);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sending");
    const res = await fetch("/api/push/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    if (!res.ok) { setStatus("error"); return; }
    setResult(data);
    setStatus("sent");
  }

  return (
    <div className="min-h-screen px-4 py-10 max-w-xl mx-auto">
      <h1 className="font-display text-3xl text-tuna-yellow mb-8">Push Bildirim Gönder</h1>
      <form onSubmit={send} className="glass-panel p-6 space-y-3">
        <input
          required placeholder="Başlık" value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          className="w-full bg-white/5 rounded-lg px-3 py-2 border border-white/10 outline-none focus:border-tuna-yellow"
        />
        <textarea
          required placeholder="Mesaj" rows={3} value={form.body}
          onChange={(e) => setForm({ ...form, body: e.target.value })}
          className="w-full bg-white/5 rounded-lg px-3 py-2 border border-white/10 outline-none focus:border-tuna-yellow"
        />
        <input
          placeholder="Tıklanınca gidilecek URL (/haberler/slug gibi)" value={form.url}
          onChange={(e) => setForm({ ...form, url: e.target.value })}
          className="w-full bg-white/5 rounded-lg px-3 py-2 border border-white/10 outline-none focus:border-tuna-yellow"
        />
        <button disabled={status === "sending"} className="bg-tuna-yellow text-tuna-black font-semibold px-6 py-2 rounded-lg disabled:opacity-50">
          {status === "sending" ? "Gönderiliyor..." : "Tüm Aboneleri Bildir"}
        </button>
        {status === "sent" && result && (
          <p className="text-tuna-yellow text-sm">
            Gönderildi: {result.sent} — Başarısız/geçersiz: {result.failed}
          </p>
        )}
        {status === "error" && <p className="text-red-400 text-sm">Gönderilemedi.</p>}
      </form>
    </div>
  );
}
