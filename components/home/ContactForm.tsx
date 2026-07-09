"use client";

import { useState } from "react";

export function ContactForm() {
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("sending");
    const form = new FormData(e.currentTarget);
    const payload = Object.fromEntries(form.entries());
    try {
      const res = await fetch("/api/contact", {
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
      <div className="glass-panel p-8 text-center">
        <p className="text-tuna-yellow font-semibold">Mesajınız iletildi!</p>
        <p className="text-tuna-mist text-sm mt-2">En kısa sürede size dönüş yapacağız.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="glass-panel p-6 space-y-4">
      <input
        name="full_name"
        required
        placeholder="Ad Soyad"
        className="w-full bg-white/5 rounded-lg px-3 py-2 outline-none border border-white/10 focus:border-tuna-yellow"
      />
      <input
        name="email"
        type="email"
        required
        placeholder="E-posta"
        className="w-full bg-white/5 rounded-lg px-3 py-2 outline-none border border-white/10 focus:border-tuna-yellow"
      />
      <input
        name="phone"
        placeholder="Telefon (opsiyonel)"
        className="w-full bg-white/5 rounded-lg px-3 py-2 outline-none border border-white/10 focus:border-tuna-yellow"
      />
      <input
        name="subject"
        placeholder="Konu"
        className="w-full bg-white/5 rounded-lg px-3 py-2 outline-none border border-white/10 focus:border-tuna-yellow"
      />
      <textarea
        name="message"
        required
        rows={5}
        placeholder="Mesajınız"
        className="w-full bg-white/5 rounded-lg px-3 py-2 outline-none border border-white/10 focus:border-tuna-yellow"
      />
      <button
        disabled={status === "sending"}
        className="w-full bg-tuna-yellow text-tuna-black font-semibold py-2 rounded-lg disabled:opacity-50"
      >
        {status === "sending" ? "Gönderiliyor..." : "Gönder"}
      </button>
      {status === "error" && (
        <p className="text-red-400 text-sm">Bir hata oluştu, lütfen tekrar deneyin.</p>
      )}
    </form>
  );
}
