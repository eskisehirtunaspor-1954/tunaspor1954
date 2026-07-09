import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { StaggerGrid, StaggerItem } from "@/components/layout/ScrollReveal";
import { T } from "@/components/layout/T";

export const metadata = { title: "Haberler" };
export const revalidate = 60;

export default async function HaberlerPage() {
  const supabase = createClient();
  const { data: news } = await supabase
    .from("news")
    .select("id, slug, title, excerpt, cover_image_url, published_at")
    .eq("is_published", true)
    .order("published_at", { ascending: false });

  return (
    <div className="max-w-6xl mx-auto px-4 py-20">
      <T k="page_news_eyebrow" as="p" className="eyebrow mb-3" />
      <T k="page_news_title" as="h1" className="font-display text-4xl mb-10" />
      <StaggerGrid className="grid md:grid-cols-3 gap-6">
        {(news ?? []).map((n) => (
          <StaggerItem key={n.id}>
          <Link href={`/haberler/${n.slug}`} className="glass-panel overflow-hidden block hover:border-tuna-gold/40 transition-colors">
            {n.cover_image_url && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={n.cover_image_url} alt={n.title} className="w-full h-44 object-cover" />
            )}
            <div className="p-5">
              <h2 className="font-semibold mb-2">{n.title}</h2>
              <p className="text-sm text-tuna-mist line-clamp-2">{n.excerpt}</p>
            </div>
          </Link>
          </StaggerItem>
        ))}
        {!news?.length && <T k="page_news_empty" as="p" className="text-tuna-mist" />}
      </StaggerGrid>
    </div>
  );
}
