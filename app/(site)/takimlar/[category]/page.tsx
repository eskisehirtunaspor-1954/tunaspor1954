import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { T } from "@/components/layout/T";
import { PlayerCard, EmptyPlayerCard } from "@/components/site/PlayerCard";
import { StaffCard } from "@/components/site/StaffCard";

interface Props { params: { category: string } }

// Aynı önbellek düzeltmesi: bu sayfa da her istekte güncel veriyi göstersin.
export const dynamic = "force-dynamic";

export default async function TeamDetailPage({ params }: Props) {
  const supabase = createClient();
  // Küçük yazım farklarına (boşluk, büyük/küçük harf) karşı toleranslı eşleşme.
  // NOT: "category" kolonu bir Postgres enum'u (team_category) — ilike/~~* operatörü
  // enum tiplerinde tanımlı değildir ve "operator does not exist" hatasıyla sorgunun
  // tamamen başarısız olmasına (dolayısıyla her kategori sayfasının 404 görünmesine)
  // yol açıyordu. Normalize işlemi zaten JS tarafında yapıldığı (trim+lowercase) ve
  // enum değerleri zaten hep küçük harf olduğu için exact match (eq) yeterli ve doğru.
  const normalizedCategory = params.category.trim().toLowerCase();

  const { data: team } = await supabase
    .from("teams")
    .select("*")
    .eq("category", normalizedCategory)
    .eq("is_published", true)
    .single();

  if (!team) notFound();

  // Kadın Futbol Takımı için sadeleştirilmiş görünüm istendi: Kadro / Haberler / Galeri.
  // Diğer tüm kategoriler (A Takım + akademi yaş grupları) tam görünümü kullanır.
  const isSimplified = team.category === "kadin_takimi";

  const [
    { data: players },
    { data: staff },
    { data: news },
    { data: albums },
    { data: standings },
    { data: fixtures },
  ] = await Promise.all([
    // GÜVENLİK: select("*") kullanılmıyor — players tablosuna eklenen veli
    // iletişim bilgisi, devamsızlık sayısı ve aidat verisi (admin-only alanlar)
    // herkese açık bu sayfanın RSC payload'ına asla dahil edilmemeli.
    supabase
      .from("players")
      .select("id, full_name, position, jersey_number, birth_date, height_cm, weight_kg, photo_url, license_no, preferred_foot, joined_at, team_id")
      .eq("team_id", team.id)
      .eq("is_published", true)
      .order("jersey_number"),
    supabase.from("staff_members").select("*").eq("team_id", team.id).eq("is_published", true),
    supabase.from("news").select("id, slug, title").eq("team_id", team.id).eq("is_published", true).limit(5),
    supabase.from("gallery_albums").select("*").eq("team_id", team.id).eq("is_published", true),
    supabase.from("standings").select("*").eq("team_id", team.id).order("season", { ascending: false }).limit(1),
    supabase.from("fixtures").select("*").eq("team_id", team.id).order("match_date", { ascending: true }),
  ]);

  const standing = standings?.[0];
  const now = Date.now();
  const upcomingFixtures = (fixtures ?? []).filter((f) => new Date(f.match_date).getTime() >= now && f.status !== "finished");
  const pastFixtures = (fixtures ?? [])
    .filter((f) => new Date(f.match_date).getTime() < now || f.status === "finished")
    .sort((a, b) => new Date(b.match_date).getTime() - new Date(a.match_date).getTime());

  return (
    <div className="max-w-6xl mx-auto px-4 py-20">
      <T k="team_eyebrow" as="p" className="eyebrow mb-3" />
      <h1 className="font-display text-4xl mb-2">{team.display_name}</h1>
      {team.coach_name && (
        <p className="text-tuna-mist mb-6">
          <T k="team_coach" />: {team.coach_name}
        </p>
      )}

      <div className="flex flex-wrap gap-3 mb-10">
        <Link
          href="/lig-durumu"
          className="text-sm border border-tuna-gold/30 text-tuna-gold px-4 py-2 rounded-full hover:bg-tuna-gold/10 hover:border-tuna-gold transition-colors"
        >
          📊 <T k="team_btn_standings" />
        </Link>
        <Link
          href="/galeri"
          className="text-sm border border-tuna-gold/30 text-tuna-gold px-4 py-2 rounded-full hover:bg-tuna-gold/10 hover:border-tuna-gold transition-colors"
        >
          📸 <T k="team_btn_gallery" />
        </Link>
        <Link
          href={`/takvim?team=${team.id}`}
          className="text-sm border border-tuna-gold/30 text-tuna-gold px-4 py-2 rounded-full hover:bg-tuna-gold/10 hover:border-tuna-gold transition-colors"
        >
          📅 <T k="team_btn_calendar" />
        </Link>
      </div>

      {standing && !isSimplified && (
        <section id="puan-durumu" className="mb-16 scroll-mt-28">
          <T k="team_section_stats" as="h2" className="font-display text-2xl mb-6" />
          <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
            {[
              { key: "stat_played", value: standing.played },
              { key: "stat_won", value: standing.won },
              { key: "stat_drawn", value: standing.drawn },
              { key: "stat_lost", value: standing.lost },
              { key: "stat_diff", value: standing.goals_for - standing.goals_against },
              { key: "stat_points", value: standing.points },
            ].map((s) => (
              <div key={s.key} className="glass-panel p-4 text-center">
                <div className="text-2xl font-display text-tuna-gold">{s.value}</div>
                <T k={s.key} as="div" className="text-xs text-tuna-mist" />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Puan Durumu verisi yoksa bile menüden gelen #puan-durumu linki boşa çıkmasın diye çapa noktası her koşulda var olsun */}
      {(!standing || isSimplified) && <span id="puan-durumu" className="block scroll-mt-28" />}

      <section id="kadro" className="mb-16 scroll-mt-28">
        <T k="team_section_roster" as="h2" className="font-display text-2xl mb-6" />
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {(players ?? []).map((p) => (
            <PlayerCard key={p.id} player={p} />
          ))}
          {!players?.length &&
            Array.from({ length: 6 }, (_, i) => <EmptyPlayerCard key={i} />)}
        </div>
      </section>

      {!isSimplified && (
      <section id="antrenor-kadrosu" className="mb-16 scroll-mt-28">
        <T k="team_section_staff" as="h2" className="font-display text-2xl mb-6" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {(staff ?? []).map((s) => (
            <StaffCard key={s.id} staff={s} />
          ))}
          {!staff?.length && <T k="empty_staff" as="p" className="text-tuna-mist col-span-full" />}
        </div>
      </section>
      )}

      {!isSimplified && (
      <section id="fikstur" className="mb-16 scroll-mt-28">
        <h2 className="font-display text-2xl mb-6">Fikstür</h2>
        <div className="space-y-2">
          {upcomingFixtures.map((f) => (
            <div key={f.id} className="glass-panel p-4 flex items-center justify-between flex-wrap gap-2">
              <div>
                <span className="font-medium">{f.home_or_away === "home" ? `Tunaspor 1954 – ${f.opponent}` : `${f.opponent} – Tunaspor 1954`}</span>
                {f.competition && <span className="text-xs text-tuna-mist ml-2">{f.competition}</span>}
              </div>
              <span className="text-sm text-tuna-gold">
                {new Date(f.match_date).toLocaleDateString("tr-TR", { day: "2-digit", month: "long" })}
                {" · "}
                {new Date(f.match_date).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })}
              </span>
            </div>
          ))}
          {!upcomingFixtures.length && <p className="text-tuna-mist">Yaklaşan maç bulunmuyor.</p>}
        </div>
      </section>
      )}

      {!isSimplified && (
      <section id="mac-sonuclari" className="mb-16 scroll-mt-28">
        <h2 className="font-display text-2xl mb-6">Maç Sonuçları</h2>
        <div className="space-y-2">
          {pastFixtures.map((f) => (
            <div key={f.id} className="glass-panel p-4 flex items-center justify-between flex-wrap gap-2">
              <div>
                <span className="font-medium">{f.home_or_away === "home" ? `Tunaspor 1954 – ${f.opponent}` : `${f.opponent} – Tunaspor 1954`}</span>
                {f.competition && <span className="text-xs text-tuna-mist ml-2">{f.competition}</span>}
              </div>
              <span className="text-sm font-display text-tuna-gold">
                {f.home_score != null && f.away_score != null ? `${f.home_score} – ${f.away_score}` : "—"}
              </span>
            </div>
          ))}
          {!pastFixtures.length && <p className="text-tuna-mist">Henüz oynanmış maç kaydı yok.</p>}
        </div>
      </section>
      )}

      {!isSimplified && (
      <section id="galeri" className="mb-16 scroll-mt-28">
        <T k="team_section_gallery" as="h2" className="font-display text-2xl mb-6" />
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
          {!albums?.length && <T k="empty_gallery_team" as="p" className="text-tuna-mist col-span-full" />}
        </div>
      </section>
      )}

      {isSimplified && (
      <section id="galeri" className="mb-16 scroll-mt-28">
        <T k="team_section_gallery" as="h2" className="font-display text-2xl mb-6" />
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
          {!albums?.length && <T k="empty_gallery_team" as="p" className="text-tuna-mist col-span-full" />}
        </div>
      </section>
      )}

      <section id="haberler" className="scroll-mt-28">
        <T k="team_section_news" as="h2" className="font-display text-2xl mb-6" />
        <ul className="space-y-2">
          {(news ?? []).map((n) => (
            <li key={n.id}>
              <a href={`/haberler/${n.slug}`} className="text-tuna-gold hover:underline">
                {n.title}
              </a>
            </li>
          ))}
          {!news?.length && <T k="empty_news_team" as="p" className="text-tuna-mist" />}
        </ul>
      </section>
    </div>
  );
}
