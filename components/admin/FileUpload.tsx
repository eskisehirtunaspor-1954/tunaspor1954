"use client";

import { useRef, useState } from "react";
import { FileText, UploadCloud } from "lucide-react";
import { uploadFile, deleteUploadedFile, storagePathFromUrl } from "@/lib/admin/upload-client";

interface FileUploadProps {
  folder: string;
  value: string | null;
  onChange: (url: string | null) => void;
  accept?: string;
}

// Tekli belge yükleme (PDF özgeçmiş vb.) — ImageUpload ile aynı desen,
// önizleme yerine dosya adı/bağlantısı gösterir.
export function FileUpload({ folder, value, onChange, accept = ".pdf,application/pdf" }: FileUploadProps) {
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function upload(file: File) {
    setError(null);
    setProgress(0);
    try {
      const result = await uploadFile(file, folder, "document", setProgress);
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
        <div className="flex items-center gap-3 text-xs">
          <FileText size={16} className="shrink-0 text-tuna-gold" />
          <a href={value} target="_blank" rel="noopener noreferrer" className="flex-1 truncate hover:underline">
            {value.split("/").pop()}
          </a>
          <button type="button" onClick={() => inputRef.current?.click()} className="text-tuna-yellow shrink-0">
            Değiştir
          </button>
          <button type="button" onClick={handleRemove} className="text-red-400 shrink-0">
            Sil
          </button>
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
          className={`flex cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border border-dashed p-5 text-center text-xs transition-colors ${
            dragOver ? "border-tuna-yellow bg-tuna-yellow/5" : "border-white/15 hover:border-white/30"
          }`}
        >
          <UploadCloud size={20} className="text-tuna-mist" />
          <span className="text-tuna-mist">PDF sürükle bırak ya da tıkla</span>
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={accept}
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
