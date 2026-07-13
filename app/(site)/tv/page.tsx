import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Tunaspor TV+" };
export const dynamic = "force-dynamic";

const CATEGORIES: { value: string; label: string }[] = [
  { value: "canli_yayin", label: "Canlı Yayın" },
  { value: "mac_ozeti", label: "Maç Özetleri" },
  { value: "roportaj", label: "Röportajlar" },
  { value: "antrenman", label: "Antrenman Videoları" },
];

export default async function TvPage() {
  const supabase = createClient();
  const { data: videos } = await supabase
    .from("videos")
    .select("*")
    .eq("is_published", true)
    .order("published_at", { ascending: false });

  const byCategory = (cat: string) => (videos ?? []).filter((v) => v.category === cat);
  const live = byCategory("canli_yayin");

  return (
    <div className="max-w-6xl mx-auto px-4 py-20">
      <p className="eyebrow mb-3">Tunaspor 1954</p>
      <h1 className="font-display text-4xl mb-2">Tunaspor TV+</h1>
      <p className="text-tuna-mist max-w-2xl mb-12">
        Maç özetleri, röportajlar, antrenman görüntüleri ve canlı yayınlar tek yerde.
      </p>

      {/* Canlı yayın varsa en üstte, büyük gösterilir */}
      {live[0] && (
        <section className="mb-16">
          <div className="flex items-center gap-2 mb-4">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <h2 className="font-display text-2xl">Canlı Yayın</h2>
          </div>
          <div className="glass-panel overflow-hidden aspect-video">
            {live[0].video_url ? (
              <video src={live[0].video_url} controls className="w-full h-full bg-black" />
            ) : (
              // Eski kayıtlar (yalnızca YouTube ID ile eklenmiş) geriye dönük uyumlu çalışmaya devam eder.
              <iframe
                className="w-full h-full"
                src={`https://www.youtube.com/embed/${live[0].youtube_id}?autoplay=0`}
                title={live[0].title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            )}
          </div>
        </section>
      )}

      {CATEGORIES.filter((c) => c.value !== "canli_yayin").map((cat) => {
        const items = byCategory(cat.value);
        return (
          <section key={cat.value} className="mb-16">
            <h2 className="font-display text-2xl mb-6">{cat.label}</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {items.map((v) => (
                <div key={v.id} className="glass-panel overflow-hidden">
                  <div className="aspect-video">
                    {v.video_url ? (
                      <video src={v.video_url} controls className="w-full h-full bg-black" />
                    ) : (
                      // Eski kayıtlar (yalnızca YouTube ID ile eklenmiş) geriye dönük uyumlu çalışmaya devam eder.
                      <iframe
                        className="w-full h-full"
                        src={`https://www.youtube.com/embed/${v.youtube_id}`}
                        title={v.title}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    )}
                  </div>
                  <div className="p-4">
                    <p className="font-medium">{v.title}</p>
                    {v.description && <p className="text-xs text-tuna-mist mt-1">{v.description}</p>}
                  </div>
                </div>
              ))}
              {!items.length && <p className="text-tuna-mist col-span-full">Bu kategoride henüz video eklenmedi.</p>}
            </div>
          </section>
        );
      })}
    </div>
  );
}
