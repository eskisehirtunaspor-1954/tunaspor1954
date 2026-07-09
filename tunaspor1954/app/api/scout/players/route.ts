import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { getScoutSession } from "@/lib/scout-guard";

// ÇOCUK GÜVENLİĞİ KARARI: Scout'lar (dış kulüp temsilcileri) en küçük yaş
// gruplarındaki (U9-U14) çocukların detaylı kişisel verilerine (doğum tarihi,
// fotoğraf, boy/kilo) erişemez. Bu veri seti onaylı bir hesap için bile hassas
// sayılır. Scout paneli yalnızca U15 ve üzeri akademi kategorileri, A Takım ve
// Kadın Futbol Takımı oyuncularını gösterir — gerçek scouting ihtiyacı zaten
// genelde bu yaş aralığındadır.
const SCOUT_VISIBLE_CATEGORIES = ["a_takim", "kadin_takimi", "u15", "u16", "u17", "u18"];

export async function GET(req: NextRequest) {
  const session = await getScoutSession(req);
  if (!session) return NextResponse.json({ error: "Oturum bulunamadı." }, { status: 401 });

  const category = req.nextUrl.searchParams.get("category");
  const position = req.nextUrl.searchParams.get("position");

  // İstenen kategori küçük yaş grubuysa (whitelist dışıysa) boş sonuç dön
  if (category && !SCOUT_VISIBLE_CATEGORIES.includes(category)) {
    return NextResponse.json({ data: [], videos: [] });
  }

  const supabase = createServiceClient();
  let query = supabase
    .from("players")
    .select("id, full_name, position, jersey_number, birth_date, height_cm, weight_kg, nationality, photo_url, stats, team_id, teams(display_name, category)")
    .eq("is_published", true);

  if (position) query = query.ilike("position", `%${position}%`);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Whitelist SUNUCU TARAFINDA uygulanıyor — client'tan gelen kategori parametresine
  // güvenilmiyor, her koşulda küçük yaş grupları filtreleniyor.
  const filtered = (data ?? []).filter((p: any) => SCOUT_VISIBLE_CATEGORIES.includes(p.teams?.category));
  const finalFiltered = category ? filtered.filter((p: any) => p.teams?.category === category) : filtered;

  // Bu oyuncularla ilişkili videoları da getir (varsa)
  const teamIds = Array.from(new Set(finalFiltered.map((p: any) => p.team_id).filter(Boolean)));
  const { data: videos } = teamIds.length
    ? await supabase.from("videos").select("id, title, youtube_id, team_id").in("team_id", teamIds).eq("is_published", true)
    : { data: [] };

  return NextResponse.json({ data: finalFiltered, videos: videos ?? [] });
}
