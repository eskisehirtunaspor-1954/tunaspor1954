"use client";

import { useEffect, useState } from "react";
import { ImageUpload } from "@/components/admin/ImageUpload";
import { VideoUpload } from "@/components/admin/VideoUpload";
import { FileUpload } from "@/components/admin/FileUpload";

export interface FieldDef {
  name: string;
  label: string;
  type?: "text" | "textarea" | "checkbox" | "number" | "date" | "datetime-local" | "select" | "image" | "video" | "file" | "gallery";
  options?: { value: string; label: string }[];
  required?: boolean;
  /** yalnızca type: "image"/"video" için — Storage'da dosyaların saklanacağı klasör adı */
  folder?: string;
}

interface Props {
  apiPath: string; // ör. /api/admin/players
  title: string;
  fields: FieldDef[];
  titleField: string; // listede ana satır olarak gösterilecek alan
  subtitleField?: string;
  /** true ise liste sürükle-bırak ile sıralanabilir olur ve "display_order" alanı PATCH ile güncellenir. */
  reorderable?: boolean;
}

// Tekrar eden 20 admin modülü için tek tip liste + ekle/düzenle/sil arayüzü.
// Haberler modülünde olduğu gibi özel bir akış gerektiğinde bağımsız bir sayfa yazılır;
// diğer tüm modüller bu bileşeni saracak şekilde birkaç satırla tanımlanır.
export function GenericCrudManager({ apiPath, title, fields, titleField, subtitleField, reorderable }: Props) {
  const [items, setItems] = useState<Record<string, any>[]>([]);
  const [form, setForm] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragId, setDragId] = useState<string | null>(null);

  function emptyForm() {
    const base: Record<string, any> = {};
    fields.forEach((f) => (base[f.name] = f.type === "checkbox" ? false : f.type === "gallery" ? [] : ""));
    return base;
  }

  async function load() {
    setLoading(true);
    const res = await fetch(apiPath);
    const data = await res.json();
    setItems(data.data ?? []);
    setLoading(false);
  }

  useEffect(() => {
    setForm(emptyForm());
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiPath]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const method = form.id ? "PATCH" : "POST";
    const res = await fetch(apiPath, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSaving(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Kaydedilemedi.");
      return;
    }
    setForm(emptyForm());
    load();
  }

  async function handleDelete(id: string) {
    if (!confirm("Bu kaydı silmek istediğinize emin misiniz?")) return;
    await fetch(`${apiPath}?id=${id}`, { method: "DELETE" });
    load();
  }

  // Sürükle-bırak sıralama: bırakma anında listeyi yerel olarak yeniden diz,
  // ardından yeni sırayı yansıtan her kaydın display_order'ını PATCH ile kaydet.
  async function handleDrop(targetId: string) {
    if (!dragId || dragId === targetId) { setDragId(null); return; }
    const from = items.findIndex((i) => i.id === dragId);
    const to = items.findIndex((i) => i.id === targetId);
    if (from === -1 || to === -1) { setDragId(null); return; }

    const reordered = [...items];
    const [moved] = reordered.splice(from, 1);
    reordered.splice(to, 0, moved);
    setItems(reordered);
    setDragId(null);

    await Promise.all(
      reordered.map((item, index) =>
        item.display_order === index
          ? null
          : fetch(apiPath, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ id: item.id, display_order: index }),
            })
      )
    );
    load();
  }

  return (
    <div className="min-h-screen px-4 py-10 max-w-6xl mx-auto">
      <h1 className="font-display text-3xl text-tuna-yellow mb-8">{title}</h1>

      <form onSubmit={handleSubmit} className="glass-panel p-6 space-y-3 mb-10">
        <h2 className="font-semibold mb-2">{form.id ? "Kaydı Düzenle" : "Yeni Kayıt"}</h2>
        {error && <p className="text-red-400 text-sm">{error}</p>}
        <div className="grid md:grid-cols-2 gap-3">
          {fields.map((f) => {
            if (f.type === "checkbox") {
              return (
                <label key={f.name} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={!!form[f.name]}
                    onChange={(e) => setForm({ ...form, [f.name]: e.target.checked })}
                  />
                  {f.label}
                </label>
              );
            }
            if (f.type === "textarea") {
              return (
                <textarea
                  key={f.name}
                  placeholder={f.label}
                  required={f.required}
                  rows={3}
                  value={form[f.name] ?? ""}
                  onChange={(e) => setForm({ ...form, [f.name]: e.target.value })}
                  className="md:col-span-2 bg-white/5 rounded-lg px-3 py-2 border border-white/10 outline-none focus:border-tuna-yellow"
                />
              );
            }
            if (f.type === "image") {
              return (
                <div key={f.name} className="md:col-span-2">
                  <label className="mb-1 block text-xs text-tuna-mist">{f.label}</label>
                  <ImageUpload
                    folder={f.folder ?? apiPath.split("/").filter(Boolean).pop() ?? "misc"}
                    value={form[f.name] || null}
                    onChange={(url) => setForm({ ...form, [f.name]: url ?? "" })}
                  />
                </div>
              );
            }
            if (f.type === "video") {
              return (
                <div key={f.name} className="md:col-span-2">
                  <label className="mb-1 block text-xs text-tuna-mist">{f.label}</label>
                  <VideoUpload
                    folder={f.folder ?? apiPath.split("/").filter(Boolean).pop() ?? "misc"}
                    value={form[f.name] || null}
                    onChange={(url) => setForm({ ...form, [f.name]: url ?? "" })}
                  />
                </div>
              );
            }
            if (f.type === "file") {
              return (
                <div key={f.name} className="md:col-span-2">
                  <label className="mb-1 block text-xs text-tuna-mist">{f.label}</label>
                  <FileUpload
                    folder={f.folder ?? apiPath.split("/").filter(Boolean).pop() ?? "misc"}
                    value={form[f.name] || null}
                    onChange={(url) => setForm({ ...form, [f.name]: url ?? "" })}
                  />
                </div>
              );
            }
            if (f.type === "gallery") {
              const urls: string[] = Array.isArray(form[f.name]) ? form[f.name] : [];
              return (
                <div key={f.name} className="md:col-span-2 space-y-2">
                  <label className="mb-1 block text-xs text-tuna-mist">{f.label}</label>
                  {urls.map((url, i) => (
                    <div key={i} className="flex items-center gap-3">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={url} alt="" className="h-14 w-14 rounded-lg object-cover border border-white/10" />
                      <button
                        type="button"
                        onClick={() => setForm({ ...form, [f.name]: urls.filter((_, j) => j !== i) })}
                        className="text-xs text-red-400"
                      >
                        Sil
                      </button>
                    </div>
                  ))}
                  <ImageUpload
                    folder={f.folder ?? apiPath.split("/").filter(Boolean).pop() ?? "misc"}
                    value={null}
                    onChange={(url) => url && setForm({ ...form, [f.name]: [...urls, url] })}
                  />
                </div>
              );
            }
            if (f.type === "select") {
              return (
                <select
                  key={f.name}
                  required={f.required}
                  value={form[f.name] ?? ""}
                  onChange={(e) => setForm({ ...form, [f.name]: e.target.value })}
                  className="bg-white/5 rounded-lg px-3 py-2 border border-white/10 outline-none focus:border-tuna-yellow"
                >
                  <option value="">{f.label} seçin</option>
                  {f.options?.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              );
            }
            return (
              <input
                key={f.name}
                type={f.type ?? "text"}
                required={f.required}
                placeholder={f.label}
                value={form[f.name] ?? ""}
                onChange={(e) => setForm({ ...form, [f.name]: e.target.value })}
                className="bg-white/5 rounded-lg px-3 py-2 border border-white/10 outline-none focus:border-tuna-yellow"
              />
            );
          })}
        </div>
        <div className="flex gap-3">
          <button disabled={saving} className="bg-tuna-yellow text-tuna-black font-semibold px-6 py-2 rounded-lg disabled:opacity-50">
            {saving ? "Kaydediliyor..." : form.id ? "Güncelle" : "Oluştur"}
          </button>
          {form.id && (
            <button type="button" onClick={() => setForm(emptyForm())} className="text-tuna-mist text-sm">
              İptal
            </button>
          )}
        </div>
      </form>

      <h2 className="font-semibold mb-4">Tüm Kayıtlar{reorderable && " (sürükleyerek sırala)"}</h2>
      {loading ? (
        <p className="text-tuna-mist">Yükleniyor...</p>
      ) : (
        <div className="space-y-2">
          {(reorderable
            ? [...items].sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0))
            : items
          ).map((item) => (
            <div
              key={item.id}
              draggable={reorderable}
              onDragStart={() => setDragId(item.id)}
              onDragOver={(e) => reorderable && e.preventDefault()}
              onDrop={() => reorderable && handleDrop(item.id)}
              className={`glass-panel p-4 flex items-center justify-between gap-4 ${
                reorderable ? "cursor-grab active:cursor-grabbing" : ""
              } ${dragId === item.id ? "opacity-40" : ""}`}
            >
              <div className="flex items-center gap-3">
                {reorderable && <span className="text-tuna-mist select-none">⠿</span>}
                <div>
                  <p className="font-medium">{String(item[titleField] ?? "")}</p>
                  {subtitleField && <p className="text-xs text-tuna-mist">{String(item[subtitleField] ?? "")}</p>}
                </div>
              </div>
              <div className="flex gap-2 shrink-0">
                <button onClick={() => setForm(item)} className="text-sm text-tuna-yellow">Düzenle</button>
                <button onClick={() => handleDelete(item.id)} className="text-sm text-red-400">Sil</button>
              </div>
            </div>
          ))}
          {!items.length && <p className="text-tuna-mist">Henüz kayıt eklenmedi.</p>}
        </div>
      )}
    </div>
  );
}
