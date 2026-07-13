"use client";

import { useRef, useState } from "react";
import { UploadCloud } from "lucide-react";
import { uploadFile } from "@/lib/admin/upload-client";

interface QueueItem {
  name: string;
  progress: number;
  done: boolean;
  error?: string;
}

interface BulkImageUploadProps {
  folder: string;
  disabled?: boolean;
  disabledHint?: string;
  onEachUploaded: (url: string) => Promise<void> | void;
}

// Bir albüme tek seferde birden fazla fotoğraf yüklemek için: sürükle-bırak/çoklu
// seçim, her dosya için ayrı ilerleme çubuğu, yüklendikçe `onEachUploaded` ile
// çağıran taraf (örn. gallery_photos satırı oluşturan galeri sayfası) haberdar edilir.
export function BulkImageUpload({ folder, disabled, disabledHint, onEachUploaded }: BulkImageUploadProps) {
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFiles(files: FileList | File[]) {
    const list = Array.from(files);
    const startIdx = queue.length;
    setQueue((q) => [...q, ...list.map((f) => ({ name: f.name, progress: 0, done: false }))]);

    for (let i = 0; i < list.length; i++) {
      const idx = startIdx + i;
      try {
        const result = await uploadFile(list[i], folder, "image", (pct) => {
          setQueue((q) => q.map((it, j) => (j === idx ? { ...it, progress: pct } : it)));
        });
        await onEachUploaded(result.url);
        setQueue((q) => q.map((it, j) => (j === idx ? { ...it, progress: 100, done: true } : it)));
      } catch (e) {
        setQueue((q) =>
          q.map((it, j) => (j === idx ? { ...it, progress: 100, done: true, error: e instanceof Error ? e.message : "Hata" } : it))
        );
      }
    }
  }

  if (disabled) {
    return <p className="text-xs text-tuna-mist">{disabledHint ?? "Önce bir albüm seçin."}</p>;
  }

  return (
    <div>
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          if (e.dataTransfer.files.length) handleFiles(e.dataTransfer.files);
        }}
        onClick={() => inputRef.current?.click()}
        className={`flex cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border border-dashed p-6 text-center text-xs transition-colors ${
          dragOver ? "border-tuna-yellow bg-tuna-yellow/5" : "border-white/15 hover:border-white/30"
        }`}
      >
        <UploadCloud size={22} className="text-tuna-mist" />
        <span className="text-tuna-mist">Birden fazla fotoğrafı sürükle bırak ya da tıkla</span>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => {
          if (e.target.files?.length) handleFiles(e.target.files);
          e.target.value = "";
        }}
      />
      {queue.length > 0 && (
        <div className="mt-3 space-y-1">
          {queue.map((it, i) => (
            <div key={i} className="flex items-center gap-2 text-[11px] text-tuna-mist">
              <span className="max-w-[140px] truncate">{it.name}</span>
              <div className="h-1 flex-1 overflow-hidden rounded-full bg-white/10">
                <div
                  className={`h-full ${it.error ? "bg-red-400" : "bg-tuna-yellow"}`}
                  style={{ width: `${it.progress}%` }}
                />
              </div>
              <span>{it.error ?? (it.done ? "✓" : `${it.progress}%`)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
