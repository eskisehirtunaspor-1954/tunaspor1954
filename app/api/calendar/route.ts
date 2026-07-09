import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  const teamId = req.nextUrl.searchParams.get("team_id");
  const supabase = createClient();

  let calendarQuery = supabase.from("calendar_items").select("*");
  if (teamId) calendarQuery = calendarQuery.eq("team_id", teamId);

  const [{ data: items }, { data: fixtures }] = await Promise.all([
    calendarQuery,
    (async () => {
      let q = supabase.from("fixtures").select("*");
      if (teamId) q = q.eq("team_id", teamId);
      return q;
    })(),
  ]);

  const merged = [
    ...(items ?? []).map((i) => ({
      id: i.id,
      type: i.type,
      title: i.title,
      start_time: i.start_time,
      location: i.location,
    })),
    ...(fixtures ?? []).map((f) => ({
      id: f.id,
      type: "mac",
      title: `${f.home_or_away === "home" ? "Tunaspor 1954" : f.opponent} - ${f.home_or_away === "home" ? f.opponent : "Tunaspor 1954"}`,
      start_time: f.match_date,
      location: f.venue,
      competition: f.competition, // örn. "Hazırlık Maçı", "Lig Maçı" — admin fikstür girerken belirtir
    })),
  ].sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());

  return NextResponse.json({ data: merged });
}
