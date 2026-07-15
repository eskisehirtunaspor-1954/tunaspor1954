"use client";

import { useEffect, useState } from "react";
import { uploadFile } from "@/lib/admin/upload-client";

interface SoundAsset {
  key: string;
  file_url: string | null;
  volume: number;
  loop: boolean;
  is_active: boolean;
}

const KEY_LABEL: Record<string, string> = {
  background: "Genel Arka Plan",
  "stadium-ambience": "Stadyum Atmosferi",
  crowd: "Tribün Tezahüratı",
  "wolf-howl": "Kurt Uluması",
  wind: "Rüzgar",
  goal: "Gol Sevinci",
  whistle: "Hakem Düdüğü",
  click: "Buton Tıklama",
  notification: "Bildirim",
  "menu-open": "Menü Açılış",
  "menu-close": "Menü Kapanış",
  success: "Başarı Efekti",
  error: "Hata Efekti",
};

export default function SesYonetimiPage() {
  const [assets, setAssets] = useState<SoundAsset[]>([]);
  const [uploadingKey, setUploadingKey] = useState<string | null>(null);

  function load() {
    fetch("/api/admin/sound-assets").then((r) => r.json()).then((d) => setAssets(d.data ?? []));
  }
  useEffect(() => { load(); }, []);

  async function patch(key: string, updates: Partial<SoundAsset>) {
    await fetch("/api/admin/sound-assets", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key, ...updates }),
    });
    load();
  }

  async function handleUpload(key: string, file: File) {
    setUploadingKey(key);
    try {
      const result = await uploadFile(file, "sound-assets", "audio");
      await patch(key, { file_url: result.url, is_active: true });
    } catch (e) {
      alert(e instanceof Error ? e.message : "Yükleme başarısız.");
    } finally {
      setUploadingKey(null);
    }
  }

  function preview(asset: SoundAsset) {
    const src = asset.is_active && asset.file_url ? asset.file_url : `/audio/${asset.key}.mp3`;
    const audio = new Audio(src);
    audio.volume = asset.volume;
    audio.play().catch(() => alert("Bu ses dosyası henüz yüklenmemiş veya oynatılamıyor."));
  }

  return (
    <div className="min-h-screen px-4 py-10 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="font-display text-3xl text-tuna-yellow mb-2">🔊 Ses Yönetimi</h1>
        <p className="text-sm text-tuna-mist glass-panel p-4">
          Her ses için varsayılan olarak <code>public/audio/&#123;dosya adı&#125;.mp3</code> kullanılır.
          Buradan özel bir dosya yükleyip aktif ederseniz, o ses için varsayılanın yerine
          yüklediğiniz dosya kullanılır — kod değişikliği gerekmez.
        </p>
      </div>

      <div className="space-y-2">
        {assets.map((a) => (
          <div key={a.key} className="glass-panel p-4 flex flex-wrap items-center gap-3">
            <div className="min-w-[160px]">
              <p className="text-sm font-medium">{KEY_LABEL[a.key] ?? a.key}</p>
              <p className="text-[11px] text-tuna-mist">/audio/{a.key}.mp3</p>
            </div>

            <label className="text-xs text-tuna-mist">
              <input
                type="file"
                accept="audio/*"
                className="hidden"
                onChange={(e) => { if (e.target.files?.[0]) handleUpload(a.key, e.target.files[0]); e.target.value = ""; }}
              />
              <span
                className="cursor-pointer border border-white/15 rounded-full px-3 py-1.5 hover:border-white/30"
                onClick={(e) => (e.currentTarget.previousSibling as HTMLInputElement)?.click()}
              >
                {uploadingKey === a.key ? "Yükleniyor..." : "Dosya Yükle"}
              </span>
            </label>

            <label className="flex items-center gap-1.5 text-xs text-tuna-mist">
              <input type="checkbox" checked={a.is_active} onChange={(e) => patch(a.key, { is_active: e.target.checked })} disabled={!a.file_url} />
              Özel dosya aktif
            </label>

            <label className="flex items-center gap-1.5 text-xs text-tuna-mist">
              <input type="checkbox" checked={a.loop} onChange={(e) => patch(a.key, { loop: e.target.checked })} />
              Loop
            </label>

            <label className="flex items-center gap-1.5 text-xs text-tuna-mist">
              Seviye
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={a.volume}
                onChange={(e) => patch(a.key, { volume: parseFloat(e.target.value) })}
                className="accent-tuna-gold w-20"
              />
            </label>

            <button onClick={() => preview(a)} className="text-xs text-tuna-gold border border-tuna-gold/30 rounded-full px-3 py-1.5 hover:bg-tuna-gold/10">
              ▶ Önizle
            </button>
          </div>
        ))}
        {!assets.length && <p className="text-tuna-mist text-sm">Yükleniyor...</p>}
      </div>
    </div>
  );
}
