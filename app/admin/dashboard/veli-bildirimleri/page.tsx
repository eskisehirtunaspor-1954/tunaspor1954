"use client";

import { useEffect, useState } from "react";
import { GenericCrudManager, type FieldDef } from "@/components/admin/GenericCrudManager";

interface Channels {
  push: boolean;
  email: boolean;
  whatsapp: boolean;
  sms: boolean;
}

interface HistoryItem {
  id: string;
  type: string;
  channel: string;
  subject: string | null;
  status: "gonderildi" | "basarisiz" | "atlandi";
  error: string | null;
  created_at: string;
  parent_accounts?: { full_name: string } | null;
  players?: { full_name: string } | null;
}

const TYPE_LABEL: Record<string, string> = {
  antrenman_devamsizlik: "Antrenman Devamsızlığı",
  aidat_hatirlatma: "Aidat Hatırlatması",
  aidat_tesekkur: "Aidat Teşekkürü",
  manuel: "Manuel Gönderim",
};

const STATUS_LABEL: Record<string, string> = {
  gonderildi: "✅ Gönderildi",
  basarisiz: "❌ Başarısız",
  atlandi: "⏭️ Atlandı",
};

function ChannelBadge({ label, active }: { label: string; active: boolean }) {
  return (
    <span className={`text-xs px-2.5 py-1 rounded-full border ${active ? "border-emerald-400/50 text-emerald-300" : "border-white/15 text-tuna-mist"}`}>
      {active ? "🟢" : "⚪"} {label}
    </span>
  );
}

