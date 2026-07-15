"use client";
import { useEffect, useState } from "react";
import { GenericCrudManager } from "@/components/admin/GenericCrudManager";
import { uploadFile } from "@/lib/admin/upload-client";
import { FileText, UploadCloud, X } from "lucide-react";

interface ChatSession {
  session_id: string;
  started_at: string;
  messages: { role: string; message: string; created_at: string }[];
}

function ConversationHistory() {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [openId, setOpenId] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/ai-chat-logs").then((r) => r.json()).then((d) => setSessions(d.data ?? []));
  }, []);

  return (
    <div className="glass-panel p-6">
      <h2 className="font-semibold mb-4">Sohbet Geçmişi</h2>
      <div className="space-y-2 max-h-[32rem] overflow-y-auto">
        {sessions.map((s) => (
          <div key={s.session_id} className="border border-white/10 rounded-lg overflow-hidden">
            <button
              onClick={() => setOpenId(openId === s.session_id ? null : s.session_id)}
              className="w-full text-left px-3 py-2 text-sm hover:bg-white/5 flex items-center justify-between"
            >
              <span>{new Date(s.started_at).toLocaleString("tr-TR")} — {s.messages.length} mesaj</span>
              <span className="text-tuna-mist text-xs">{openId === s.session_id ? "Kapat" : "Görüntüle"}</span>
            </button>
            {openId === s.session_id && (
              <div className="px-3 pb-3 space-y-1.5 text-xs">
                {s.messages.map((m, i) => (
                  <div key={i} className={m.role === "user" ? "text-tuna-gold" : "text-tuna-mist"}>
                    <strong>{m.role === "user" ? "Ziyaretçi: " : "Golden Wolf: "}</strong>{m.message}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
        {!sessions.length && <p className="text-tuna-mist text-sm">Henüz kaydedilmiş bir sohbet yok.</p>}
      </div>
    </div>
  );
}

interface Settings {
  assistant_name?: string;
  welcome_message?: string;
  system_message_extra?: string;
  banned_topics?: string;
}

function SettingsPanel() {
  const [settings, setSettings] = useState<Settings>({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch("/api/admin/ai-settings").then((r) => r.json()).then((d) => setSettings(d.data ?? {}));
  }, []);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    await fetch("/api/admin/ai-settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(settings),
    });
    setSaving(false);
    setSaved(true);
  }

  return (
    <form onSubmit={save} className="glass-panel p-6 space-y-3">
      <h2 className="font-semibold mb-2">Golden Wolf — Ayarlar</h2>
      <label className="block">
        <span className="text-xs text-tuna-mist block mb-1">Asistan Adı</span>
        <input
          value={settings.assistant_name ?? ""}
          onChange={(e) => setSettings({ ...settings, assistant_name: e.target.value })}
          placeholder="Golden Wolf"
          className="w-full bg-white/5 rounded-lg px-3 py-2 border border-white/10 outline-none focus:border-tuna-yellow"
        />
      </label>
      <label className="block">
        <span className="text-xs text-tuna-mist block mb-1">Karşılama Mesajı (sohbet ilk açıldığında görünür)</span>
        <textarea
          value={settings.welcome_message ?? ""}
          onChange={(e) => setSettings({ ...settings, welcome_message: e.target.value })}
          rows={2}
          className="w-full bg-white/5 rounded-lg px-3 py-2 border border-white/10 outline-none focus:border-tuna-yellow"
        />
      </label>
      <label className="block">
        <span className="text-xs text-tuna-mist block mb-1">Ek Sistem Talimatı (isteğe bağlı — asistanın davranışına eklenir)</span>
        <textarea
          value={settings.system_message_extra ?? ""}
          onChange={(e) => setSettings({ ...settings, system_message_extra: e.target.value })}
          rows={3}
          className="w-full bg-white/5 rounded-lg px-3 py-2 border border-white/10 outline-none focus:border-tuna-yellow"
        />
      </label>
      <label className="block">
        <span className="text-xs text-tuna-mist block mb-1">Yasaklı / Kaçınılması Gereken Konular (isteğe bağlı)</span>
        <textarea
          value={settings.banned_topics ?? ""}
          onChange={(e) => setSettings({ ...settings, banned_topics: e.target.value })}
          rows={2}
          className="w-full bg-white/5 rounded-lg px-3 py-2 border border-white/10 outline-none focus:border-tuna-yellow"
        />
      </label>
      <button disabled={saving} className="bg-tuna-yellow text-tuna-black font-semibold px-5 py-2 rounded-lg disabled:opacity-50">
        {saving ? "Kaydediliyor..." : "Kaydet"}
      </button>
      {saved && <span className="ml-3 text-xs text-green-400">Kaydedildi.</span>}
    </form>
  );
}

interface AiDocument {
  id: string;
  title: string;
  file_url: string;
  file_type: "pdf" | "word" | "excel";
  content_summary?: string;
  is_active: boolean;
}

function fileTypeFromMime(mime: string): AiDocument["file_type"] {
  if (mime === "application/pdf") return "pdf";
  if (mime.includes("spreadsheet") || mime.includes("excel")) return "excel";
  return "word";
}

function DocumentsPanel() {
  const [docs, setDocs] = useState<AiDocument[]>([]);
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  function load() {
    fetch("/api/admin/ai-documents").then((r) => r.json()).then((d) => setDocs(d.data ?? []));
  }
  useEffect(() => { load(); }, []);

  async function handleFile(file: File) {
    if (!title.trim()) {
      alert("Önce belge başlığı girin.");
      return;
    }
    setUploading(true);
    try {
      const result = await uploadFile(file, "ai-documents", "document");
      await fetch("/api/admin/ai-documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          file_url: result.url,
          file_type: fileTypeFromMime(file.type),
          content_summary: summary || null,
          is_active: true,
        }),
      });
      setTitle("");
      setSummary("");
      load();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Yükleme başarısız.");
    } finally {
      setUploading(false);
    }
  }

  async function toggleActive(d: AiDocument) {
    await fetch("/api/admin/ai-documents", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: d.id, is_active: !d.is_active }),
    });
    load();
  }

  async function remove(id: string) {
    if (!confirm("Bu belgeyi silmek istediğinize emin misiniz?")) return;
    await fetch(`/api/admin/ai-documents?id=${id}`, { method: "DELETE" });
    load();
  }

  return (
    <div className="glass-panel p-6 space-y-4">
      <h2 className="font-semibold">Belgeler (PDF / Word / Excel)</h2>
      <p className="text-xs text-tuna-mist">
        Belgenin kendisi indirilebilir olarak saklanır; "özet" alanına yazdığınız metin Golden Wolf'un
        bilgi tabanına eklenir (belgenin tam içeriği otomatik okunmaz).
      </p>
      <div className="grid md:grid-cols-2 gap-3">
        <input
          placeholder="Belge başlığı"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="bg-white/5 rounded-lg px-3 py-2 border border-white/10 outline-none focus:border-tuna-yellow"
        />
        <input
          placeholder="Kısa özet (yapay zekaya beslenir)"
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
          className="bg-white/5 rounded-lg px-3 py-2 border border-white/10 outline-none focus:border-tuna-yellow"
        />
      </div>
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]);
        }}
        onClick={() => document.getElementById("ai-doc-input")?.click()}
        className={`flex cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border border-dashed p-6 text-center text-xs transition-colors ${
          dragOver ? "border-tuna-yellow bg-tuna-yellow/5" : "border-white/15 hover:border-white/30"
        }`}
      >
        <UploadCloud size={20} className="text-tuna-mist" />
        <span className="text-tuna-mist">{uploading ? "Yükleniyor..." : "PDF/Word/Excel sürükle bırak ya da tıkla"}</span>
      </div>
      <input
        id="ai-doc-input"
        type="file"
        accept=".pdf,.doc,.docx,.xls,.xlsx"
        className="hidden"
        onChange={(e) => { if (e.target.files?.[0]) handleFile(e.target.files[0]); e.target.value = ""; }}
      />

      <div className="space-y-2">
        {docs.map((d) => (
          <div key={d.id} className="flex items-center gap-3 border border-white/10 rounded-lg px-3 py-2 text-sm">
            <FileText size={16} className="text-tuna-gold shrink-0" />
            <a href={d.file_url} target="_blank" rel="noopener noreferrer" className="flex-1 truncate hover:underline">
              {d.title}
            </a>
            <button onClick={() => toggleActive(d)} className={`text-xs ${d.is_active ? "text-green-400" : "text-tuna-mist"}`}>
              {d.is_active ? "Aktif" : "Pasif"}
            </button>
            <button onClick={() => remove(d.id)} className="text-red-400"><X size={15} /></button>
          </div>
        ))}
        {!docs.length && <p className="text-tuna-mist text-sm">Henüz belge yüklenmedi.</p>}
      </div>
    </div>
  );
}

