"use client";

import { useEffect, useRef, useState } from "react";
import { uploadFile, deleteUploadedFile, storagePathFromUrl } from "@/lib/admin/upload-client";

interface SoundAsset {
  key: string;
  file_url: string | null;
  volume: number;
  loop: boolean;
  is_active: boolean;
  autoplay: boolean;
  custom_label: string | null;
}

interface AudioFile {
  name: string;
  url: string;
}

const KEY_LABEL: Record<string, string> = {
  "wolf-howl": "Açılış Kurt Uluması",
  "stadium-ambience": "Taraftar Atmosferi",
  crowd: "Tunaspor Tezahüratı",
  goal: "Gol Sesi",
  "menu-open": "Menü Açılma Sesi",
  click: "Buton Tıklama Sesi",
  notification: "Bildirim Sesi",
  background: "Genel Arka Plan",
  wind: "Rüzgar",
  "menu-close": "Menü Kapanış Sesi",
  whistle: "Hakem Düdüğü",
  success: "Başarı Efekti",
  error: "Hata Efekti",
};

// Kullanıcının istediği 7 birincil kategori, tam olarak istenen sırayla;
// geri kalanı ("Diğer Sesler") ayrı ve katlanabilir bir bölümde gösterilir.
const PRIMARY_KEYS = ["wolf-howl", "stadium-ambience", "crowd", "goal", "menu-open", "click", "notification"];

