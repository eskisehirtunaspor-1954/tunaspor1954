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
  lat?: number | null; lng?: number | null; phone?: string | null; variant: MapMarkerIcon;
}) {
  const hasCoords = Boolean(lat && lng);

  return (
    <div className="glass-panel overflow-hidden">
      <div className="aspect-video w-full">
        {hasCoords ? (
          <ClubMap lat={Number(lat)} lng={Number(lng)} name={name} address={address} description={description} phone={phone} variant={variant} />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-white/5 text-center text-sm text-tuna-mist px-4">
            Konum yakında eklenecek
          </div>
        )}
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
            name={contactInfo?.location_name || "Tunaspor 1954 Kulüp Merkezi"}
            address={contactInfo?.address}
            description={contactInfo?.map_description}
            lat={contactInfo?.map_lat}
            lng={contactInfo?.map_lng}
            phone={contactInfo?.phone}
            variant={contactInfo?.map_marker_icon || "club_logo"}
          />
        )}
        {sahaActive && (
          <LocationCard
            name={contactInfo?.saha_name || "Ediz Bahtiyaroğlu Sahası"}
            address={contactInfo?.saha_address}
            description={contactInfo?.saha_map_description}
            lat={contactInfo?.saha_map_lat}
            lng={contactInfo?.saha_map_lng}
            phone={contactInfo?.phone}
            variant={contactInfo?.saha_map_marker_icon || "football"}
          />
        )}
      </div>
    </section>
  );
}
