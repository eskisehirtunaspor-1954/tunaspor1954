"use client";

import { useEffect, useState } from "react";

interface NewsItem {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  content: string;
  cover_image_url: string | null;
  is_published: boolean;
  published_at: string | null;
}

const emptyForm = {
  slug: "", title: "", excerpt: "", content: "", cover_image_url: "", is_published: false,
};

export default function AdminHaberlerPage() {
  const [items, setItems] = useState<NewsItem[]>([]);
  const [form, setForm] = useState<typeof emptyForm & { id?: string }>(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    const res = await fetch("/api/admin/news");
    const data = await res.json();
    setItems(data.data ?? []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const method = form.id ? "PATCH" : "POST";
    const payload = form.id
      ? { ...form }
      : { ...form, published_at: form.is_published ? new Date().toISOString() : null };

    const res = await fetch("/api/admin/news", {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    setSaving(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Kaydedilemedi.");
      return;
    }
    setForm(emptyForm);
    load();
  }

  async function handleDelete(id: string) {
    if (!confirm("Bu haberi silmek istediğinize emin misiniz?")) return;
    await fetch(`/api/admin/news?id=${id}`, { method: "DELETE" });
    load();
  }

  function editItem(item: NewsItem) {
    setForm({
      id: item.id,
      slug: item.slug,
      title: item.title,
      excerpt: item.excerpt ?? "",
      content: item.content,
      cover_image_url: item.cover_image_url ?? "",
      is_published: item.is_published,
    });
  }

  return (
    <div className="min-h-screen px-4 py-10 max-w-6xl mx-auto">
      <h1 className="font-display text-3xl text-tuna-yellow mb-8">Haber Yönetimi</h1>

      <form onSubmit={handleSubmit} className="glass-panel p-6 space-y-3 mb-10">
        <h2 className="font-semibold mb-2">{form.id ? "Haberi Düzenle" : "Yeni Haber"}</h2>
        {error && <p className="text-red-400 text-sm">{error}</p>}
        <div className="grid md:grid-cols-2 gap-3">
          <input
            required placeholder="Başlık" value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            className="bg-white/5 rounded-lg px-3 py-2 border border-white/10 outline-none focus:border-tuna-yellow"
          />
          <input
            required placeholder="slug (ornek-haber-basligi)" value={form.slug}
            onChange={(e) => setForm({ ...form, slug: e.target.value })}
            className="bg-white/5 rounded-lg px-3 py-2 border border-white/10 outline-none focus:border-tuna-yellow"
          />
        </div>
        <input
          placeholder="Kapak görseli URL" value={form.cover_image_url}
          onChange={(e) => setForm({ ...form, cover_image_url: e.target.value })}
          className="w-full bg-white/5 rounded-lg px-3 py-2 border border-white/10 outline-none focus:border-tuna-yellow"
        />
        <textarea
          placeholder="Özet" value={form.excerpt} rows={2}
          onChange={(e) => setForm({ ...form, excerpt: e.target.value })}
          className="w-full bg-white/5 rounded-lg px-3 py-2 border border-white/10 outline-none focus:border-tuna-yellow"
        />
        <textarea
          required placeholder="İçerik" value={form.content} rows={6}
          onChange={(e) => setForm({ ...form, content: e.target.value })}
          className="w-full bg-white/5 rounded-lg px-3 py-2 border border-white/10 outline-none focus:border-tuna-yellow"
        />
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox" checked={form.is_published}
            onChange={(e) => setForm({ ...form, is_published: e.target.checked })}
          />
          Yayınla
        </label>
        <div className="flex gap-3">
          <button disabled={saving} className="bg-tuna-yellow text-tuna-black font-semibold px-6 py-2 rounded-lg disabled:opacity-50">
            {saving ? "Kaydediliyor..." : form.id ? "Güncelle" : "Oluştur"}
          </button>
          {form.id && (
            <button type="button" onClick={() => setForm(emptyForm)} className="text-tuna-mist text-sm">
              İptal
            </button>
          )}
        </div>
      </form>

      <h2 className="font-semibold mb-4">Tüm Haberler</h2>
      {loading ? (
        <p className="text-tuna-mist">Yükleniyor...</p>
      ) : (
        <div className="space-y-2">
          {items.map((n) => (
            <div key={n.id} className="glass-panel p-4 flex items-center justify-between gap-4">
              <div>
                <p className="font-medium">{n.title}</p>
                <p className="text-xs text-tuna-mist">
                  {n.is_published ? "Yayında" : "Taslak"} — /{n.slug}
                </p>
              </div>
              <div className="flex gap-2 shrink-0">
                <button onClick={() => editItem(n)} className="text-sm text-tuna-yellow">Düzenle</button>
                <button onClick={() => handleDelete(n.id)} className="text-sm text-red-400">Sil</button>
              </div>
            </div>
          ))}
          {!items.length && <p className="text-tuna-mist">Henüz haber eklenmedi.</p>}
        </div>
      )}
    </div>
  );
}
