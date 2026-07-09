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
                <p className="text-tuna-mist text-sm">
                  {child.teams?.display_name} · {child.position} · Forma No: {child.jersey_number ?? "-"}
                </p>
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
          </div>
        </>
      )}

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
    </div>
  );
}