export default function VeliBildirimleriPage() {
  const [settings, setSettings] = useState<{ notify_attendance_enabled?: boolean; notify_fees_enabled?: boolean }>({});
  const [channels, setChannels] = useState<Channels | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [teams, setTeams] = useState<{ value: string; label: string }[]>([]);
  const [parents, setParents] = useState<{ value: string; label: string }[]>([]);
  const [saving, setSaving] = useState(false);

  const [sendTarget, setSendTarget] = useState<"parent" | "team" | "all">("all");
  const [sendParentId, setSendParentId] = useState("");
  const [sendTeamId, setSendTeamId] = useState("");
  const [sendSubject, setSendSubject] = useState("");
  const [sendMessage, setSendMessage] = useState("");
  const [sendResult, setSendResult] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  function loadHistory() {
    fetch("/api/admin/parent-notifications").then((r) => r.json()).then((d) => setHistory(d.data ?? []));
  }

  useEffect(() => {
    fetch("/api/admin/site-settings").then((r) => r.json()).then((d) => setSettings(d.data ?? {}));
    fetch("/api/admin/notification-channels").then((r) => r.json()).then(setChannels);
    fetch("/api/admin/teams").then((r) => r.json()).then((d) => setTeams((d.data ?? []).map((t: any) => ({ value: t.id, label: t.display_name }))));
    fetch("/api/admin/parent-accounts").then((r) => r.json()).then((d) => setParents((d.data ?? []).map((p: any) => ({ value: p.id, label: p.full_name }))));
    loadHistory();
  }, []);

  async function saveToggles(updates: Partial<typeof settings>) {
    const next = { ...settings, ...updates };
    setSettings(next);
    setSaving(true);
    await fetch("/api/admin/site-settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    });
    setSaving(false);
  }

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    setSending(true);
    setSendResult(null);
    const res = await fetch("/api/admin/parent-notifications/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        target: sendTarget,
        parentId: sendTarget === "parent" ? sendParentId : undefined,
        teamId: sendTarget === "team" ? sendTeamId : undefined,
        subject: sendSubject,
        message: sendMessage,
      }),
    });
    const data = await res.json();
    setSending(false);
    if (!res.ok) {
      setSendResult(data.error ?? "Gönderilemedi.");
      return;
    }
    setSendResult(`Gönderildi: ${data.sent}, başarısız: ${data.failed}`);
    setSendSubject("");
    setSendMessage("");
    loadHistory();
  }

  const templateFields: FieldDef[] = [
    { name: "type", label: "Bildirim Türü", type: "select", required: true, options: [
      { value: "antrenman_devamsizlik", label: "Antrenman Devamsızlığı" },
      { value: "aidat_hatirlatma", label: "Aidat Hatırlatması" },
      { value: "aidat_tesekkur", label: "Aidat Teşekkürü" },
      { value: "manuel", label: "Manuel Gönderim" },
    ]},
    { name: "channel", label: "Kanal", type: "select", required: true, options: [
      { value: "push", label: "Push Bildirim" },
      { value: "email", label: "E-posta" },
      { value: "whatsapp", label: "WhatsApp" },
      { value: "sms", label: "SMS" },
    ]},
    { name: "subject", label: "Başlık" },
    { name: "body", label: "Mesaj (değişkenler: {{parent_name}}, {{player_name}}, {{date}}, {{time}}, {{team_name}}, {{amount}}, {{due_date}}, {{period_label}})", type: "textarea", required: true },
  ];

  return (
    <div className="min-h-screen px-4 py-10 max-w-6xl mx-auto space-y-10">
      <div>
        <h1 className="font-display text-3xl text-tuna-yellow mb-2">Veli Bildirimleri</h1>
        <p className="text-sm text-tuna-mist">Devamsızlık ve aidat olaylarında otomatik veli bildirimi.</p>
      </div>

      {channels && (
        <div className="glass-panel p-6">
          <h2 className="font-semibold mb-3">Kanal Durumu</h2>
          <div className="flex flex-wrap gap-2">
            <ChannelBadge label="Push Bildirim" active={channels.push} />
            <ChannelBadge label="E-posta (Resend)" active={channels.email} />
            <ChannelBadge label="WhatsApp" active={channels.whatsapp} />
            <ChannelBadge label="SMS" active={channels.sms} />
          </div>
          {!channels.email && (
            <p className="text-xs text-tuna-mist mt-2">
              E-posta göndermek için ortam değişkenlerine <code className="text-tuna-gold">RESEND_API_KEY</code> eklenmeli.
            </p>
          )}
        </div>
      )}

      <div className="glass-panel p-6 space-y-3">
        <h2 className="font-semibold mb-1">Otomatik Bildirimler</h2>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            disabled={saving}
            checked={settings.notify_attendance_enabled ?? true}
            onChange={(e) => saveToggles({ notify_attendance_enabled: e.target.checked })}
          />
          Antrenman devamsızlığında veliye otomatik bildirim gönder
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            disabled={saving}
            checked={settings.notify_fees_enabled ?? true}
            onChange={(e) => saveToggles({ notify_fees_enabled: e.target.checked })}
          />
          Aidat hatırlatma/teşekkür bildirimlerini otomatik gönder
        </label>
      </div>

      <div className="glass-panel p-6 space-y-3">
        <h2 className="font-semibold mb-1">Manuel Gönderim</h2>
        <form onSubmit={handleSend} className="space-y-3">
          <div className="flex flex-wrap gap-3">
            <select
              value={sendTarget}
              onChange={(e) => setSendTarget(e.target.value as any)}
              className="bg-white/5 rounded-lg px-3 py-2 border border-white/10 outline-none focus:border-tuna-yellow"
            >
              <option value="all">Tüm Veliler</option>
              <option value="team">Bir Takımın Velileri</option>
              <option value="parent">Tek Veli</option>
            </select>
            {sendTarget === "team" && (
              <select
                value={sendTeamId}
                onChange={(e) => setSendTeamId(e.target.value)}
                required
                className="bg-white/5 rounded-lg px-3 py-2 border border-white/10 outline-none focus:border-tuna-yellow"
              >
                <option value="">Takım seçin</option>
                {teams.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            )}
            {sendTarget === "parent" && (
              <select
                value={sendParentId}
                onChange={(e) => setSendParentId(e.target.value)}
                required
                className="bg-white/5 rounded-lg px-3 py-2 border border-white/10 outline-none focus:border-tuna-yellow"
              >
                <option value="">Veli seçin</option>
                {parents.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
              </select>
            )}
          </div>
          <input
            required placeholder="Başlık" value={sendSubject}
            onChange={(e) => setSendSubject(e.target.value)}
            className="w-full bg-white/5 rounded-lg px-3 py-2 border border-white/10 outline-none focus:border-tuna-yellow"
          />
          <textarea
            required placeholder="Mesaj" rows={3} value={sendMessage}
            onChange={(e) => setSendMessage(e.target.value)}
            className="w-full bg-white/5 rounded-lg px-3 py-2 border border-white/10 outline-none focus:border-tuna-yellow"
          />
          <button disabled={sending} className="bg-tuna-yellow text-tuna-black font-semibold px-6 py-2 rounded-lg disabled:opacity-50">
            {sending ? "Gönderiliyor..." : "Gönder"}
          </button>
          {sendResult && <p className="text-sm text-tuna-gold">{sendResult}</p>}
        </form>
      </div>

      <div>
        <h2 className="font-semibold mb-4">Bildirim Şablonları</h2>
        <GenericCrudManager
          apiPath="/api/admin/notification-templates"
          title="Bildirim Şablonları"
          titleField="subject"
          subtitleField="channel"
          fields={templateFields}
        />
      </div>

      <div className="glass-panel p-6">
        <h2 className="font-semibold mb-4">Gönderim Geçmişi</h2>
        <div className="space-y-2 max-h-[32rem] overflow-y-auto">
          {history.map((h) => (
            <div key={h.id} className="flex items-center justify-between gap-3 text-sm border-b border-white/5 pb-2">
              <div>
                <p>{TYPE_LABEL[h.type] ?? h.type} — {h.channel} {h.parent_accounts?.full_name ? `→ ${h.parent_accounts.full_name}` : ""}</p>
                <p className="text-xs text-tuna-mist">{new Date(h.created_at).toLocaleString("tr-TR")} {h.players?.full_name ? `· ${h.players.full_name}` : ""}</p>
              </div>
              <span className="text-xs shrink-0">{STATUS_LABEL[h.status]}</span>
            </div>
          ))}
          {!history.length && <p className="text-tuna-mist text-sm">Henüz bildirim gönderilmedi.</p>}
        </div>
      </div>
    </div>
  );
}
