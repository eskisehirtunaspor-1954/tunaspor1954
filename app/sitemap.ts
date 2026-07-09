import { MetadataRoute } from "next";
import { createClient } from "@/lib/supabase/server";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_SITE_URL || "https://tunaspor1954.org";
  const supabase = createClient();

  const staticRoutes = [
    "", "kulubumuz", "haberler", "takimlar", "akademi", "galeri",
    "sponsorlar", "iletisim", "etkinlikler", "takvim", "destekci-duvari",
  ].map((path) => ({
    url: `${base}/${path}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: path === "" ? 1 : 0.7,
  }));

  const [{ data: news }, { data: teams }] = await Promise.all([
    supabase.from("news").select("slug, published_at").eq("is_published", true),
    supabase.from("teams").select("category").eq("is_published", true),
  ]);

  const newsRoutes = (news ?? []).map((n) => ({
    url: `${base}/haberler/${n.slug}`,
    lastModified: n.published_at ? new Date(n.published_at) : new Date(),
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));

  const teamRoutes = (teams ?? []).map((t) => ({
    url: `${base}/takimlar/${t.category}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.6,
  }));

  return [...staticRoutes, ...newsRoutes, ...teamRoutes];
}
