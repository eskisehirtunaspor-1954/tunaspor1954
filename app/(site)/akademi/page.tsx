import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { T } from "@/components/layout/T";

export const metadata = { title: "Akademi" };
export const dynamic = "force-dynamic";

const ACADEMY_CATEGORIES = ["u18","u17","u16","u15","u14","u13","u12","u11","u10","u9"];

export default async function AkademiPage() {
  const supabase = createClient();
  const { data: teams } = await supabase
    .from("teams")
    .select("id, category, display_name, coach_name")
    .in("category", ACADEMY_CATEGORIES)
    .eq("is_published", true);

  const sorted = (teams ?? []).sort(
    (a, b) => ACADEMY_CATEGORIES.indexOf(a.category) - ACADEMY_CATEGORIES.indexOf(b.category)
  );
  const teamIds = sorted.map((t) => t.id);

  // Akademi genelindeki antrenörler, antrenman programı ve galeri — tüm yaş
  // gruplarının verisi tek sayfada toplanıyor (istenen menü hiyerarşisine göre).
  const [{ data: staff }, { data: sessions }, { data: albums }] = teamIds.length
    ? await Promise.all([
        supabase.from("staff_members").select("*").in("team_id", teamIds).eq("is_published", true),
        supabase
          .from("training_sessions")
          .select("*, teams(display_name)")
          .in("team_id", teamIds)
          .gte("session_date", new Date().toISOString().slice(0, 10))
          .order("session_date", { ascending: true })
          .limit(20),
        supabase.from("gallery_albums").select("*").in("team_id", teamIds).eq("is_published", true),
      ])
    : [{ data: [] }, { data: [] }, { data: [] }];

  return (
    <div className="max-w-6xl mx-auto px-4 py-20">
      <T k="page_academy_eyebrow" as="p" className="eyebrow mb-3" />
      <T k="page_academy_title" as="h1" className="font-display text-4xl mb-6" />
      <p className="text-tuna-mist max-w-2xl mb-12">
        U9'dan U18'e kadar dokuz yaş kategorisinde yapılandırılmış, lisanslı
        antrenörler eşliğinde yürütülen bir gelişim programı sunuyoruz.
        Kayıt ve seçme dönemleri Etkinlikler sayfasında duyurulur.
      </p>

      {/* Yaş grupları */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-16">
        {sorted.map((t) => (
          <Link
            key={t.id}
            href={`/takimlar/${t.category}`}
            className="glass-panel p-6 text-center hover:border-tuna-yellow/60 transition"
          >
            <span className="font-display text-xl text-tuna-yellow block">
              {t.category.toUpperCase()}
            </span>
            {t.coach_name && <span className="text-xs text-tuna-mist">{t.coach_name}</span>}
          </Link>
        ))}
        {!sorted.length && (
          <p className="text-tuna-mist col-span-full">Yaş grupları henüz eklenmedi.</p>
        )}
      </div>

      {/* Antrenörler */}
      <section className="mb-16">
        <h2 className="font-display text-2xl mb-6">Antrenörler</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {(staff ?? []).map((s) => (
            <div key={s.id} className="glass-panel p-4 text-center">
              {s.photo_url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={s.photo_url} alt={s.full_name} className="w-16 h-16 rounded-full object-cover mx-auto mb-2" />
              )}
              <div className="text-sm font-medium">{s.full_name}</div>
              <div className="text-xs text-tuna-mist">{s.role}</div>
            </div>
          ))}
          {!staff?.length && <p className="text-tuna-mist col-span-full">Henüz antrenör eklenmedi.</p>}
        </div>
      </section>

      {/* Antrenman Programı */}
      <section className="mb-16">
        <h2 className="font-display text-2xl mb-6">Antrenman Programı</h2>
        <div className="space-y-2">
          {(sessions ?? []).map((s: any) => (
            <div key={s.id} className="glass-panel p-4 flex items-center justify-between flex-wrap gap-2">
              <div>
                <span className="font-medium">{s.teams?.display_name ?? "Takım"}</span>
                <span className="text-tuna-mist text-sm ml-2">
                  {new Date(s.session_date).toLocaleDateString("tr-TR", { day: "2-digit", month: "long", weekday: "long" })}
                  {" · "}{s.start_time?.slice(0, 5)}{s.end_time ? `–${s.end_time.slice(0, 5)}` : ""}
                </span>
              </div>
              {s.venue && <span className="text-xs text-tuna-gold">{s.venue}</span>}
            </div>
          ))}
          {!sessions?.length && <p className="text-tuna-mist">Yaklaşan antrenman programı henüz girilmedi.</p>}
        </div>
      </section>

      {/* Galeri */}
      <section>
        <h2 className="font-display text-2xl mb-6">Galeri</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {(albums ?? []).map((a) => (
            <Link key={a.id} href="/galeri" className="glass-panel aspect-square overflow-hidden block group">
              {a.cover_image_url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={a.cover_image_url}
                  alt={a.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                />
              )}
              <div className="p-2 text-xs text-center">{a.title}</div>
            </Link>
          ))}
          {!albums?.length && <p className="text-tuna-mist col-span-full">Akademi galerisi henüz eklenmedi.</p>}
        </div>
      </section>
    </div>
  );
}
