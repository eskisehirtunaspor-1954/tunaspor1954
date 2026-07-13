"use client";

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

// OpenStreetMap tabanlı, API anahtarı gerektirmeyen interaktif harita. Google Maps
// JS API'nin aksine ücretsizdir ve bu projenin CSP'sinde yalnızca img-src'e tile
// sunucusunu eklemek yeterlidir (iframe/frame-src gerekmez).
export function ClubMap({ lat, lng, label }: ClubMapProps) {
  return (
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
  );
}
