"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface Child {
  id: string;
  full_name: string;
  position: string;
  jersey_number: number;
  photo_url?: string;
  teams?: { display_name: string; category: string };
  license_status?: "gecerli" | "suresi_doldu" | "beklemede";
  license_expiry_date?: string;
  health_status?: "uygun" | "kontrol_gerekli" | "sakatlik";
  document_status?: "tamamlandi" | "eksik" | "beklemede";
}

const LICENSE_LABEL: Record<string, { text: string; color: string }> = {
  gecerli: { text: "Lisans Geçerli", color: "text-green-400 border-green-400/40 bg-green-400/10" },
  suresi_doldu: { text: "Lisans Süresi Doldu", color: "text-red-400 border-red-400/40 bg-red-400/10" },
  beklemede: { text: "Lisans Beklemede", color: "text-tuna-gold border-tuna-gold/40 bg-tuna-gold/10" },
};
const HEALTH_LABEL: Record<string, { text: string; color: string }> = {
  uygun: { text: "Sağlık: Uygun", color: "text-green-400 border-green-400/40 bg-green-400/10" },
  kontrol_gerekli: { text: "Sağlık: Kontrol Gerekli", color: "text-tuna-gold border-tuna-gold/40 bg-tuna-gold/10" },
  sakatlik: { text: "Sağlık: Sakatlık", color: "text-red-400 border-red-400/40 bg-red-400/10" },
};
const DOCUMENT_LABEL: Record<string, { text: string; color: string }> = {
  tamamlandi: { text: "Evrak: Tamamlandı", color: "text-green-400 border-green-400/40 bg-green-400/10" },
  eksik: { text: "Evrak: Eksik", color: "text-red-400 border-red-400/40 bg-red-400/10" },
  beklemede: { text: "Evrak: Beklemede", color: "text-tuna-gold border-tuna-gold/40 bg-tuna-gold/10" },
};

// Bağımlılık eklemeden basit bir çizgi grafik — 4 kategori skorunu (teknik/taktik/
// fiziksel/mental) zaman içinde gösterir. Değerlendirme sayısı azken (1-2 nokta)
// bile okunabilir kalması için minimum genişlik/nokta boyutu korunur.
function DevelopmentChart({ evaluations }: { evaluations: any[] }) {
  if (!evaluations.length) return <p className="text-tuna-mist text-sm">Henüz antrenör değerlendirmesi girilmedi.</p>;

  const width = 400;
  const height = 160;
  const padding = 24;
  const series: { key: string; label: string; color: string }[] = [
    { key: "technical_score", label: "Teknik", color: "#FFD700" },
    { key: "tactical_score", label: "Taktik", color: "#60A5FA" },
    { key: "physical_score", label: "Fiziksel", color: "#F87171" },
    { key: "mental_score", label: "Mental", color: "#34D399" },
  ];
  const stepX = evaluations.length > 1 ? (width - padding * 2) / (evaluations.length - 1) : 0;
  const yFor = (score: number) => height - padding - ((score - 1) / 9) * (height - padding * 2);

  return (
    <div>
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-40">
        {series.map((s) => {
          const points = evaluations.map((e, i) => `${padding + i * stepX},${yFor(e[s.key] ?? 5)}`).join(" ");
          return (
            <g key={s.key}>
              <polyline points={points} fill="none" stroke={s.color} strokeWidth={2} />
              {evaluations.map((e, i) => (
                <circle key={i} cx={padding + i * stepX} cy={yFor(e[s.key] ?? 5)} r={3} fill={s.color} />
              ))}
            </g>
          );
        })}
      </svg>
      <div className="flex flex-wrap gap-3 mt-2">
        {series.map((s) => (
          <span key={s.key} className="flex items-center gap-1.5 text-xs text-tuna-mist">
            <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ background: s.color }} />
            {s.label}
          </span>
        ))}
      </div>
      <p className="text-xs text-tuna-mist mt-2">Son değerlendirme: {evaluations[evaluations.length - 1]?.period_label}</p>
    </div>
  );
}

