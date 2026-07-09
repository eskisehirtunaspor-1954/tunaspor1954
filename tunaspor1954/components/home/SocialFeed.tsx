import { createClient } from "@/lib/supabase/server";
import { Instagram, Facebook, Heart } from "lucide-react";

const PLATFORM_ICON: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  instagram: Instagram,
  facebook: Facebook,
  twitter: Instagram, // ayrı ikon yoksa nötr fallback
  tiktok: Instagram,
};

export async function SocialFeed() {
  const supabase = createClient();
  const { data: posts } = await supabase
    .from("social_posts")
    .select("*")
    .eq("is_published", true)
    .order("sort_order", { ascending: false })
    .order("published_at", { ascending: false })
    .limit(8);

  if (!posts?.length) return null;

  return (
    <section className="max-w-6xl mx-auto px-4 py-16">
      <div className="flex items-center justify-between mb-8">
        <div>
          <p className="eyebrow mb-2">SOSYAL MEDYA</p>
          <h2 className="font-display text-3xl">Bizi Takip Edin</h2>
        </div>
        <a
          href="https://www.instagram.com/tunaspor.1954.esk?igsh=MWNidmJiNjA4MTZyZA=="
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 text-tuna-gold text-sm hover:underline"
        >
          <Instagram size={16} /> @tunaspor.1954.esk
        </a>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {posts.map((post) => {
          const Icon = PLATFORM_ICON[post.platform] ?? Instagram;
          return (
            <a
              key={post.id}
              href={post.post_url}
              target="_blank"
              rel="noopener noreferrer"
              className="group relative aspect-square overflow-hidden rounded-xl border border-white/10 hover:border-tuna-gold/50 transition-colors"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={post.image_url}
                alt={post.caption ?? "Sosyal medya gönderisi"}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/60 transition-colors duration-300 flex flex-col items-center justify-center gap-2 opacity-0 group-hover:opacity-100 p-3 text-center">
                {post.caption && (
                  <p className="text-xs text-white line-clamp-3">{post.caption}</p>
                )}
                {!!post.likes_count && (
                  <span className="flex items-center gap-1 text-tuna-gold text-xs font-semibold">
                    <Heart size={13} fill="currentColor" /> {post.likes_count}
                  </span>
                )}
              </div>
              <div className="absolute top-2 right-2 bg-black/40 backdrop-blur-sm rounded-full p-1.5">
                <Icon size={12} className="text-white" />
              </div>
            </a>
          );
        })}
      </div>
    </section>
  );
}
