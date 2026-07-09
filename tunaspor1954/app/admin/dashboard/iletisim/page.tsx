"use client";

import { useEffect, useState } from "react";
import { GenericCrudManager } from "@/components/admin/GenericCrudManager";

interface ContactInfo {
  address?: string; phone?: string; whatsapp_number?: string; whatsapp_channel_url?: string; email?: string;
  instagram_url?: string; facebook_url?: string; youtube_url?: string;
  map_lat?: number; map_lng?: number;
}

export default function Page() {
  const [info, setInfo] = useState<ContactInfo>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/admin/contact-info").then((r) => r.json()).then((d) => setInfo(d.data ?? {}));
  }, []);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    await fetch("/api/admin/contact-info", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(info),
    });
    setSaving(false);
  }

  return (
    <div className="min-h-screen px-4 py-10 max-w-6xl mx-auto">
      <h1 className="font-display text-3xl text-tuna-yellow mb-8">İletişim Bilgileri</h1>

      <form onSubmit={save} className="glass-panel p-6 grid md:grid-cols-2 gap-3 mb-10">
        {(["address","phone","whatsapp_number","whatsapp_channel_url","email","instagram_url","facebook_url","youtube_url"] as const).map((key) => (
          <input
            key={key}
            placeholder={key}
            value={(info as any)[key] ?? ""}
            onChange={(e) => setInfo({ ...info, [key]: e.target.value })}
            className="bg-white/5 rounded-lg px-3 py-2 border border-white/10 outline-none focus:border-tuna-yellow"
          />
        ))}
        <input
          type="number" step="any" placeholder="Harita Enlem (lat)"
          value={info.map_lat ?? ""}
          onChange={(e) => setInfo({ ...info, map_lat: parseFloat(e.target.value) })}
          className="bg-white/5 rounded-lg px-3 py-2 border border-white/10 outline-none focus:border-tuna-yellow"
        />
        <input
          type="number" step="any" placeholder="Harita Boylam (lng)"
          value={info.map_lng ?? ""}
          onChange={(e) => setInfo({ ...info, map_lng: parseFloat(e.target.value) })}
          className="bg-white/5 rounded-lg px-3 py-2 border border-white/10 outline-none focus:border-tuna-yellow"
        />
        <button disabled={saving} className="md:col-span-2 bg-tuna-yellow text-tuna-black font-semibold py-2 rounded-lg disabled:opacity-50">
          {saving ? "Kaydediliyor..." : "Kaydet"}
        </button>
      </form>

      <GenericCrudManager
        apiPath="/api/admin/contact-messages"
        title="Gelen Mesajlar"
        titleField="full_name"
        subtitleField="subject"
        fields={[
          { name: "full_name", label: "Ad Soyad", required: true },
          { name: "email", label: "E-posta", required: true },
          { name: "phone", label: "Telefon" },
          { name: "subject", label: "Konu" },
          { name: "message", label: "Mesaj", type: "textarea", required: true },
          { name: "is_read", label: "Okundu", type: "checkbox" },
        ]}
      />
    </div>
  );
}