export default function VeliPanelPage() {
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [selectedChild, setSelectedChild] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/parent/me")
      .then((r) => {
        if (r.status === 401) {
          router.push("/veli/giris");
          return null;
        }
        return r.json();
      })
      .then((d) => {
        if (!d) return;
        setData(d);
        if (d.children?.length) setSelectedChild(d.children[0].id);
        setLoading(false);
      });
  }, [router]);

  async function handleLogout() {
    await fetch("/api/parent/auth/logout", { method: "POST" });
    router.push("/veli/giris");
  }

  if (loading) {
    return <div className="max-w-4xl mx-auto px-4 py-24 text-center text-tuna-mist">Yükleniyor...</div>;
  }

  if (!data) return null;

  const children: Child[] = data.children ?? [];
  const child = children.find((c) => c.id === selectedChild);

  const childFees = (data.fees ?? []).filter((f: any) => f.player_id === selectedChild);
  const childReports = (data.reports ?? []).filter((r: any) => r.player_id === selectedChild);
  const childAttendance = (data.attendance ?? []).filter((a: any) => a.player_id === selectedChild);
  const childEvaluations = (data.evaluations ?? []).filter((e: any) => e.player_id === selectedChild);
  const childSquads = (data.squads ?? []).filter((s: any) => s.player_id === selectedChild);

  return (
    <div className="max-w-5xl mx-auto px-4 py-16">
      <div className="flex items-center justify-between mb-10 flex-wrap gap-4">
        <div>
          <p className="eyebrow mb-2">Veli Paneli</p>
          <h1 className="font-display text-3xl">Hoş geldin, {data.parent.full_name}</h1>
        </div>
        <button onClick={handleLogout} className="text-sm text-tuna-mist hover:text-white border border-white/15 rounded-full px-4 py-2">
          Çıkış Yap
        </button>
      </div>

      {!children.length && (
        <div className="glass-panel p-8 text-center text-tuna-mist">
          Hesabına henüz bir çocuk bağlanmamış. Kulüp ofisiyle iletişime geç.
        </div>
      )}

      {children.length > 0 && (
        <>
          {/* Çocuk seçici (birden fazla çocuk varsa) */}
          {children.length > 1 && (
            <div className="flex gap-2 mb-8 flex-wrap">
              {children.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setSelectedChild(c.id)}
                  className={`px-4 py-2 rounded-full text-sm border transition-all ${
                    selectedChild === c.id
                      ? "border-tuna-gold text-tuna-gold bg-tuna-gold/10"
                      : "border-white/15 text-white/70"
                  }`}
                >
                  {c.full_name}
                </button>
              ))}
            </div>
          )}

          {child && (
            <div className="glass-panel p-6 mb-10 flex items-center gap-4">
              {child.photo_url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={child.photo_url} alt={child.full_name} className="w-16 h-16 rounded-full object-cover" />
              )}
              <div>
                <p className="font-display text-xl">{child.full_name}</p>
                <p className="text-tuna-mist text-sm mb-2">
                  {child.teams?.display_name} · {child.position} · Forma No: {child.jersey_number ?? "-"}
                </p>
                <div className="flex flex-wrap gap-2">
                  {child.license_status && (
                    <span className={`text-xs px-2 py-0.5 rounded-full border ${LICENSE_LABEL[child.license_status].color}`}>
                      {LICENSE_LABEL[child.license_status].text}
                    </span>
                  )}
                  {child.health_status && (
                    <span className={`text-xs px-2 py-0.5 rounded-full border ${HEALTH_LABEL[child.health_status].color}`}>
                      {HEALTH_LABEL[child.health_status].text}
                    </span>
                  )}
                  {child.document_status && (
                    <span className={`text-xs px-2 py-0.5 rounded-full border ${DOCUMENT_LABEL[child.document_status].color}`}>
                      {DOCUMENT_LABEL[child.document_status].text}
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="grid md:grid-cols-2 gap-8 mb-10">
            {/* Antrenman Programı */}
            <section className="glass-panel p-6">
              <h2 className="font-display text-xl mb-4">Yaklaşan Antrenmanlar</h2>
              <div className="space-y-2">
                {(data.upcomingSessions ?? []).slice(0, 6).map((s: any) => (
                  <div key={s.id} className="text-sm border-b border-white/10 pb-2">
                    <span className="text-tuna-gold">
                      {new Date(s.session_date).toLocaleDateString("tr-TR", { day: "2-digit", month: "long", weekday: "long" })}
                    </span>
                    <span className="text-tuna-mist ml-2">
                      {s.start_time?.slice(0, 5)}
                      {s.venue ? ` · ${s.venue}` : ""}
                    </span>
                  </div>
                ))}
                {!data.upcomingSessions?.length && <p className="text-tuna-mist text-sm">Yaklaşan antrenman girilmedi.</p>}
              </div>
            </section>

            {/* Devam Durumu */}
            <section className="glass-panel p-6">
              <h2 className="font-display text-xl mb-4">Devam Durumu</h2>
              <div className="space-y-2">
                {childAttendance.slice(0, 8).map((a: any) => (
                  <div key={a.id} className="text-sm border-b border-white/10 pb-2 flex justify-between">
                    <span className="text-tuna-mist">
                      {a.training_sessions?.session_date &&
                        new Date(a.training_sessions.session_date).toLocaleDateString("tr-TR", { day: "2-digit", month: "short" })}
                    </span>
                    <span
                      className={
                        a.status === "katildi" ? "text-green-400" : a.status === "izinli" ? "text-tuna-gold" : "text-red-400"
                      }
                    >
                      {a.status === "katildi" ? "Katıldı" : a.status === "izinli" ? "İzinli" : "Katılmadı"}
                    </span>
                  </div>
                ))}
                {!childAttendance.length && <p className="text-tuna-mist text-sm">Henüz devam kaydı girilmedi.</p>}
              </div>
            </section>

            {/* Aidat */}
            <section className="glass-panel p-6">
              <h2 className="font-display text-xl mb-4">Aidat Durumu</h2>
              <div className="space-y-2">
                {childFees.map((f: any) => (
                  <div key={f.id} className="text-sm border-b border-white/10 pb-2 flex justify-between">
                    <span>{f.period_label}</span>
                    <span className={f.is_paid ? "text-green-400" : "text-red-400"}>
                      {f.is_paid ? "Ödendi" : `Bekliyor — ${f.amount}₺`}
                    </span>
                  </div>
                ))}
                {!childFees.length && <p className="text-tuna-mist text-sm">Aidat kaydı bulunmuyor.</p>}
              </div>
            </section>

            {/* Gelişim Raporları */}
            <section className="glass-panel p-6">
              <h2 className="font-display text-xl mb-4">Gelişim Raporları</h2>
              <div className="space-y-3">
                {childReports.map((r: any) => (
                  <div key={r.id} className="text-sm border-b border-white/10 pb-3">
                    <p className="text-tuna-gold font-medium mb-1">{r.period_label}</p>
                    <p className="text-tuna-mist">{r.content}</p>
                  </div>
                ))}
                {!childReports.length && <p className="text-tuna-mist text-sm">Henüz gelişim raporu girilmedi.</p>}
              </div>
            </section>

            {/* Oynadığı Maçlar / Maç Kadroları */}
            <section className="glass-panel p-6">
              <h2 className="font-display text-xl mb-4">Oynadığı Maçlar</h2>
              <div className="space-y-2">
                {childSquads.map((s: any) => (
                  <div key={s.id} className="text-sm border-b border-white/10 pb-2 flex justify-between">
                    <span>
                      {s.fixtures?.match_date && new Date(s.fixtures.match_date).toLocaleDateString("tr-TR", { day: "2-digit", month: "short" })}
                      <span className="text-tuna-mist ml-2">vs {s.fixtures?.opponent}</span>
                    </span>
                    <span className="text-tuna-mist">
                      {s.is_starting ? "İlk 11" : "Yedek"}
                      {s.goals > 0 && ` · ${s.goals} gol`}
                      {s.assists > 0 && ` · ${s.assists} asist`}
                    </span>
                  </div>
                ))}
                {!childSquads.length && <p className="text-tuna-mist text-sm">Henüz kadro/maç kaydı girilmedi.</p>}
              </div>
            </section>

            {/* Gelişim Grafiği (antrenör değerlendirmeleri) */}
            <section className="glass-panel p-6 md:col-span-2">
              <h2 className="font-display text-xl mb-4">Gelişim Grafiği</h2>
              <DevelopmentChart evaluations={childEvaluations} />
            </section>
          </div>
        </>
      )}

      <div className="grid md:grid-cols-2 gap-8">
        {/* Duyurular (tüm veliler için ortak) */}
        <section>
          <h2 className="font-display text-2xl mb-6">Akademi Duyuruları</h2>
          <div className="space-y-3">
            {(data.announcements ?? []).map((a: any) => (
              <div key={a.id} className="glass-panel p-4">
                <p className="font-medium text-tuna-gold mb-1">{a.title}</p>
                <p className="text-sm text-tuna-mist">{a.content}</p>
              </div>
            ))}
            {!data.announcements?.length && <p className="text-tuna-mist">Henüz duyuru yok.</p>}
          </div>
        </section>

        {/* Etkinlikler / Kamp / Yaz-Kış Futbol Okulu */}
        <section>
          <h2 className="font-display text-2xl mb-6">Etkinlikler ve Kamplar</h2>
          <div className="space-y-3">
            {(data.events ?? []).map((e: any) => (
              <div key={e.id} className="glass-panel p-4">
                <p className="font-medium text-tuna-gold mb-1">{e.title}</p>
                <p className="text-sm text-tuna-mist">
                  {new Date(e.start_date).toLocaleDateString("tr-TR")}
                  {e.location ? ` · ${e.location}` : ""} —{" "}
                  {e.registration_open ? "Kayıt açık" : "Kayıt henüz açılmadı"}
                </p>
              </div>
            ))}
            {!data.events?.length && <p className="text-tuna-mist">Yaklaşan etkinlik bulunmuyor.</p>}
          </div>
        </section>
      </div>
    </div>
  );
}
