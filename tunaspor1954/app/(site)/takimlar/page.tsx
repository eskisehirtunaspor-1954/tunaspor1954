import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { StaggerGrid, StaggerItem } from "@/components/layout/ScrollReveal";
import { T } from "@/components/layout/T";

export const metadata = { title: "Takımlar" };

// Önbellek düzeltmesi: Next.js Server Component'lerdeki fetch isteklerini
// varsayılan olarak önbelleğe alır. Bu sayfa DB'deki güncel takım listesini
// her istekte gösterecek şekilde ayarlandı — aksi halde admin panelinden
// yeni eklenen/kaldırılan takımlar liste ile detay sayfası arasında
// tutarsızlık yaratıp "listede var ama tıklayınca 404" durumuna yol açabiliyordu.
export const dynamic = "force-dynamic";

const CATEGORY_ORDER = [
  "a_takim", "kadin_takimi", "u18", "u17", "u16", "u15", "u14", "u13", "u12", "u11", "u10", "u9",
];

export default async function TakimlarPage() {
  const supabase = createClient();
  const { data: teams } = await supabase
    .from("teams")
    .select("id, category, display_name, coach_name, cover_image_url")
    .eq("is_published", true);

  const sorted = (teams ?? []).sort(
    (a, b) => CATEGORY_ORDER.indexOf(a.category) - CATEGORY_ORDER.indexOf(b.category)
  );

  return (
    <div className="max-w-6xl mx-auto px-4 py-20">
      <T k="page_teams_eyebrow" as="p" className="eyebrow mb-3" />
      <T k="page_teams_title" as="h1" className="font-display text-4xl mb-10" />
      <StaggerGrid className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {sorted.map((t) => (
          <StaggerItem key={t.id} variant="scale">
          <Link
            href={`/takimlar/${t.category}`}
            className="glass-panel p-6 text-center hover:border-tuna-gold/60 hover:shadow-goldGlow transition-all block"
          >
            <span className="font-semibold block mb-1">{t.display_name}</span>
            {t.coach_name && <span className="text-xs text-tuna-mist">{t.coach_name}</span>}
          </Link>
          </StaggerItem>
        ))}
      </StaggerGrid>
    </div>
  );
}
