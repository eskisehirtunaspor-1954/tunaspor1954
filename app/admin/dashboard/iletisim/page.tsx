"use client";

import { useEffect, useState } from "react";
import { GenericCrudManager } from "@/components/admin/GenericCrudManager";

interface ContactInfo {
  address?: string; contact_person?: string; phone?: string; whatsapp_number?: string; whatsapp_channel_url?: string; email?: string;
  instagram_url?: string; facebook_url?: string; youtube_url?: string;
  map_lat?: number; map_lng?: number;
  saha_name?: string; saha_address?: string; saha_map_lat?: number; saha_map_lng?: number;
}

// Adresi enlem/boylama çevirir (Nominatim, API anahtarı gerekmez). Admin artık
// hiçbir zaman koordinat yazmıyor — yalnızca adres girip bu butona basıyor.
function useGeocoder() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [foundLabel, setFoundLabel] = useState<string | null>(null);

  async function geocode(address: string, onFound: (lat: number, lng: number) => void) {
    if (!address.trim()) {
      setError("Önce bir adres yazın.");
      return;
    }
    setLoading(true);
    setError(null);
    setFoundLabel(null);
    try {
      const res = await fetch("/api/geocode", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Konum bulunamadı.");
        return;
      }
      onFound(data.lat, data.lng);
      setFoundLabel(`✓ Konum bulundu: ${data.lat.toFixed(5)}, ${data.lng.toFixed(5)}`);
    } catch {
      setError("Konum servisi şu anda yanıt vermiyor.");
    } finally {
      setLoading(false);
    }
  }

  return { geocode, loading, error, foundLabel };
}

export default function Page() {
  const [info, setInfo] = useState<ContactInfo>({});
  const [saving, setSaving] = useState(false);
  const clubGeo = useGeocoder();
  const sahaGeo = useGeocoder();

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
        {(["address","contact_person","phone","whatsapp_number","whatsapp_channel_url","email","instagram_url","facebook_url","youtube_url"] as const).map((key) => (
          <input
            key={key}
            placeholder={key}
            value={(info as any)[key] ?? ""}
            onChange={(e) => setInfo({ ...info, [key]: e.target.value })}
            className="bg-white/5 rounded-lg px-3 py-2 border border-white/10 outline-none focus:border-tuna-yellow"
          />
        ))}

        <div className="md:col-span-2 flex flex-wrap items-center gap-3">
          <button
            type="button"
            disabled={clubGeo.loading}
            onClick={() => clubGeo.geocode(info.address ?? "", (lat, lng) => setInfo((prev) => ({ ...prev, map_lat: lat, map_lng: lng })))}
            className="text-sm border border-tuna-gold/40 text-tuna-gold px-4 py-2 rounded-full hover:bg-tuna-gold/10 disabled:opacity-50"
          >
            {clubGeo.loading ? "Aranıyor..." : "📍 Konumu Bul (Kulüp Binası)"}
          </button>
          {clubGeo.foundLabel && <span className="text-xs text-emerald-400">{clubGeo.foundLabel}</span>}
          {clubGeo.error && <span className="text-xs text-red-400">{clubGeo.error}</span>}
        </div>

        <div className="md:col-span-2 pt-3 border-t border-white/10 text-sm text-tuna-mist">
          İkinci Konum — Saha (ana sayfadaki ikinci harita kartı)
        </div>
        <input
          placeholder="Saha Adı" value={info.saha_name ?? ""}
          onChange={(e) => setInfo({ ...info, saha_name: e.target.value })}
          className="bg-white/5 rounded-lg px-3 py-2 border border-white/10 outline-none focus:border-tuna-yellow"
        />
        <input
          placeholder="Saha Adresi" value={info.saha_address ?? ""}
          onChange={(e) => setInfo({ ...info, saha_address: e.target.value })}
          className="bg-white/5 rounded-lg px-3 py-2 border border-white/10 outline-none focus:border-tuna-yellow"
        />

        <div className="md:col-span-2 flex flex-wrap items-center gap-3">
          <button
            type="button"
            disabled={sahaGeo.loading}
            onClick={() => sahaGeo.geocode(info.saha_address ?? "", (lat, lng) => setInfo((prev) => ({ ...prev, saha_map_lat: lat, saha_map_lng: lng })))}
            className="text-sm border border-tuna-gold/40 text-tuna-gold px-4 py-2 rounded-full hover:bg-tuna-gold/10 disabled:opacity-50"
          >
            {sahaGeo.loading ? "Aranıyor..." : "📍 Konumu Bul (Saha)"}
          </button>
          {sahaGeo.foundLabel && <span className="text-xs text-emerald-400">{sahaGeo.foundLabel}</span>}
          {sahaGeo.error && <span className="text-xs text-red-400">{sahaGeo.error}</span>}
        </div>

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
