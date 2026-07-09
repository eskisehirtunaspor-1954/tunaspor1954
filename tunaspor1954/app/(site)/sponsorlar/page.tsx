import { createClient } from "@/lib/supabase/server";
import { T } from "@/components/layout/T";

export const metadata = { title: "Sponsorlar" };

const TIER_KEYS: Record<string, string> = {
  ana_sponsor: "tier_ana_sponsor",
  platin: "tier_platin",
  altin: "tier_altin",
  destekci: "tier_destekci",
};

export default async function SponsorlarPage() {
  const supabase = createClient();
  const { data: sponsors } = await supabase
    .from("sponsors")
    .select("*")
    .eq("is_published", true)
    .order("sort_order");

  const grouped = (sponsors ?? []).reduce<Record<string, typeof sponsors>>((acc, s) => {
    (acc[s.tier] ??= []).push(s);
    return acc;
  }, {});

  return (
    <div className="max-w-6xl mx-auto px-4 py-20">
      <T k="page_sponsors_eyebrow" as="p" className="eyebrow mb-3" />
      <T k="page_sponsors_title" as="h1" className="font-display text-4xl mb-2" />
      <p className="text-tuna-mist mb-12 max-w-xl">
        Tunaspor 1954'ü yıllardır destekleyen kurumlar ve iş ortaklarımız.
      </p>
      {Object.entries(TIER_KEYS).map(([tier, labelKey]) =>
        grouped[tier]?.length ? (
          <div key={tier} className="mb-14">
            <T k={labelKey} as="h2" className="font-display text-2xl mb-6 text-tuna-gold" />
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-5">
              {grouped[tier]!.map((s) => (
                <a
                  key={s.id}
                  href={s.website_url ?? "#"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group glass-panel aspect-[4/3] p-6 flex items-center justify-center border border-white/10 hover:border-tuna-gold/50 hover:-translate-y-1 hover:shadow-goldGlow transition-all duration-300"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={s.logo_url}
                    alt={s.name}
                    className="max-h-16 max-w-full object-contain grayscale opacity-80 group-hover:grayscale-0 group-hover:opacity-100 group-hover:scale-110 transition-all duration-300"
                  />
                </a>
              ))}
            </div>
          </div>
        ) : null
      )}
      {!sponsors?.length && <T k="page_sponsors_empty" as="p" className="text-tuna-mist" />}
    </div>
  );
}
