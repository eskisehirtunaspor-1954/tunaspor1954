"use client";

import { Component, type ReactNode } from "react";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";

interface ClubMapProps {
  lat: number;
  lng: number;
  label: string;
}

// Kulüp logosunu harita işaretçisi yapar — varsayılan Leaflet pin'i yerine.
const clubIcon = L.icon({
  iconUrl: "/images/logo.png",
  iconSize: [42, 42],
  iconAnchor: [21, 42],
  popupAnchor: [0, -38],
  className: "rounded-full bg-tuna-black/80 p-1 ring-2 ring-tuna-gold shadow-goldGlow",
});

function MapUnavailable() {
  return (
    <div className="flex h-full w-full items-center justify-center bg-white/5 text-center text-sm text-tuna-mist px-4">
      Konum yüklenemedi
    </div>
  );
}

// Leaflet çalışma zamanında (tile sunucusu erişilemez, WebGL/DOM sorunu vb.)
// patlarsa kullanıcı teknik bir hata yerine sade bir mesaj görsün diye.
class MapErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  state = { hasError: false };
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(error: unknown) {
    console.error("ClubMap render hatası:", error);
  }
  render() {
    if (this.state.hasError) return <MapUnavailable />;
    return this.props.children;
  }
}

// OpenStreetMap tabanlı, API anahtarı gerektirmeyen interaktif harita. Google Maps
// JS API'nin aksine ücretsizdir ve bu projenin CSP'sinde yalnızca img-src'e tile
// sunucusunu eklemek yeterlidir (iframe/frame-src gerekmez).
export function ClubMap({ lat, lng, label }: ClubMapProps) {
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return <MapUnavailable />;
  }

  return (
    <MapErrorBoundary>
      <MapContainer
        center={[lat, lng]}
        zoom={16}
        scrollWheelZoom={false}
        className="h-full w-full"
        attributionControl={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={[lat, lng]} icon={clubIcon}>
          <Popup>{label}</Popup>
        </Marker>
      </MapContainer>
    </MapErrorBoundary>
  );
}
