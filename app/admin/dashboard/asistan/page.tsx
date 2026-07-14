"use client";
import { useEffect, useState } from "react";
import { GenericCrudManager } from "@/components/admin/GenericCrudManager";

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
                    <strong>{m.role === "user" ? "Ziyaretçi: " : "TUNA AI: "}</strong>{m.message}
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

export default function Page() {
  return (
    <div className="space-y-10 pb-10">
      <div className="max-w-6xl mx-auto px-4 pt-10">
        <p className="text-sm text-tuna-mist glass-panel p-4 mb-4">
          Buraya eklediğiniz her konu, sağ-alt köşedeki AI Kulüp Asistanı'nın
          yanıt verirken kullandığı bilgi tabanına eklenir. Asistan yalnızca
          burada aktif olan içeriklere dayanarak yanıt üretir.
        </p>
      </div>
      <GenericCrudManager
        apiPath="/api/admin/ai-knowledge-base"
        title="Yapay Zekâ Asistanı — Bilgi Tabanı"
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
