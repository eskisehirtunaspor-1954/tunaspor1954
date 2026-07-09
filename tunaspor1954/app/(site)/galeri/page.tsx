import { createClient } from "@/lib/supabase/server";
import { GalleryGrid } from "@/components/home/GalleryGrid";
import { T } from "@/components/layout/T";

export const metadata = { title: "Galeri" };

export default async function GaleriPage() {
  const supabase = createClient();
  const [{ data: albums }, { data: videos }] = await Promise.all([
    supabase.from("gallery_albums").select("*").eq("is_published", true).order("created_at", { ascending: false }),
    supabase.from("videos").select("*").eq("is_published", true).order("published_at", { ascending: false }),
  ]);

  const photoAlbums = (albums ?? []).filter((a) => a.media_type !== "drone");
  const droneAlbums = (albums ?? []).filter((a) => a.media_type === "drone");

  return (
    <div className="max-w-6xl mx-auto px-4 py-20">
      <T k="page_gallery_eyebrow" as="p" className="eyebrow mb-3" />
      <T k="page_gallery_title" as="h1" className="font-display text-4xl mb-2" />
      <p className="text-tuna-mist mb-10 max-w-xl">
        Fotoğraflar, videolar ve drone görüntüleriyle Tunaspor 1954'ün sahadaki ve saha dışındaki anları.
      </p>
      <GalleryGrid photoAlbums={photoAlbums} droneAlbums={droneAlbums} videos={videos ?? []} />
    </div>
  );
}