export default function Page() {
  return (
    <div className="space-y-10 pb-10">
      <div className="max-w-6xl mx-auto px-4 pt-10 space-y-6">
        <h1 className="font-display text-3xl text-tuna-yellow">🐺 Golden Wolf Yönetimi</h1>
        <p className="text-sm text-tuna-mist glass-panel p-4">
          Buradaki tüm içerikler (bilgi tabanı, SSS, belgeler, ayarlar) Golden Wolf'un
          yanıt üretirken kullandığı bilgi kaynağıdır. Asistan yalnızca burada aktif
          olan içeriklere ve kulüp veritabanına dayanarak yanıt üretir.
        </p>
        <SettingsPanel />
      </div>

      <div className="max-w-6xl mx-auto px-4">
        <GenericCrudManager
          apiPath="/api/admin/ai-faqs"
          title="Sıkça Sorulan Sorular (SSS)"
          titleField="question"
          fields={[
            { name: "question", label: "Soru", required: true },
            { name: "answer", label: "Cevap", type: "textarea", required: true },
            { name: "is_active", label: "Aktif", type: "checkbox" },
          ]}
        />
      </div>

      <div className="max-w-6xl mx-auto px-4">
        <DocumentsPanel />
      </div>

      <GenericCrudManager
        apiPath="/api/admin/ai-knowledge-base"
        title="Bilgi Tabanı (Genel Konular)"
        titleField="topic"
        fields={[
          { name: "topic", label: "Konu Başlığı", required: true },
          { name: "content", label: "İçerik", type: "textarea", required: true },
          { name: "is_active", label: "Aktif", type: "checkbox" },
        ]}
      />
      <div className="max-w-6xl mx-auto px-4">
        <ConversationHistory />
      </div>
    </div>
  );
}
