"use client";

import { useEffect, useState } from "react";

export interface FieldDef {
  name: string;
  label: string;
  type?: "text" | "textarea" | "checkbox" | "number" | "date" | "datetime-local" | "select";
  options?: { value: string; label: string }[];
  required?: boolean;
}

interface Props {
  apiPath: string; // ör. /api/admin/players
  title: string;
  fields: FieldDef[];
  titleField: string; // listede ana satır olarak gösterilecek alan
  subtitleField?: string;
}

// Tekrar eden 20 admin modülü için tek tip liste + ekle/düzenle/sil arayüzü.
// Haberler modülünde olduğu gibi özel bir akış gerektiğinde bağımsız bir sayfa yazılır;
// diğer tüm modüller bu bileşeni saracak şekilde birkaç satırla tanımlanır.
export function GenericCrudManager({ apiPath, title, fields, titleField, subtitleField }: Props) {
  const [items, setItems] = useState<Record<string, any>[]>([]);
  const [form, setForm] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function emptyForm() {
    const base: Record<string, any> = {};
    fields.forEach((f) => (base[f.name] = f.type === "checkbox" ? false : ""));
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

      <h2 className="font-semibold mb-4">Tüm Kayıtlar</h2>
      {loading ? (
        <p className="text-tuna-mist">Yükleniyor...</p>
      ) : (
        <div className="space-y-2">
          {items.map((item) => (
            <div key={item.id} className="glass-panel p-4 flex items-center justify-between gap-4">
              <div>
                <p className="font-medium">{String(item[titleField] ?? "")}</p>
                {subtitleField && <p className="text-xs text-tuna-mist">{String(item[subtitleField] ?? "")}</p>}
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
