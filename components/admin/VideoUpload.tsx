"use client";

import { useRef, useState } from "react";
import { UploadCloud } from "lucide-react";
import { uploadFile, deleteUploadedFile, storagePathFromUrl } from "@/lib/admin/upload-client";

interface VideoUploadProps {
  folder: string;
  value: string | null;
  onChange: (url: string | null) => void;
}

// Tekli video dosyası yükleme — haberler için "kapak görseli" ile aynı desen,
// ama <video> önizlemesi ve daha büyük dosya boyutu sınırı (200MB) ile.
export function VideoUpload({ folder, value, onChange }: VideoUploadProps) {
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function upload(file: File) {
    setError(null);
    setProgress(0);
    try {
      const result = await uploadFile(file, folder, "video", setProgress);
      onChange(result.url);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Yükleme başarısız oldu.");
    } finally {
      setProgress(null);
    }
  }

  function handleRemove() {
    if (value) {
      const path = storagePathFromUrl(value);
      if (path) deleteUploadedFile(path).catch(() => {});
    }
    onChange(null);
  }

  return (
    <div className="md:col-span-2">
      {value ? (
        <div className="space-y-2">
          <video src={value} controls className="max-h-56 w-full rounded-lg border border-white/10 bg-black" />
          <div className="flex gap-3 text-xs">
            <button type="button" onClick={() => inputRef.current?.click()} className="text-tuna-yellow">
              Değiştir
            </button>
            <button type="button" onClick={handleRemove} className="text-red-400">
              Sil
            </button>
          </div>
        </div>
      ) : (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            const file = e.dataTransfer.files?.[0];
            if (file) upload(file);
          }}
          onClick={() => inputRef.current?.click()}
          className={`flex cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border border-dashed p-6 text-center text-xs transition-colors ${
            dragOver ? "border-tuna-yellow bg-tuna-yellow/5" : "border-white/15 hover:border-white/30"
          }`}
        >
          <UploadCloud size={22} className="text-tuna-mist" />
          <span className="text-tuna-mist">Video dosyasını sürükle bırak ya da tıkla (en fazla 200MB)</span>
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="video/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) upload(file);
          e.target.value = "";
        }}
      />

      {progress !== null && (
        <div className="mt-2 h-1.5 w-full max-w-xs overflow-hidden rounded-full bg-white/10">
          <div className="h-full bg-tuna-yellow transition-all" style={{ width: `${progress}%` }} />
        </div>
      )}
      {error && <p className="mt-1 text-xs text-red-400">{error}</p>}
    </div>
  );
}
