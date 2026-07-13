"use client";

import { useEffect, useRef, useState } from "react";
import { FileText, UploadCloud, X } from "lucide-react";
import { uploadFile } from "@/lib/admin/upload-client";

interface Attachment {
  id: string;
  file_url: string;
  file_name: string;
}

interface QueueItem {
  name: string;
  progress: number;
  error?: string;
}

// Bir habere birden fazla PDF/DOCX belgesi eklemek için — kendi listesini
// (news_attachments) kendisi yönetir: yükler, kaydeder, siler. Yalnızca haber
// kaydedilip bir id aldıktan sonra kullanılabilir (bkz. haberler admin sayfası).
export function DocumentUpload({ newsId }: { newsId: string }) {
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function load() {
    fetch(`/api/admin/news-attachments?news_id=${newsId}`)
      .then((r) => r.json())
      .then((d) => setAttachments(d.data ?? []));
  }
  useEffect(() => { load(); }, [newsId]);

  async function handleFiles(files: FileList | File[]) {
    const list = Array.from(files);
    const startIdx = queue.length;
    setQueue((q) => [...q, ...list.map((f) => ({ name: f.name, progress: 0 }))]);

    for (let i = 0; i < list.length; i++) {
      const idx = startIdx + i;
      try {
        const result = await uploadFile(list[i], "news-docs", "document", (pct) => {
          setQueue((q) => q.map((it, j) => (j === idx ? { ...it, progress: pct } : it)));
        });
        await fetch("/api/admin/news-attachments", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ news_id: newsId, file_url: result.url, file_path: result.path, file_name: result.fileName }),
        });
        setQueue((q) => q.filter((_, j) => j !== idx));
        load();
      } catch (e) {
        setQueue((q) => q.map((it, j) => (j === idx ? { ...it, error: e instanceof Error ? e.message : "Hata" } : it)));
      }
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Bu belgeyi silmek istediğinize emin misiniz?")) return;
    await fetch(`/api/admin/news-attachments?id=${id}`, { method: "DELETE" });
    load();
  }

  return (
    <div className="md:col-span-2 space-y-3">
      <label className="block text-xs text-tuna-mist">Belgeler (PDF, Word)</label>

      {attachments.length > 0 && (
        <ul className="space-y-1">
          {attachments.map((a) => (
            <li key={a.id} className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs">
              <FileText size={14} className="shrink-0 text-tuna-gold" />
              <a href={a.file_url} target="_blank" rel="noopener noreferrer" className="flex-1 truncate hover:underline">
                {a.file_name}
              </a>
              <button type="button" onClick={() => handleDelete(a.id)} className="shrink-0 text-red-400">
                <X size={14} />
              </button>
            </li>
          ))}
        </ul>
      )}

      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          if (e.dataTransfer.files.length) handleFiles(e.dataTransfer.files);
        }}
        onClick={() => inputRef.current?.click()}
        className={`flex cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border border-dashed p-5 text-center text-xs transition-colors ${
          dragOver ? "border-tuna-yellow bg-tuna-yellow/5" : "border-white/15 hover:border-white/30"
        }`}
      >
        <UploadCloud size={20} className="text-tuna-mist" />
        <span className="text-tuna-mist">PDF/Word belgesi sürükle bırak ya da tıkla</span>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        multiple
        className="hidden"
        onChange={(e) => {
          if (e.target.files?.length) handleFiles(e.target.files);
          e.target.value = "";
        }}
      />

      {queue.map((it, i) => (
        <div key={i} className="flex items-center gap-2 text-[11px] text-tuna-mist">
          <span className="max-w-[160px] truncate">{it.name}</span>
          <div className="h-1 flex-1 overflow-hidden rounded-full bg-white/10">
            <div className={`h-full ${it.error ? "bg-red-400" : "bg-tuna-yellow"}`} style={{ width: `${it.progress}%` }} />
          </div>
          <span>{it.error ?? `${it.progress}%`}</span>
        </div>
      ))}
    </div>
  );
}
