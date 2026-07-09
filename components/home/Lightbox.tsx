"use client";

import { useEffect, useState, useCallback } from "react";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

interface Photo { id: string; image_url: string; caption: string | null }

interface Props {
  albumId: string | null;
  albumTitle?: string;
  fallbackCover?: string | null;
  onClose: () => void;
}

export function Lightbox({ albumId, albumTitle, fallbackCover, onClose }: Props) {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [index, setIndex] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!albumId) return;
    setLoading(true);
    setIndex(0);
    fetch(`/api/gallery-photos?album_id=${albumId}`)
      .then((r) => r.json())
      .then((d) => setPhotos(d.data ?? []))
      .finally(() => setLoading(false));
  }, [albumId]);

  const next = useCallback(() => setIndex((i) => (i + 1) % Math.max(photos.length, 1)), [photos.length]);
  const prev = useCallback(() => setIndex((i) => (i - 1 + Math.max(photos.length, 1)) % Math.max(photos.length, 1)), [photos.length]);

  useEffect(() => {
    if (!albumId) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") next();
      if (e.key === "ArrowLeft") prev();
    }
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [albumId, next, prev, onClose]);

  if (!albumId) return null;

  const displayPhotos = photos.length ? photos : fallbackCover ? [{ id: "cover", image_url: fallbackCover, caption: null }] : [];
  const current = displayPhotos[index];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[70] bg-black/95 backdrop-blur-sm flex flex-col items-center justify-center px-4"
      >
        <button
          onClick={onClose}
          aria-label="Kapat"
          className="absolute top-5 right-5 text-white hover:text-tuna-gold transition-colors z-10"
        >
          <X size={28} />
        </button>

        {albumTitle && (
          <p className="absolute top-6 left-6 text-tuna-gold font-display text-lg tracking-wide">{albumTitle}</p>
        )}

        {loading ? (
          <p className="text-tuna-mist">Yükleniyor...</p>
        ) : current ? (
          <>
            <motion.img
              key={current.id}
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.25 }}
              src={current.image_url}
              alt={current.caption ?? albumTitle ?? ""}
              className="max-h-[80vh] max-w-full object-contain rounded-lg"
            />
            {current.caption && <p className="mt-4 text-tuna-mist text-sm">{current.caption}</p>}

            {displayPhotos.length > 1 && (
              <>
                <button
                  onClick={prev}
                  aria-label="Önceki fotoğraf"
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-white/70 hover:text-tuna-gold transition-colors"
                >
                  <ChevronLeft size={36} />
                </button>
                <button
                  onClick={next}
                  aria-label="Sonraki fotoğraf"
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-white/70 hover:text-tuna-gold transition-colors"
                >
                  <ChevronRight size={36} />
                </button>
                <p className="mt-3 text-xs text-tuna-mist">{index + 1} / {displayPhotos.length}</p>
              </>
            )}
          </>
        ) : (
          <p className="text-tuna-mist">Bu albümde henüz fotoğraf yok.</p>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
