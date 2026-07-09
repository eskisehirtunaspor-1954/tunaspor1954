import { createClient } from "@/lib/supabase/server";
import { Sparkles } from "lucide-react";

export async function AnnouncementTicker() {
  const supabase = createClient();
  const { data: news } = await supabase
    .from("news")
    .select("title, slug")
    .eq("is_published", true)
    .order("published_at", { ascending: false })
    .limit(8);

  const items = news?.length
    ? news
    : [{ title: "Tunaspor 1954'e hoş geldiniz", slug: "" }];

  return (
    <div className="w-full bg-gradient-to-r from-tuna-bronze via-tuna-gold to-tuna-bronze text-tuna-black overflow-hidden py-1.5 relative z-30 shadow-[0_2px_12px_rgba(255,215,0,0.25)]">
      <div className="flex whitespace-nowrap animate-[marquee_30s_linear_infinite]">
        {[...items, ...items].map((item, i) => (
          <span key={i} className="mx-8 text-sm font-semibold tracking-wide flex items-center gap-1.5">
            <Sparkles size={13} className="drop-shadow-[0_0_4px_rgba(0,0,0,0.3)]" />
            {item.title}
          </span>
        ))}
      </div>
      <style>{`
        @keyframes marquee {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  );
}
