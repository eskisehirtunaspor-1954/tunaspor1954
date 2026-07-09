"use client";

import { useEffect, useState } from "react";

interface SiteSettings {
  site_name?: string; logo_url?: string; primary_color?: string;
  maintenance_mode?: boolean; founded_year?: number;
  atmosphere_mode?: string; weather_mode?: string; achievements_count?: number;
  lightning_intensity?: string; intro_mode?: string;
}

export default function Page() {
  const [settings, setSettings] = useState<SiteSettings>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/admin/site-settings").then((r) => r.json()).then((d) => setSettings(d.data ?? {}));
  }, []);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    await fetch("/api/admin/site-settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(settings),
    });
    setSaving(false);
  }

  return (
    <div className="min-h-screen px-4 py-10 max-w-2xl mx-auto">
      <h1 className="font-display text-3xl text-tuna-gold mb-8">Site Ayarları</h1>
      <form onSubmit={save} className="glass-panel p-6 space-y-3">
        <input
          placeholder="Site Adı" value={settings.site_name ?? ""}
          onChange={(e) => setSettings({ ...settings, site_name: e.target.value })}
          className="w-full bg-white/5 rounded-lg px-3 py-2 border border-white/10 outline-none focus:border-tuna-gold"
        />
        <input
          placeholder="Logo URL" value={settings.logo_url ?? ""}
          onChange={(e) => setSettings({ ...settings, logo_url: e.target.value })}
          className="w-full bg-white/5 rounded-lg px-3 py-2 border border-white/10 outline-none focus:border-tuna-gold"
        />
        <input
          type="color" value={settings.primary_color ?? "#FFD700"}
          onChange={(e) => setSettings({ ...settings, primary_color: e.target.value })}
          className="w-full h-10 bg-white/5 rounded-lg border border-white/10"
        />
        <input
          type="number" placeholder="Kuruluş Yılı" value={settings.founded_year ?? ""}
          onChange={(e) => setSettings({ ...settings, founded_year: parseInt(e.target.value) })}
          className="w-full bg-white/5 rounded-lg px-3 py-2 border border-white/10 outline-none focus:border-tuna-gold"
        />
        <input
          type="number" placeholder="Başarı Sayısı (şampiyonluk, kupa vb.)" value={settings.achievements_count ?? ""}
          onChange={(e) => setSettings({ ...settings, achievements_count: parseInt(e.target.value) })}
          className="w-full bg-white/5 rounded-lg px-3 py-2 border border-white/10 outline-none focus:border-tuna-gold"
        />

        <div className="pt-3 border-t border-white/10">
          <label className="block text-xs text-tuna-mist mb-1">Sahne Modu (Gündüz/Gün Batımı/Gece)</label>
          <select
            value={settings.atmosphere_mode ?? "otomatik"}
            onChange={(e) => setSettings({ ...settings, atmosphere_mode: e.target.value })}
            className="w-full bg-white/5 rounded-lg px-3 py-2 border border-white/10 outline-none focus:border-tuna-gold"
          >
            <option value="otomatik">Otomatik (gerçek saate göre)</option>
            <option value="sabah">Sabah</option>
            <option value="ogle">Öğle</option>
            <option value="aksam">Akşam</option>
            <option value="gece">Gece</option>
          </select>
        </div>

        <div>
          <label className="block text-xs text-tuna-mist mb-1">Hava Durumu Efekti</label>
          <select
            value={settings.weather_mode ?? "otomatik"}
            onChange={(e) => setSettings({ ...settings, weather_mode: e.target.value })}
            className="w-full bg-white/5 rounded-lg px-3 py-2 border border-white/10 outline-none focus:border-tuna-gold"
          >
            <option value="otomatik">Otomatik (gerçek hava durumuna göre)</option>
            <option value="acik">Açık / Güneşli</option>
            <option value="parcali_bulutlu">Parçalı Bulutlu</option>
            <option value="bulutlu">Bulutlu</option>
            <option value="yagmurlu">Yağmurlu</option>
            <option value="karli">Karlı</option>
            <option value="sisli">Sisli</option>
            <option value="firtinali">Fırtınalı</option>
          </select>
        </div>

        <div>
          <label className="block text-xs text-tuna-mist mb-1">
            Şimşek Yoğunluğu (yalnızca "Fırtınalı" hava durumu aktifken etkili)
          </label>
          <select
            value={settings.lightning_intensity ?? "orta"}
            onChange={(e) => setSettings({ ...settings, lightning_intensity: e.target.value })}
            className="w-full bg-white/5 rounded-lg px-3 py-2 border border-white/10 outline-none focus:border-tuna-gold"
          >
            <option value="dusuk">Düşük (seyrek çakma)</option>
            <option value="orta">Orta</option>
            <option value="yuksek">Yüksek (sık çakma)</option>
          </select>
        </div>

        <div>
          <label className="block text-xs text-tuna-mist mb-1">Giriş (İntro) Videosu Oynatma Modu</label>
          <select
            value={settings.intro_mode ?? "once_per_session"}
            onChange={(e) => setSettings({ ...settings, intro_mode: e.target.value })}
            className="w-full bg-white/5 rounded-lg px-3 py-2 border border-white/10 outline-none focus:border-tuna-gold"
          >
            <option value="once_per_session">Oturum başına bir kez (önerilen)</option>
            <option value="always">Her sayfa yüklemesinde göster</option>
            <option value="disabled">Devre dışı — hiç gösterme</option>
          </select>
        </div>

        <label className="flex items-center gap-2 text-sm pt-2">
          <input
            type="checkbox" checked={!!settings.maintenance_mode}
            onChange={(e) => setSettings({ ...settings, maintenance_mode: e.target.checked })}
          />
          Bakım Modu
        </label>
        <button disabled={saving} className="bg-tuna-gold text-tuna-black font-semibold px-6 py-2 rounded-lg disabled:opacity-50">
          {saving ? "Kaydediliyor..." : "Kaydet"}
        </button>
      </form>
    </div>
  );
}
