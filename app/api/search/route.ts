import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim();
  if (!q || q.length < 2) {
    return NextResponse.json({ news: [], players: [], teams: [] });
  }

  const supabase = createClient();
  const pattern = `%${q}%`;

  const [{ data: news }, { data: players }, { data: teams }] = await Promise.all([
    supabase
      .from("news")
      .select("id, slug, title, excerpt")
      .eq("is_published", true)
      .or(`title.ilike.${pattern},excerpt.ilike.${pattern}`)
      .limit(5),
    supabase
      .from("players")
      .select("id, full_name, position, team_id, teams(category, display_name)")
      .eq("is_published", true)
      .ilike("full_name", pattern)
      .limit(5),
    supabase
      .from("teams")
      .select("id, category, display_name")
      .eq("is_published", true)
      .ilike("display_name", pattern)
      .limit(5),
  ]);

  return NextResponse.json({
    news: news ?? [],
    players: players ?? [],
    teams: teams ?? [],
  });
}
