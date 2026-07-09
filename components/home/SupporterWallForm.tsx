"use client";

import { useState } from "react";

export function SupporterWallForm() {
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("sending");
    const form = new FormData(e.currentTarget);
    const payload = Object.fromEntries(form.entries());
    try {
      const res = await fetch("/api/supporter-wall", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      setStatus(res.ok ? "sent" : "error");
      if (res.ok) (e.target as HTMLFormElement).reset();
    } catch {
      setStatus("error");
    }
  }

  if (status === "sent") {
    return (
      <div className="glass-panel p-6 text-center mb-8">
        <p className="text-tuna-yellow font-semibold">Teşekkürler!</p>
        <p className="text-sm text-tuna-mist mt-1">Mesajınız onay sonrası duvarda yayınlanacak.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="glass-panel p-6 grid md:grid-cols-3 gap-3 mb-4">
      <input
        name="supporter_name"
        required
        placeholder="Adınız / Kurumunuz"
        className="bg-white/5 rounded-lg px-3 py-2 outline-none border border-white/10 focus:border-tuna-yellow md:col-span-1"
      />
      <textarea
        name="message"
        required
        rows={2}
        placeholder="Destek mesajınız"
        className="bg-white/5 rounded-lg px-3 py-2 outline-none border border-white/10 focus:border-tuna-yellow md:col-span-2"
      />
      <button
        disabled={status === "sending"}
        className="md:col-span-3 bg-tuna-yellow text-tuna-black font-semibold py-2 rounded-lg disabled:opacity-50"
      >
        {status === "sending" ? "Gönderiliyor..." : "Mesajı Gönder"}
      </button>
      {status === "error" && <p className="text-red-400 text-sm md:col-span-3">Bir hata oluştu.</p>}
    </form>
  );
}