// Modül seviyesinde tanımlı — sayfa bileşeninin içinde tanımlansaydı her
// render'da yeni bir bileşen tipi sayılır ve satırlar (aktif sürükleme/yazma
// sırasında bile) yeniden bağlanırdı. Tüm veri/aksiyonlar prop olarak gelir.
function AssetRow({
  asset, audioFiles, uploadingKey, playingKey, onPatch, onUpload, onDelete, onPickFromFolder, onTogglePreview,
}: {
  asset: SoundAsset;
  audioFiles: AudioFile[];
  uploadingKey: string | null;
  playingKey: string | null;
  onPatch: (key: string, updates: Partial<SoundAsset>) => void;
  onUpload: (key: string, file: File) => void;
  onDelete: (asset: SoundAsset) => void;
  onPickFromFolder: (key: string, url: string) => void;
  onTogglePreview: (asset: SoundAsset) => void;
}) {
  const [labelDraft, setLabelDraft] = useState(asset.custom_label ?? "");
  useEffect(() => setLabelDraft(asset.custom_label ?? ""), [asset.custom_label]);

  return (
    <div className="glass-panel p-4 space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        <input
          value={labelDraft}
          placeholder={KEY_LABEL[asset.key] ?? asset.key}
          onChange={(e) => setLabelDraft(e.target.value)}
          onBlur={() => { if (labelDraft !== (asset.custom_label ?? "")) onPatch(asset.key, { custom_label: labelDraft || null }); }}
          className="min-w-[200px] flex-1 bg-white/5 rounded-lg px-3 py-2 text-sm font-medium border border-white/10 outline-none focus:border-tuna-yellow"
        />
        <button
          onClick={() => onTogglePreview(asset)}
          className="text-xs text-tuna-gold border border-tuna-gold/30 rounded-full px-3 py-1.5 hover:bg-tuna-gold/10 shrink-0"
        >
          {playingKey === asset.key ? "⏸ Duraklat" : "▶ Önizle"}
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <label className="text-xs text-tuna-mist">
          <input
            type="file"
            accept="audio/*"
            className="hidden"
            onChange={(e) => { if (e.target.files?.[0]) onUpload(asset.key, e.target.files[0]); e.target.value = ""; }}
          />
          <span
            className="cursor-pointer border border-white/15 rounded-full px-3 py-1.5 hover:border-white/30 inline-block"
            onClick={(e) => (e.currentTarget.previousSibling as HTMLInputElement)?.click()}
          >
            {uploadingKey === asset.key ? "Yükleniyor..." : asset.file_url ? "Dosyayı Değiştir" : "Dosya Yükle"}
          </span>
        </label>

        <select
          value=""
          onChange={(e) => onPickFromFolder(asset.key, e.target.value)}
          className="bg-white/5 rounded-lg px-2 py-1.5 text-xs border border-white/10 max-w-[200px]"
        >
          <option value="">public/audio&apos;dan seç...</option>
          {audioFiles.map((f) => (
            <option key={f.name} value={f.url}>{f.name}</option>
          ))}
        </select>

        {asset.file_url && (
          <button onClick={() => onDelete(asset)} className="text-xs text-red-400 hover:underline">
            Dosyayı Sil
          </button>
        )}

        {asset.file_url && (
          <span className="text-[11px] text-tuna-mist truncate max-w-[220px]" title={asset.file_url}>
            {asset.file_url.split("/").pop()}
          </span>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <label className="flex items-center gap-1.5 text-xs text-tuna-mist">
          <input type="checkbox" checked={asset.is_active} onChange={(e) => onPatch(asset.key, { is_active: e.target.checked })} disabled={!asset.file_url} />
          Aktif
        </label>
        <label className="flex items-center gap-1.5 text-xs text-tuna-mist">
          <input type="checkbox" checked={asset.loop} onChange={(e) => onPatch(asset.key, { loop: e.target.checked })} />
          Döngü (Loop)
        </label>
        <label className="flex items-center gap-1.5 text-xs text-tuna-mist">
          <input type="checkbox" checked={asset.autoplay} onChange={(e) => onPatch(asset.key, { autoplay: e.target.checked })} />
          Otomatik Başlat
        </label>
        <label className="flex items-center gap-1.5 text-xs text-tuna-mist">
          Ses Seviyesi
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={asset.volume}
            onChange={(e) => onPatch(asset.key, { volume: parseFloat(e.target.value) })}
            className="accent-tuna-gold w-24"
          />
        </label>
      </div>
    </div>
  );
}

export default function SesYonetimiPage() {
  const [assets, setAssets] = useState<SoundAsset[]>([]);
  const [audioFiles, setAudioFiles] = useState<AudioFile[]>([]);
  const [uploadingKey, setUploadingKey] = useState<string | null>(null);
  const [playingKey, setPlayingKey] = useState<string | null>(null);
  const [showOthers, setShowOthers] = useState(false);
  const previewAudioRef = useRef<HTMLAudioElement | null>(null);

  function load() {
    fetch("/api/admin/sound-assets").then((r) => r.json()).then((d) => setAssets(d.data ?? []));
    fetch("/api/admin/audio-files").then((r) => r.json()).then((d) => setAudioFiles(d.data ?? []));
  }
  useEffect(() => {
    load();
    return () => { previewAudioRef.current?.pause(); };
  }, []);

  async function patch(key: string, updates: Partial<SoundAsset>) {
    setAssets((prev) => prev.map((a) => (a.key === key ? { ...a, ...updates } : a)));
    await fetch("/api/admin/sound-assets", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key, ...updates }),
    });
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

  async function handleDelete(asset: SoundAsset) {
    if (!asset.file_url) return;
    if (!confirm("Bu ses dosyasını kaldırmak istediğinize emin misiniz?")) return;
    const path = storagePathFromUrl(asset.file_url);
    if (path) deleteUploadedFile(path).catch(() => {});
    await patch(asset.key, { file_url: null, is_active: false });
  }

  function handlePickFromFolder(key: string, url: string) {
    if (!url) return;
    patch(key, { file_url: url, is_active: true });
  }

  function togglePreview(asset: SoundAsset) {
    if (playingKey === asset.key) {
      previewAudioRef.current?.pause();
      setPlayingKey(null);
      return;
    }
    previewAudioRef.current?.pause();
    const src = asset.is_active && asset.file_url ? asset.file_url : null;
    if (!src) {
      alert("Bu ses için henüz bir dosya seçilmedi.");
      return;
    }
    const audio = new Audio(src);
    audio.volume = asset.volume;
    audio.onended = () => setPlayingKey(null);
    audio.play().catch(() => alert("Bu ses dosyası oynatılamıyor."));
    previewAudioRef.current = audio;
    setPlayingKey(asset.key);
  }

  const primary = PRIMARY_KEYS.map((k) => assets.find((a) => a.key === k)).filter((a): a is SoundAsset => !!a);
  const others = assets.filter((a) => !PRIMARY_KEYS.includes(a.key));

  const rowProps = {
    audioFiles, uploadingKey, playingKey,
    onPatch: patch, onUpload: handleUpload, onDelete: handleDelete,
    onPickFromFolder: handlePickFromFolder, onTogglePreview: togglePreview,
  };

  return (
    <div className="min-h-screen px-4 py-10 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="font-display text-3xl text-tuna-yellow mb-2">🔊 Ses Yönetimi</h1>
        <p className="text-sm text-tuna-mist glass-panel p-4">
          Yeni bir ses dosyasını doğrudan <code>public/audio</code> klasörüne eklerseniz (kod
          değişikliği gerekmez), aşağıdaki &quot;public/audio&apos;dan seç&quot; menüsünden seçip
          kaydedebilirsiniz. Dilerseniz bu panelden doğrudan dosya da yükleyebilirsiniz.
          Tüm ayarlar (aktiflik, seviye, döngü, otomatik başlatma) veritabanında saklanır ve
          sayfa yenilense de kaybolmaz.
        </p>
      </div>

      <div className="space-y-3">
        {primary.map((a) => <AssetRow key={a.key} asset={a} {...rowProps} />)}
        {!assets.length && <p className="text-tuna-mist text-sm">Yükleniyor...</p>}
      </div>

      {others.length > 0 && (
        <div>
          <button onClick={() => setShowOthers((v) => !v)} className="text-sm text-tuna-mist hover:text-tuna-gold mb-3">
            Diğer Sesler ({others.length}) {showOthers ? "▾" : "▸"}
          </button>
          {showOthers && (
            <div className="space-y-3">
              {others.map((a) => <AssetRow key={a.key} asset={a} {...rowProps} />)}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
