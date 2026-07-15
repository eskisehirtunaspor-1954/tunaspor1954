"use client";

import dynamic from "next/dynamic";
import type { MapMarkerIcon } from "@/components/site/ClubMap";

const ClubMap = dynamic(() => import("@/components/site/ClubMap").then((m) => m.ClubMap), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full animate-pulse bg-gradient-to-br from-white/5 to-transparent flex items-center justify-center text-xs text-tuna-mist">
      Harita yükleniyor...
    </div>
  ),
});

// Veritabanı boş/eksik olsa bile harita ASLA "Konum yakında eklenecek" gibi bir
// yer tutucu göstermemeli — bu yüzden her iki konum için de sabit, doğrulanmış
// varsayılan koordinatlar tanımlı. DB'deki değerler her zaman önceliklidir;
// bunlar yalnızca map_lat/map_lng null olduğunda devreye girer.
const CLUB_FALLBACK = {
  lat: 39.793,
  lng: 30.5288,
  name: "Tunaspor 1954 Kulüp Merkezi",
  address: "Zafer Mahallesi, Egeli Sokak, Tepebaşı / Eskişehir",
};
const SAHA_FALLBACK = {
  lat: 39.7915,
  lng: 30.4908,
  name: "Ediz Bahtiyaroğlu Sahası",
  address: "Fevziçakmak Mahallesi, Kanallar Sokak No:31, 26230 Tepebaşı / Eskişehir",
};

interface ContactInfo {
  location_name?: string | null;
  address?: string | null;
  map_lat?: number | null;
  map_lng?: number | null;
  map_description?: string | null;
  map_marker_icon?: MapMarkerIcon | null;
  map_active?: boolean | null;
  saha_name?: string | null;
  saha_address?: string | null;
  saha_map_lat?: number | null;
  saha_map_lng?: number | null;
  saha_map_description?: string | null;
  saha_map_marker_icon?: MapMarkerIcon | null;
  saha_map_active?: boolean | null;
  phone?: string | null;
}

function LocationCard({
  name, address, description, lat, lng, phone, variant,
}: {
  name: string; address?: string | null; description?: string | null;
  lat: number; lng: number; phone?: string | null; variant: MapMarkerIcon;
}) {
  return (
    <div className="glass-panel overflow-hidden">
      <div className="aspect-video w-full">
        <ClubMap lat={lat} lng={lng} name={name} address={address} description={description} phone={phone} variant={variant} />
      </div>
      <div className="p-4">
        <h4 className="font-semibold text-sm mb-1">{name}</h4>
        {description && <p className="text-xs text-tuna-mist mb-1">{description}</p>}
        {address && <p className="text-xs text-tuna-mist">{address}</p>}
      </div>
    </div>
  );
}

// Ana sayfaya özel, iki konumlu harita bölümü — Süper Admin panelinden (İletişim
// Bilgileri) her iki konumu da aktif/pasif yapabilir; pasif olan konum burada
// hiç render edilmez.
export function LocationsSection({ contactInfo }: { contactInfo?: ContactInfo }) {
  const clubActive = contactInfo?.map_active !== false;
  const sahaActive = contactInfo?.saha_map_active !== false;

  if (!clubActive && !sahaActive) return null;

  return (
    <section id="konumlarimiz" className="max-w-6xl mx-auto px-4 py-16">
      <p className="eyebrow mb-3 text-center">Bize Ulaşın</p>
      <h2 className="font-display text-3xl mb-8 text-center">Konumlarımız</h2>
      <div className="grid gap-6 md:grid-cols-2">
        {clubActive && (
          <LocationCard
            name={contactInfo?.location_name || CLUB_FALLBACK.name}
            address={contactInfo?.address || CLUB_FALLBACK.address}
            description={contactInfo?.map_description}
            lat={Number.isFinite(contactInfo?.map_lat) ? Number(contactInfo!.map_lat) : CLUB_FALLBACK.lat}
            lng={Number.isFinite(contactInfo?.map_lng) ? Number(contactInfo!.map_lng) : CLUB_FALLBACK.lng}
            phone={contactInfo?.phone}
            variant={contactInfo?.map_marker_icon || "club_logo"}
          />
        )}
        {sahaActive && (
          <LocationCard
            name={contactInfo?.saha_name || SAHA_FALLBACK.name}
            address={contactInfo?.saha_address || SAHA_FALLBACK.address}
            description={contactInfo?.saha_map_description}
            lat={Number.isFinite(contactInfo?.saha_map_lat) ? Number(contactInfo!.saha_map_lat) : SAHA_FALLBACK.lat}
            lng={Number.isFinite(contactInfo?.saha_map_lng) ? Number(contactInfo!.saha_map_lng) : SAHA_FALLBACK.lng}
            phone={contactInfo?.phone}
            variant={contactInfo?.saha_map_marker_icon || "football"}
          />
        )}
      </div>
    </section>
  );
}
