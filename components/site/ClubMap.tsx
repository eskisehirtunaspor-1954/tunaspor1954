"use client";

import { Component, useEffect, useRef, useState, type ReactNode, type RefObject } from "react";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";

export type MapMarkerIcon = "club_logo" | "football" | "pin_generic";

interface ClubMapProps {
  lat: number;
  lng: number;
  name: string;
  address?: string | null;
  description?: string | null;
  phone?: string | null;
  variant?: MapMarkerIcon;
  zoom?: number;
}

function isAppleDevice(): boolean {
  return typeof navigator !== "undefined" && /iphone|ipad|ipod|macintosh/i.test(navigator.userAgent) && "ontouchend" in document;
}

function directionsUrl(lat: number, lng: number): string {
  const query = `${lat},${lng}`;
  return isAppleDevice()
    ? `https://maps.apple.com/?daddr=${query}`
    : `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(query)}`;
}

// Admin panelinden seçilebilen üç pin stili: kulüp logosu, futbol topu rozeti,
// veya sade/genel bir konum iğnesi — iki konum haritada birbirinden ayırt
// edilsin ve yönetici ihtiyaca göre değiştirebilsin diye.
function buildPinIcon(kind: MapMarkerIcon) {
  const clipId = `tuna-pin-clip-${kind}`;
  const badge =
    kind === "club_logo"
      ? `<clipPath id="${clipId}"><circle cx="22" cy="22" r="15"/></clipPath>
         <circle cx="22" cy="22" r="16" fill="#FFD700"/>
         <image href="/images/logo.png" x="6" y="6" width="32" height="32" clip-path="url(#${clipId})" />`
      : kind === "football"
      ? `<circle cx="22" cy="22" r="16" fill="#FFD700"/>
         <g fill="none" stroke="#050505" stroke-width="1.6">
           <circle cx="22" cy="22" r="10.5"/>
           <path d="M22 13.2l6.6 4.8-2.5 7.9h-8.2l-2.5-7.9z" fill="#050505" stroke="none"/>
           <path d="M22 13.2v-2.8M28.6 18l2.9-1.7M25.9 25.9l1.7 2.7M18.1 25.9l-1.7 2.7M15.4 18l-2.9-1.7"/>
         </g>`
      : `<circle cx="22" cy="22" r="16" fill="#FFD700"/>
         <circle cx="22" cy="22" r="6" fill="#050505"/>`;

  const html = `
    <div style="filter: drop-shadow(0 4px 8px rgba(0,0,0,0.55));">
      <svg width="44" height="56" viewBox="0 0 44 56" xmlns="http://www.w3.org/2000/svg">
        <path d="M22 0C9.85 0 0 9.85 0 22c0 15 22 34 22 34s22-19 22-34C44 9.85 34.15 0 22 0z" fill="#050505" stroke="#FFD700" stroke-width="2"/>
        ${badge}
      </svg>
    </div>
  `;

  return L.divIcon({
    html,
    className: "tuna-pin-icon",
    iconSize: [44, 56],
    iconAnchor: [22, 54],
    popupAnchor: [0, -48],
  });
}

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

// Tam ekrana giriş/çıkışta Leaflet'in kendi tile ızgarasını yeniden
// hesaplaması gerekir — aksi halde konteyner boyutu değişince harita
// bozuk/eksik tile'larla kalır.
function FullscreenSync({ onChange }: { onChange: (fs: boolean) => void }) {
  const map = useMap();
  useEffect(() => {
    function handle() {
      onChange(Boolean(document.fullscreenElement));
      setTimeout(() => map.invalidateSize(), 150);
    }
    document.addEventListener("fullscreenchange", handle);
    return () => document.removeEventListener("fullscreenchange", handle);
  }, [map, onChange]);
  return null;
}

function MapControls({ lat, lng, wrapperRef }: { lat: number; lng: number; wrapperRef: RefObject<HTMLDivElement> }) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const query = `${lat},${lng}`;

  function toggleFullscreen() {
    const el = wrapperRef.current;
    if (!el) return;
    if (!document.fullscreenElement) {
      el.requestFullscreen?.().catch(() => {});
    } else {
      document.exitFullscreen?.().catch(() => {});
    }
  }

  return (
    <>
      <FullscreenSync onChange={setIsFullscreen} />
      <div className="pointer-events-none absolute top-3 right-3 z-[1000] flex flex-col items-end gap-2">
        <a
          href={directionsUrl(lat, lng)}
          target="_blank"
          rel="noopener noreferrer"
          className="pointer-events-auto text-xs font-medium bg-tuna-black/80 backdrop-blur border border-tuna-gold/40 text-tuna-gold px-3 py-1.5 rounded-full hover:bg-tuna-gold/10 hover:border-tuna-gold transition-colors shadow-glass"
        >
          🧭 Yol Tarifi Al
        </a>
        <a
          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="pointer-events-auto text-xs font-medium bg-tuna-black/80 backdrop-blur border border-white/15 text-white px-3 py-1.5 rounded-full hover:border-white/30 transition-colors shadow-glass"
        >
          Google Maps'te Aç
        </a>
        <button
          type="button"
          onClick={toggleFullscreen}
          className="pointer-events-auto text-xs font-medium bg-tuna-black/80 backdrop-blur border border-white/15 text-white px-3 py-1.5 rounded-full hover:border-white/30 transition-colors shadow-glass"
        >
          {isFullscreen ? "⤢ Tam Ekrandan Çık" : "⤢ Tam Ekran Görüntüle"}
        </button>
      </div>
    </>
  );
}

// OpenStreetMap tabanlı, API anahtarı gerektirmeyen interaktif harita. Google Maps
// JS API'nin aksine ücretsizdir ve bu projenin CSP'sinde yalnızca img-src'e tile
// sunucusunu eklemek yeterlidir (iframe/frame-src gerekmez).
export function ClubMap({ lat, lng, name, address, description, phone, variant = "club_logo", zoom = 16 }: ClubMapProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return <MapUnavailable />;
  }

  return (
    <MapErrorBoundary>
      <div ref={wrapperRef} className="relative h-full w-full animate-fadeUp bg-tuna-black">
        <MapContainer center={[lat, lng]} zoom={zoom} scrollWheelZoom={false} className="h-full w-full" attributionControl={true}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> katkıda bulunanlar &copy; <a href="https://carto.com/attributions">CARTO</a>'
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            subdomains="abcd"
            maxZoom={19}
          />
          <Marker position={[lat, lng]} icon={buildPinIcon(variant)}>
            <Popup className="tuna-popup">
              <div className="text-sm space-y-1">
                <p className="font-semibold text-tuna-gold">{name}</p>
                {description && <p className="text-xs text-tuna-mist">{description}</p>}
                {address && <p className="text-xs text-tuna-mist">📍 {address}</p>}
                {phone && (
                  <p className="text-xs">
                    <a href={`tel:${phone.replace(/\s/g, "")}`} className="text-tuna-mist hover:text-white">
                      📞 {phone}
                    </a>
                  </p>
                )}
                <a
                  href={directionsUrl(lat, lng)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block mt-1 text-xs text-tuna-gold hover:underline"
                >
                  🧭 Yol Tarifi Al
                </a>
              </div>
            </Popup>
          </Marker>
          <MapControls lat={lat} lng={lng} wrapperRef={wrapperRef} />
        </MapContainer>
      </div>
    </MapErrorBoundary>
  );
}
