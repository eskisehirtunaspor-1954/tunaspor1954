"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface Team { id: string; display_name: string; category: string }
interface Player { id: string; team_id: string; full_name: string; position?: string; jersey_number?: number }
interface Session { id: string; team_id: string; session_date: string; start_time: string; venue?: string }
interface Attendance { id: string; player_id: string; status: string; training_sessions?: { team_id: string; session_date: string } }
interface Report { id: string; player_id: string; period_label: string; content: string }
interface Fixture { id: string; team_id: string; opponent: string; match_date: string; status: string }
interface SquadEntry { fixture_id: string; player_id: string; is_starting: boolean; goals?: number; assists?: number }

const STATUS_LABEL: Record<string, string> = { katildi: "Katıldı", katilmadi: "Katılmadı", izinli: "İzinli" };

export default function AntrenorPanelPage() {
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null);
  const [attendanceSessionId, setAttendanceSessionId] = useState<string | null>(null);
  const [attendanceDraft, setAttendanceDraft] = useState<Record<string, string>>({});
  const [savingAttendance, setSavingAttendance] = useState(false);
  const [reportForm, setReportForm] = useState({ player_id: "", period_label: "", content: "" });
  const [savingReport, setSavingReport] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const [evalForm, setEvalForm] = useState({
    player_id: "", period_label: "", technical_score: 5, tactical_score: 5, physical_score: 5, mental_score: 5, comment: "",
  });
  const [savingEval, setSavingEval] = useState(false);

  const [squadFixtureId, setSquadFixtureId] = useState<string | null>(null);
  const [squadDraft, setSquadDraft] = useState<Record<string, SquadEntry>>({});
  const [savingSquad, setSavingSquad] = useState(false);

  const [aiMessages, setAiMessages] = useState<{ role: "user" | "assistant"; content: string }[]>([
    { role: "assistant", content: "Merhaba! Ben TUNA ANTRENÖR AI. Haftalık antrenman programı, kadro/oyuncu analizi, rakip analizi veya maç sonrası değerlendirme hazırlayabilirim. Kadronla ilgili sorular gerçek verilerine dayanır." },
  ]);
  const [aiInput, setAiInput] = useState("");
  const [aiLoading, setAiLoading] = useState(false);

  function load() {
    fetch("/api/coach/me")
      .then((r) => {
        if (r.status === 401) {
          router.push("/antrenor/giris");
          return null;
        }
        return r.json();
      })
      .then((d) => {
        if (!d) return;
        setData(d);
        if (d.teams?.length) setSelectedTeam((prev) => prev ?? d.teams[0].id);
        setLoading(false);
      });
  }

  useEffect(() => { load(); }, [router]);

  async function handleLogout() {
    await fetch("/api/coach/auth/logout", { method: "POST" });
    router.push("/antrenor/giris");
  }

  async function sendAiMessage() {
    const text = aiInput.trim();
    if (!text || aiLoading) return;
    const next = [...aiMessages, { role: "user" as const, content: text }];
    setAiMessages(next);
    setAiInput("");
    setAiLoading(true);
    try {
      const res = await fetch("/api/coach/ai-assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next }),
      });
      const d = await res.json();
      setAiMessages((m) => [...m, { role: "assistant", content: d.reply ?? "Yanıt alınamadı." }]);
    } catch {
      setAiMessages((m) => [...m, { role: "assistant", content: "Şu anda yanıt veremiyorum." }]);
    } finally {
      setAiLoading(false);
    }
  }

  if (loading) {
    return <div className="max-w-4xl mx-auto px-4 py-24 text-center text-tuna-mist">Yükleniyor...</div>;
  }
  if (!data) return null;

  const teams: Team[] = data.teams ?? [];
  const roster: Player[] = (data.players ?? []).filter((p: Player) => p.team_id === selectedTeam);
  const sessions: Session[] = (data.upcomingSessions ?? []).filter((s: Session) => s.team_id === selectedTeam);
  const reports: Report[] = (data.reports ?? []).filter((r: Report) => roster.some((p) => p.id === r.player_id));
  const fixtures: Fixture[] = (data.fixtures ?? []).filter((f: Fixture) => f.team_id === selectedTeam);
  const allSquads: SquadEntry[] = data.squads ?? [];

  function openSquad(fixtureId: string) {
    setSquadFixtureId(fixtureId);
    const draft: Record<string, SquadEntry> = {};
    roster.forEach((p) => {
      const existing = allSquads.find((s) => s.fixture_id === fixtureId && s.player_id === p.id);
      draft[p.id] = existing ?? { fixture_id: fixtureId, player_id: p.id, is_starting: false, goals: 0, assists: 0 };
    });
    setSquadDraft(draft);
  }

  async function submitSquad() {
    if (!squadFixtureId) return;
    setSavingSquad(true);
    setMessage(null);
    const entries = Object.values(squadDraft).filter((e) => e.is_starting || (e.goals ?? 0) > 0 || (e.assists ?? 0) > 0 || allSquads.some((s) => s.fixture_id === squadFixtureId && s.player_id === e.player_id));
    const res = await fetch("/api/coach/squads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fixture_id: squadFixtureId, entries: entries.length ? entries : Object.values(squadDraft) }),
    });
    setSavingSquad(false);
    if (res.ok) {
      setMessage("Kadro kaydedildi.");
      setSquadFixtureId(null);
      load();
    } else {
      const d = await res.json().catch(() => ({}));
      setMessage(d.error ?? "Kaydedilemedi.");
    }
  }

  async function submitEvaluation(e: React.FormEvent) {
    e.preventDefault();
    setSavingEval(true);
    setMessage(null);
    const res = await fetch("/api/coach/evaluations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(evalForm),
    });
    setSavingEval(false);
    if (res.ok) {
      setMessage("Değerlendirme kaydedildi.");
      setEvalForm({ player_id: "", period_label: "", technical_score: 5, tactical_score: 5, physical_score: 5, mental_score: 5, comment: "" });
      load();
    } else {
      const d = await res.json().catch(() => ({}));
      setMessage(d.error ?? "Kaydedilemedi.");
    }
  }

  function openAttendance(sessionId: string) {
    setAttendanceSessionId(sessionId);
    const draft: Record<string, string> = {};
    roster.forEach((p) => { draft[p.id] = "katildi"; });
    setAttendanceDraft(draft);
  }

  async function submitAttendance() {
    if (!attendanceSessionId) return;
    setSavingAttendance(true);
    setMessage(null);
    const records = Object.entries(attendanceDraft).map(([player_id, status]) => ({ player_id, status }));
    const res = await fetch("/api/coach/attendance", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ session_id: attendanceSessionId, records }),
    });
    setSavingAttendance(false);
    if (res.ok) {
      setMessage("Yoklama kaydedildi.");
      setAttendanceSessionId(null);
      load();
    } else {
      const d = await res.json().catch(() => ({}));
      setMessage(d.error ?? "Kaydedilemedi.");
    }
  }

  async function submitReport(e: React.FormEvent) {
    e.preventDefault();
    setSavingReport(true);
    setMessage(null);
    const res = await fetch("/api/coach/reports", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(reportForm),
    });
    setSavingReport(false);
    if (res.ok) {
      setMessage("Gelişim raporu eklendi.");
      setReportForm({ player_id: "", period_label: "", content: "" });
      load();
    } else {
      const d = await res.json().catch(() => ({}));
      setMessage(d.error ?? "Kaydedilemedi.");
    }
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-16">
      <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
        <div>
          <p className="eyebrow mb-2">Antrenör Paneli</p>
          <h1 className="font-display text-3xl">Hoş geldin, {data.coach.full_name}</h1>
        </div>
        <button onClick={handleLogout} className="text-sm text-tuna-mist hover:text-white border border-white/15 rounded-full px-4 py-2">
          Çıkış Yap
        </button>
      </div>

      <section className="glass-panel p-6 mb-10">
        <h2 className="font-display text-xl mb-1">🤖 TUNA ANTRENÖR AI</h2>
        <p className="text-xs text-tuna-mist mb-4">
          Antrenman programı, kadro analizi, rakip analizi veya maç sonrası değerlendirme iste — kadronla ilgili sorular gerçek verilerine dayanır.
        </p>
        <div className="max-h-80 overflow-y-auto space-y-2 mb-3 pr-1">
          {aiMessages.map((m, i) => (
            <div key={i} className={m.role === "user" ? "ml-auto max-w-[85%]" : "max-w-[85%]"}>
              <div className={`px-3 py-2 rounded-xl text-sm whitespace-pre-wrap ${m.role === "user" ? "bg-tuna-gold text-tuna-black" : "bg-white/10"}`}>
                {m.content}
              </div>
            </div>
          ))}
          {aiLoading && (
            <div className="bg-white/10 max-w-[60%] px-3 py-2 rounded-xl flex gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-tuna-gold animate-bounce [animation-delay:-0.3s]" />
              <span className="w-1.5 h-1.5 rounded-full bg-tuna-gold animate-bounce [animation-delay:-0.15s]" />
              <span className="w-1.5 h-1.5 rounded-full bg-tuna-gold animate-bounce" />
            </div>
          )}
        </div>
        <div className="flex gap-2">
          <input
            value={aiInput}
            onChange={(e) => setAiInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendAiMessage()}
            placeholder="Örn: U14 için haftalık antrenman programı hazırla"
            className="flex-1 bg-white/5 rounded-full px-3 py-2 text-sm outline-none border border-white/10 focus:border-tuna-gold"
          />
          <button onClick={sendAiMessage} disabled={aiLoading} className="bg-tuna-gold text-tuna-black rounded-full px-4 py-2 text-sm font-semibold disabled:opacity-50">
            Gönder
          </button>
        </div>
      </section>

      {!teams.length && (
        <div className="glass-panel p-8 text-center text-tuna-mist">
          Hesabına henüz bir takım/kategori atanmamış. Kulüp ofisiyle iletişime geç.
        </div>
      )}

      {teams.length > 0 && (
        <>
          {teams.length > 1 && (
            <div className="flex gap-2 mb-8 flex-wrap">
              {teams.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setSelectedTeam(t.id)}
                  className={`px-4 py-2 rounded-full text-sm border transition-all ${
                    selectedTeam === t.id ? "border-tuna-gold text-tuna-gold bg-tuna-gold/10" : "border-white/15 text-white/70"
                  }`}
                >
                  {t.display_name}
                </button>
              ))}
            </div>
          )}

          {message && <p className="text-sm text-tuna-gold mb-6">{message}</p>}

          <div className="grid md:grid-cols-2 gap-8 mb-10">
            <section className="glass-panel p-6">
              <h2 className="font-display text-xl mb-4">Kadro</h2>
              <div className="space-y-2">
                {roster.map((p) => (
                  <div key={p.id} className="text-sm border-b border-white/10 pb-2 flex justify-between">
                    <span>{p.full_name}</span>
                    <span className="text-tuna-mist">{p.position} · #{p.jersey_number ?? "-"}</span>
                  </div>
                ))}
                {!roster.length && <p className="text-tuna-mist text-sm">Bu kategoride oyuncu bulunmuyor.</p>}
              </div>
            </section>

            <section className="glass-panel p-6">
              <h2 className="font-display text-xl mb-4">Yaklaşan Antrenmanlar</h2>
              <div className="space-y-3">
                {sessions.map((s) => (
                  <div key={s.id} className="text-sm border-b border-white/10 pb-2">
                    <div className="flex items-center justify-between">
                      <span>
                        <span className="text-tuna-gold">
                          {new Date(s.session_date).toLocaleDateString("tr-TR", { day: "2-digit", month: "long" })}
                        </span>
                        <span className="text-tuna-mist ml-2">{s.start_time?.slice(0, 5)}{s.venue ? ` · ${s.venue}` : ""}</span>
                      </span>
                      <button onClick={() => openAttendance(s.id)} className="text-tuna-gold text-xs underline">
                        Yoklama Gir
                      </button>
                    </div>
                  </div>
                ))}
                {!sessions.length && <p className="text-tuna-mist text-sm">Yaklaşan antrenman girilmedi.</p>}
              </div>
            </section>
          </div>

          <section className="glass-panel p-6 mb-10">
            <h2 className="font-display text-xl mb-4">Maçlar — Kadro ve İstatistik Girişi</h2>
            <div className="space-y-2">
              {fixtures.map((f) => (
                <div key={f.id} className="text-sm border-b border-white/10 pb-2 flex items-center justify-between">
                  <span>
                    <span className="text-tuna-gold">{new Date(f.match_date).toLocaleDateString("tr-TR")}</span>
                    <span className="text-tuna-mist ml-2">vs {f.opponent}</span>
                  </span>
                  <button onClick={() => openSquad(f.id)} className="text-tuna-gold text-xs underline">
                    Kadro Gir
                  </button>
                </div>
              ))}
              {!fixtures.length && <p className="text-tuna-mist text-sm">Bu kategori için maç girilmedi.</p>}
            </div>
          </section>

          {squadFixtureId && (
            <section className="glass-panel p-6 mb-10">
              <h2 className="font-display text-xl mb-4">Kadro</h2>
              <div className="space-y-3">
                {roster.map((p) => {
                  const entry = squadDraft[p.id];
                  if (!entry) return null;
                  return (
                    <div key={p.id} className="flex items-center justify-between gap-3 flex-wrap text-sm">
                      <span className="w-40">{p.full_name}</span>
                      <label className="flex items-center gap-1.5 text-xs">
                        <input
                          type="checkbox"
                          checked={entry.is_starting}
                          onChange={(e) => setSquadDraft({ ...squadDraft, [p.id]: { ...entry, is_starting: e.target.checked } })}
                        />
                        Kadroda
                      </label>
                      <label className="flex items-center gap-1 text-xs">
                        Gol
                        <input
                          type="number"
                          min={0}
                          value={entry.goals ?? 0}
                          onChange={(e) => setSquadDraft({ ...squadDraft, [p.id]: { ...entry, goals: parseInt(e.target.value) || 0 } })}
                          className="w-14 bg-white/5 rounded px-2 py-1 border border-white/10"
                        />
                      </label>
                      <label className="flex items-center gap-1 text-xs">
                        Asist
                        <input
                          type="number"
                          min={0}
                          value={entry.assists ?? 0}
                          onChange={(e) => setSquadDraft({ ...squadDraft, [p.id]: { ...entry, assists: parseInt(e.target.value) || 0 } })}
                          className="w-14 bg-white/5 rounded px-2 py-1 border border-white/10"
                        />
                      </label>
                    </div>
                  );
                })}
              </div>
              <div className="flex gap-3 mt-5">
                <button disabled={savingSquad} onClick={submitSquad} className="bg-tuna-yellow text-tuna-black font-semibold px-6 py-2 rounded-lg disabled:opacity-50">
                  {savingSquad ? "Kaydediliyor..." : "Kadroyu Kaydet"}
                </button>
                <button type="button" onClick={() => setSquadFixtureId(null)} className="text-tuna-mist text-sm">
                  İptal
                </button>
              </div>
            </section>
          )}

          {attendanceSessionId && (
            <section className="glass-panel p-6 mb-10">
              <h2 className="font-display text-xl mb-4">Yoklama</h2>
              <div className="space-y-3">
                {roster.map((p) => (
                  <div key={p.id} className="flex items-center justify-between gap-3 flex-wrap">
                    <span className="text-sm">{p.full_name}</span>
                    <div className="flex gap-2">
                      {(["katildi", "katilmadi", "izinli"] as const).map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => setAttendanceDraft({ ...attendanceDraft, [p.id]: s })}
                          className={`px-3 py-1 rounded-full text-xs border ${
                            attendanceDraft[p.id] === s ? "border-tuna-gold text-tuna-gold bg-tuna-gold/10" : "border-white/15 text-white/70"
                          }`}
                        >
                          {STATUS_LABEL[s]}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex gap-3 mt-5">
                <button disabled={savingAttendance} onClick={submitAttendance}
                  className="bg-tuna-yellow text-tuna-black font-semibold px-6 py-2 rounded-lg disabled:opacity-50">
                  {savingAttendance ? "Kaydediliyor..." : "Yoklamayı Kaydet"}
                </button>
                <button type="button" onClick={() => setAttendanceSessionId(null)} className="text-tuna-mist text-sm">
                  İptal
                </button>
              </div>
            </section>
          )}

          <section className="glass-panel p-6 mb-10">
            <h2 className="font-display text-xl mb-4">Gelişim Raporu Ekle</h2>
            <form onSubmit={submitReport} className="space-y-3">
              <select required value={reportForm.player_id}
                onChange={(e) => setReportForm({ ...reportForm, player_id: e.target.value })}
                className="w-full bg-white/5 rounded-lg px-3 py-2 border border-white/10 outline-none focus:border-tuna-gold">
                <option value="">Oyuncu seçin</option>
                {roster.map((p) => <option key={p.id} value={p.id}>{p.full_name}</option>)}
              </select>
              <input required placeholder="Dönem (örn. 2026 Yaz Sezonu)" value={reportForm.period_label}
                onChange={(e) => setReportForm({ ...reportForm, period_label: e.target.value })}
                className="w-full bg-white/5 rounded-lg px-3 py-2 border border-white/10 outline-none focus:border-tuna-gold" />
              <textarea required rows={4} placeholder="Rapor içeriği" value={reportForm.content}
                onChange={(e) => setReportForm({ ...reportForm, content: e.target.value })}
                className="w-full bg-white/5 rounded-lg px-3 py-2 border border-white/10 outline-none focus:border-tuna-gold" />
              <button disabled={savingReport} className="bg-tuna-yellow text-tuna-black font-semibold px-6 py-2 rounded-lg disabled:opacity-50">
                {savingReport ? "Kaydediliyor..." : "Raporu Kaydet"}
              </button>
            </form>
          </section>

          <section className="glass-panel p-6 mb-10">
            <h2 className="font-display text-xl mb-4">Oyuncu Değerlendirmesi Ekle</h2>
            <p className="text-xs text-tuna-mist mb-3">Gelişim raporundan farklı olarak burada 1-10 arası yapısal puanlama girilir — veli panelinde grafik olarak gösterilir.</p>
            <form onSubmit={submitEvaluation} className="space-y-3">
              <select required value={evalForm.player_id}
                onChange={(e) => setEvalForm({ ...evalForm, player_id: e.target.value })}
                className="w-full bg-white/5 rounded-lg px-3 py-2 border border-white/10 outline-none focus:border-tuna-gold">
                <option value="">Oyuncu seçin</option>
                {roster.map((p) => <option key={p.id} value={p.id}>{p.full_name}</option>)}
              </select>
              <input required placeholder="Dönem (örn. 2026 Yaz Sezonu)" value={evalForm.period_label}
                onChange={(e) => setEvalForm({ ...evalForm, period_label: e.target.value })}
                className="w-full bg-white/5 rounded-lg px-3 py-2 border border-white/10 outline-none focus:border-tuna-gold" />
              <div className="grid grid-cols-2 gap-3">
                {([
                  ["technical_score", "Teknik"],
                  ["tactical_score", "Taktik"],
                  ["physical_score", "Fiziksel"],
                  ["mental_score", "Mental"],
                ] as const).map(([key, label]) => (
                  <label key={key} className="text-sm">
                    <span className="text-tuna-mist block mb-1">{label}: {(evalForm as any)[key]}/10</span>
                    <input
                      type="range" min={1} max={10}
                      value={(evalForm as any)[key]}
                      onChange={(e) => setEvalForm({ ...evalForm, [key]: parseInt(e.target.value) })}
                      className="w-full accent-tuna-gold"
                    />
                  </label>
                ))}
              </div>
              <textarea rows={3} placeholder="Yorum (opsiyonel)" value={evalForm.comment}
                onChange={(e) => setEvalForm({ ...evalForm, comment: e.target.value })}
                className="w-full bg-white/5 rounded-lg px-3 py-2 border border-white/10 outline-none focus:border-tuna-gold" />
              <button disabled={savingEval} className="bg-tuna-yellow text-tuna-black font-semibold px-6 py-2 rounded-lg disabled:opacity-50">
                {savingEval ? "Kaydediliyor..." : "Değerlendirmeyi Kaydet"}
              </button>
            </form>
          </section>

          <section className="glass-panel p-6">
            <h2 className="font-display text-xl mb-4">Geçmiş Gelişim Raporları</h2>
            <div className="space-y-3">
              {reports.map((r) => (
                <div key={r.id} className="text-sm border-b border-white/10 pb-3">
                  <p className="text-tuna-gold font-medium mb-1">
                    {roster.find((p) => p.id === r.player_id)?.full_name} — {r.period_label}
                  </p>
                  <p className="text-tuna-mist">{r.content}</p>
                </div>
              ))}
              {!reports.length && <p className="text-tuna-mist text-sm">Henüz gelişim raporu girilmedi.</p>}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
