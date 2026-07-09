"use client";

import { useState } from "react";

export function EventRegisterForm({ eventId }: { eventId: string }) {
  const [expanded, setExpanded] = useState(false);
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [resultMessage, setResultMessage] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("sending");
    const form = new FormData(e.currentTarget);
    const payload = { event_id: eventId, ...Object.fromEntries(form.entries()) };
    try {
      const res = await fetch("/api/event-registration", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      setResultMessage(data.message ?? data.error ?? "");
      setStatus(res.ok ? "sent" : "error");
    } catch {
      setStatus("error");
    }
  }

  if (status === "sent") {
    return <p className="text-tuna-yellow text-sm">{resultMessage}</p>;
  }

  if (!expanded) {
    return (
      <button
        onClick={() => setExpanded(true)}
        className="bg-tuna-yellow text-tuna-black font-semibold px-5 py-2 rounded-full text-sm"
      >
        Başvur
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="grid md:grid-cols-2 gap-3 mt-4">
      <input name="full_name" required placeholder="Katılımcı Ad Soyad" className="bg-white/5 rounded-lg px-3 py-2 border border-white/10 outline-none focus:border-tuna-yellow" />
      <input name="birth_date" type="date" className="bg-white/5 rounded-lg px-3 py-2 border border-white/10 outline-none focus:border-tuna-yellow" />
      <input name="parent_name" placeholder="Veli Adı (18 yaş altı için)" className="bg-white/5 rounded-lg px-3 py-2 border border-white/10 outline-none focus:border-tuna-yellow" />
      <input name="phone" required placeholder="Telefon" className="bg-white/5 rounded-lg px-3 py-2 border border-white/10 outline-none focus:border-tuna-yellow" />
      <input name="email" type="email" placeholder="E-posta (opsiyonel)" className="bg-white/5 rounded-lg px-3 py-2 border border-white/10 outline-none focus:border-tuna-yellow md:col-span-2" />
      <textarea name="notes" placeholder="Notlarınız" rows={2} className="bg-white/5 rounded-lg px-3 py-2 border border-white/10 outline-none focus:border-tuna-yellow md:col-span-2" />
      <button disabled={status === "sending"} className="md:col-span-2 bg-tuna-yellow text-tuna-black font-semibold py-2 rounded-lg disabled:opacity-50">
        {status === "sending" ? "Gönderiliyor..." : "Başvuruyu Gönder"}
      </button>
      {status === "error" && <p className="text-red-400 text-sm md:col-span-2">{resultMessage || "Bir hata oluştu."}</p>}
    </form>
  );
}
