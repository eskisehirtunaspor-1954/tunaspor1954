"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { GenericCrudManager } from "@/components/admin/GenericCrudManager";

// Leaflet window nesnesine ihtiyaç duyar — yalnızca istemci tarafında render edilir.
const ClubMap = dynamic(() => import("@/components/site/ClubMap").then((m) => m.ClubMap), {
  ssr: false,
  loading: () => <div className="h-full w-full animate-pulse bg-white/5" />,
});

interface ContactInfo {
  address?: string; contact_person?: string; phone?: string; whatsapp_number?: string; whatsapp_channel_url?: string; email?: string;
  instagram_url?: string; facebook_url?: string; youtube_url?: string;
  location_name?: string; map_lat?: number; map_lng?: number;
  saha_name?: string; saha_address?: string; saha_map_lat?: number; saha_map_lng?: number;
}

const NOT_FOUND_MESSAGE = "Adres bulunamadı. Lütfen daha ayrıntılı bir adres giriniz.";

async function geocodeAddress(address: string): Promise<{ lat: number; lng: number } | { error: string }> {
  try {
    const res = await fetch("/api/geocode", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ address }),
    });
    const data = await res.json();
    if (!res.ok) return { error: data.error ?? NOT_FOUND_MESSAGE };
    return { lat: data.lat, lng: data.lng };
  } catch {
    return { error: "Konum servisi şu anda yanıt vermiyor. Lütfen daha sonra tekrar deneyin." };
  }
}

// Tek bir harita konumu için "Harita Adı + Adres" alanı: kaydedilince adres
// otomatik koordinata çevrilir, altında canlı bir önizleme haritası (marker
// dahil) belirir. Hiçbir zaman ham enlem/boylam, URL ya da iframe kodu
// istenmez/gösterilmez.
function LocationEditor({
  title, name, address, lat, lng, onNameChange, onAddressChange, error, variant,
}: {
  title: string;
  name: string;
  address: string;
  lat?: number;
  lng?: number;
  onNameChange: (v: string) => void;
  onAddressChange: (v: string) => void;
  error?: string | null;
  variant: "club" | "pitch";
}) {
  const hasCoords = Boolean(lat && lng);
  return (
    <div className="md:col-span-2 pt-3 border-t border-white/10 space-y-3">
      <p className="text-sm text-tuna-mist">{title}</p>
      <div className="grid md:grid-cols-2 gap-3">
        <input
          placeholder="Harita Adı (ör. Kulüp Binası)"
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
          className="bg-white/5 rounded-lg px-3 py-2 border border-white/10 outline-none focus:border-tuna-yellow"
        />
        <input
          placeholder="Adres (ör. Vadişehir Mahallesi Ediz Bahtiyaroğlu Spor Sahası, Eskişehir)"
          value={address}
          onChange={(e) => onAddressChange(e.target.value)}
          className="bg-white/5 rounded-lg px-3 py-2 border border-white/10 outline-none focus:border-tuna-yellow"
        />
      </div>
      {error && <p className="text-xs text-red-400">{error}</p>}
      {hasCoords && (
        <div className="aspect-video w-full max-w-md overflow-hidden rounded-xl border border-white/10">
          <ClubMap lat={Number(lat)} lng={Number(lng)} name={name} address={address} variant={variant} />
        </div>
      )}
    </div>
  );
}

export default function Page() {
  const [info, setInfo] = useState<ContactInfo>({});
  const [saving, setSaving] = useState(false);
  const [clubError, setClubError] = useState<string | null>(null);
  const [sahaError, setSahaError] = useState<string | null>(null);
  const lastGeocodedClub = useRef<string>("");
  const lastGeocodedSaha = useRef<string>("");

  useEffect(() => {
    fetch("/api/admin/contact-info").then((r) => r.json()).then((d) => {
      const data: ContactInfo = d.data ?? {};
      setInfo(data);
      lastGeocodedClub.current = data.address ?? "";
      lastGeocodedSaha.current = data.saha_address ?? "";
    });
  }, []);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setClubError(null);
    setSahaError(null);

    let next = { ...info };

    // Adres değiştiyse (veya hiç koordinat yoksa) otomatik olarak geocode et —
    // admin hiçbir zaman koordinat/URL/iframe girmiyor, yalnızca adres yazıyor.
    if (next.address?.trim() && (next.address !== lastGeocodedClub.current || !next.map_lat || !next.map_lng)) {
      const result = await geocodeAddress(next.address);
      if ("error" in result) {
        setClubError(result.error);
      } else {
        next = { ...next, map_lat: result.lat, map_lng: result.lng };
        lastGeocodedClub.current = next.address ?? "";
      }
    }

    if (next.saha_address?.trim() && (next.saha_address !== lastGeocodedSaha.current || !next.saha_map_lat || !next.saha_map_lng)) {
      const result = await geocodeAddress(next.saha_address);
      if ("error" in result) {
        setSahaError(result.error);
      } else {
        next = { ...next, saha_map_lat: result.lat, saha_map_lng: result.lng };
        lastGeocodedSaha.current = next.saha_address ?? "";
      }
    }

    setInfo(next);
    await fetch("/api/admin/contact-info", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(next),
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

        <LocationEditor
          title="Harita Yönetimi — Konum 1"
          name={info.location_name ?? "Tunaspor 1954 Kulüp Binası"}
          address={info.address ?? ""}
          lat={info.map_lat}
          lng={info.map_lng}
          onNameChange={(v) => setInfo({ ...info, location_name: v })}
          onAddressChange={(v) => setInfo({ ...info, address: v })}
          error={clubError}
          variant="club"
        />

        <LocationEditor
          title="Harita Yönetimi — Konum 2"
          name={info.saha_name ?? "Ediz Bahtiyaroğlu Sahası"}
          address={info.saha_address ?? ""}
          lat={info.saha_map_lat}
          lng={info.saha_map_lng}
          onNameChange={(v) => setInfo({ ...info, saha_name: v })}
          onAddressChange={(v) => setInfo({ ...info, saha_address: v })}
          error={sahaError}
          variant="pitch"
        />

        <button disabled={saving} className="md:col-span-2 bg-tuna-yellow text-tuna-black font-semibold py-2 rounded-lg disabled:opacity-50 mt-3">
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
