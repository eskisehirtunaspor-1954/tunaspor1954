import { Hero } from "@/components/home/Hero";
import { NextMatchCard } from "@/components/home/NextMatchCard";
import { EskisehirInfoPanel } from "@/components/home/EskisehirInfoPanel";
import { StatsCounters } from "@/components/home/StatsCounters";
import { ExtraCards } from "@/components/home/ExtraCards";
import { SocialFeed } from "@/components/home/SocialFeed";
import { ScrollReveal, StaggerGrid, StaggerItem } from "@/components/layout/ScrollReveal";
import { T } from "@/components/layout/T";
import { StickyCtaBar } from "@/components/home/StickyCtaBar";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

export default async function HomePage() {
  const supabase = createClient();

  const [
    { data: news }, { data: teams }, { data: sponsors }, { data: albums },
    { data: siteSettings }, { count: playerCount }, { count: teamCount }, { count: academyPlayerCount },
  ] = await Promise.all([
    supabase.from("news").select("id, slug, title, excerpt, cover_image_url").eq("is_published", true).order("published_at", { ascending: false }).limit(3),
    supabase.from("teams").select("id, category, display_name, cover_image_url").eq("is_published", true).order("category"),
    supabase.from("sponsors").select("id, name, logo_url").eq("is_published", true).limit(8),
    supabase.from("gallery_albums").select("id, title, cover_image_url").eq("is_published", true).limit(4),
    supabase.from("site_settings").select("founded_year, achievements_count, lightning_intensity").eq("id", 1).single(),
    supabase.from("players").select("id", { count: "exact", head: true }).eq("is_published", true),
    supabase.from("teams").select("id", { count: "exact", head: true }).eq("is_published", true),
    supabase.from("players").select("id, teams!inner(category)", { count: "exact", head: true })
      .eq("is_published", true).not("teams.category", "in", '("a_takim","kadin_takimi")'),
  ]);

  const foundedYear = siteSettings?.founded_year ?? 1954;
  const clubAge = new Date().getFullYear() - foundedYear;

  const stats = [
    { label: "Kulüp Yaşı", value: clubAge },
    { label: "Futbolcu", value: playerCount ?? 0, suffix: "+" },
    { label: "Takım", value: teamCount ?? 0 },
    { label: "Akademi Oyuncusu", value: academyPlayerCount ?? 0, suffix: "+" },
    { label: "Başarı", value: siteSettings?.achievements_count ?? 0 },
  ];

  return (
    <>
      <Hero
        matchCard={<NextMatchCard />}
        infoPanel={<EskisehirInfoPanel />}
        lightningIntensity={(siteSettings?.lightning_intensity as any) ?? "orta"}
      />

      {/* İSTATİSTİK SAYAÇLARI */}
      <section className="max-w-6xl mx-auto px-4 py-16 -mt-10 relative z-10">
        <StatsCounters stats={stats} />
      </section>

      {/* KULÜP TANITIMI */}
      <ScrollReveal variant="fadeUp">
      <section className="max-w-5xl mx-auto px-4 py-20 text-center">
        <p className="eyebrow mb-3">KULÜBÜMÜZ</p>
        <h2 className="font-display text-3xl md:text-4xl mb-6"><T k="home_since_1954" /></h2>
        <p className="text-tuna-mist leading-relaxed">
          Tunaspor 1954, Eskişehir'in köklü kulüplerinden biri olarak amatör
          futbolun her kademesinde şehri temsil ediyor. A Takım'dan U9 alt
          yapı kategorilerine kadar yüzlerce sporcuya ev sahipliği yapan
          kulübümüz, disiplin, aidiyet ve sahaya duyulan sevgi üzerine
          kuruludur.
        </p>
      </section>
      </ScrollReveal>

      {/* ALT KARTLAR: Tanıtım Filmi / Akademi / Kadın Takımı / Forma Tanıtımı */}
      <ScrollReveal variant="fadeUp">
      <section className="max-w-6xl mx-auto px-4 py-8">
        <ExtraCards />
      </section>
      </ScrollReveal>

      {/* HABERLER */}
      <section className="max-w-6xl mx-auto px-4 py-16">
        <div className="flex items-center justify-between mb-8">
          <h2 className="font-display text-3xl"><T k="nav_news" /></h2>
          <Link href="/haberler" className="text-tuna-gold text-sm"><T k="view_all" /> →</Link>
        </div>
        <StaggerGrid className="grid md:grid-cols-3 gap-6">
          {(news ?? []).map((n) => (
            <StaggerItem key={n.id}>
            <article className="glass-panel overflow-hidden hover:border-tuna-gold/40 transition-colors">
              {n.cover_image_url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={n.cover_image_url} alt={n.title} className="w-full h-44 object-cover" />
              )}
              <div className="p-5">
                <h3 className="font-semibold mb-2">{n.title}</h3>
                <p className="text-sm text-tuna-mist line-clamp-2">{n.excerpt}</p>
              </div>
            </article>
            </StaggerItem>
          ))}
          {!news?.length && (
            <p className="text-tuna-mist col-span-3 text-center">
              Yakında burada haberler yer alacak.
            </p>
          )}
        </StaggerGrid>
      </section>

      {/* TAKIMLAR */}
      <section className="max-w-6xl mx-auto px-4 py-16">
        <h2 className="font-display text-3xl mb-8"><T k="page_teams_title" /></h2>
        <StaggerGrid className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {(teams ?? []).map((t) => (
            <StaggerItem key={t.id} variant="scale">
            <Link
              href={`/takimlar/${t.category}`}
              className="glass-panel p-5 text-center hover:border-tuna-gold/60 hover:shadow-goldGlow transition-all block"
            >
              <span className="font-semibold">{t.display_name}</span>
            </Link>
            </StaggerItem>
          ))}
        </StaggerGrid>
      </section>

      {/* AKADEMİ */}
      <ScrollReveal variant="fadeUp">
      <section className="max-w-6xl mx-auto px-4 py-16 text-center">
        <T k="page_academy_eyebrow" as="p" className="eyebrow mb-3" />
        <h2 className="font-display text-3xl mb-6">Akademi</h2>
        <p className="text-tuna-mist max-w-2xl mx-auto mb-8">
          U9'dan U18'e kadar dokuz kategoride yapılandırılmış eğitim
          programımızla geleceğin futbolcularını yetiştiriyoruz.
        </p>
        <Link
          href="/akademi"
          className="inline-block bg-tuna-gold text-tuna-black font-semibold px-6 py-3 rounded-full hover:shadow-goldGlow transition-shadow"
        >
          Akademiyi Keşfet
        </Link>
      </section>
      </ScrollReveal>

      {/* GALERİ */}
      <section className="max-w-6xl mx-auto px-4 py-16">
        <h2 className="font-display text-3xl mb-8"><T k="nav_gallery" /></h2>
        <StaggerGrid className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {(albums ?? []).map((a) => (
            <StaggerItem key={a.id} variant="scale">
            <div className="glass-panel aspect-square overflow-hidden hover:border-tuna-gold/40 transition-colors">
              {a.cover_image_url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={a.cover_image_url} alt={a.title} className="w-full h-full object-cover" />
              )}
            </div>
            </StaggerItem>
          ))}
        </StaggerGrid>
      </section>

      {/* SOSYAL MEDYA AKIŞI */}
      <SocialFeed />

      {/* SPONSOR DUVARI */}
      <section className="max-w-6xl mx-auto px-4 py-16">
        <h2 className="font-display text-3xl mb-8 text-center"><T k="page_sponsors_title" /></h2>
        <StaggerGrid className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-4">
          {(sponsors ?? []).map((s) => (
            <StaggerItem key={s.id} variant="scale">
            <a
              href="/sponsorlar"
              className="group glass-panel aspect-square p-4 flex items-center justify-center border border-white/10 hover:border-tuna-gold/50 hover:-translate-y-1 hover:shadow-goldGlow transition-all duration-300"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={s.logo_url}
                alt={s.name}
                className="max-h-10 max-w-full object-contain grayscale opacity-70 group-hover:grayscale-0 group-hover:opacity-100 group-hover:scale-110 transition-all duration-300"
              />
            </a>
            </StaggerItem>
          ))}
        </StaggerGrid>
      </section>

      {/* İLETİŞİM CTA */}
      <ScrollReveal variant="fadeUp">
      <section className="max-w-4xl mx-auto px-4 py-20 text-center">
        <h2 className="font-display text-3xl mb-4">Bize Ulaşın</h2>
        <p className="text-tuna-mist mb-8">
          Sorularınız, kayıt talepleriniz veya iş birliği önerileriniz için
          bizimle iletişime geçin.
        </p>
        <Link
          href="/iletisim"
          className="inline-block border border-tuna-gold text-tuna-gold px-6 py-3 rounded-full hover:bg-tuna-gold hover:text-tuna-black transition"
        >
          İletişim Sayfası
        </Link>
      </section>
      </ScrollReveal>

      <StickyCtaBar />
    </>
  );
}
