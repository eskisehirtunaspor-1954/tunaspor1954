"use client";

import { useState } from "react";
import { Lightbox } from "./Lightbox";

interface Album { id: string; title: string; cover_image_url: string | null; media_type: string }
interface Video { id: string; title: string; youtube_id: string }

export function GalleryGrid({ photoAlbums, droneAlbums, videos }: {
  photoAlbums: Album[]; droneAlbums: Album[]; videos: Video[];
}) {
  const [tab, setTab] = useState<"fotograf" | "video" | "drone">("fotograf");
  const [activeAlbum, setActiveAlbum] = useState<Album | null>(null);

  const TABS = [
    { key: "fotograf" as const, label: "📸 Fotoğraf", count: photoAlbums.length },
    { key: "video" as const, label: "🎬 Video", count: videos.length },
    { key: "drone" as const, label: "🚁 Drone", count: droneAlbums.length },
  ];

  return (
    <div>
      <div className="flex flex-wrap gap-3 mb-8">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-5 py-2 rounded-full text-sm border transition-all ${
              tab === t.key
                ? "bg-tuna-gold text-tuna-black border-tuna-gold"
                : "border-white/15 text-tuna-mist hover:border-tuna-gold/50"
            }`}
          >
            {t.label} <span className="opacity-60">({t.count})</span>
          </button>
        ))}
      </div>

      {tab === "fotograf" && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {photoAlbums.map((a) => (
            <button
              key={a.id}
              onClick={() => setActiveAlbum(a)}
              className="group glass-panel aspect-square overflow-hidden text-left hover:border-tuna-gold/40 transition-colors"
            >
              {a.cover_image_url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={a.cover_image_url} alt={a.title} className="w-full h-3/4 object-cover group-hover:scale-105 transition-transform duration-300" />
              )}
              <div className="p-2 text-xs text-center truncate">{a.title}</div>
            </button>
          ))}
          {!photoAlbums.length && <p className="text-tuna-mist col-span-full">Henüz fotoğraf albümü eklenmedi.</p>}
        </div>
      )}

      {tab === "drone" && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {droneAlbums.map((a) => (
            <button
              key={a.id}
              onClick={() => setActiveAlbum(a)}
              className="group glass-panel aspect-square overflow-hidden text-left hover:border-tuna-gold/40 transition-colors"
            >
              {a.cover_image_url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={a.cover_image_url} alt={a.title} className="w-full h-3/4 object-cover group-hover:scale-105 transition-transform duration-300" />
              )}
              <div className="p-2 text-xs text-center truncate">{a.title}</div>
            </button>
          ))}
          {!droneAlbums.length && <p className="text-tuna-mist col-span-full">Henüz drone görüntüsü eklenmedi.</p>}
        </div>
      )}

      {tab === "video" && (
        <div className="grid md:grid-cols-3 gap-6">
          {videos.map((v) => (
            <div key={v.id} className="glass-panel overflow-hidden">
              <div className="aspect-video">
                <iframe
                  className="w-full h-full"
                  src={`https://www.youtube.com/embed/${v.youtube_id}`}
                  title={v.title}
                  allowFullScreen
                />
              </div>
              <div className="p-4 text-sm font-medium">{v.title}</div>
            </div>
          ))}
          {!videos.length && <p className="text-tuna-mist col-span-full">Henüz video eklenmedi.</p>}
        </div>
      )}

      <Lightbox
        albumId={activeAlbum?.id ?? null}
        albumTitle={activeAlbum?.title}
        fallbackCover={activeAlbum?.cover_image_url}
        onClose={() => setActiveAlbum(null)}
      />
    </div>
  );
}
