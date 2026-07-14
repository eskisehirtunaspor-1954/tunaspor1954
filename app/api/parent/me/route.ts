import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { getParentSession } from "@/lib/parent-guard";

export async function GET(req: NextRequest) {
  const session = await getParentSession(req);
  if (!session) return NextResponse.json({ error: "Oturum bulunamadı, lütfen giriş yapın." }, { status: 401 });

  const supabase = createServiceClient();

  const { data: parent } = await supabase
    .from("parent_accounts")
    .select("id, full_name, email, phone")
    .eq("id", session.parentId)
    .single();
  if (!parent) return NextResponse.json({ error: "Hesap bulunamadı." }, { status: 404 });

  const { data: links } = await supabase
    .from("parent_player_links")
    .select("player_id")
    .eq("parent_id", session.parentId);
  const playerIds = (links ?? []).map((l: any) => l.player_id);

  if (!playerIds.length) {
    return NextResponse.json({ parent, children: [], announcements: [] });
  }

  const { data: players } = await supabase
    .from("players")
    .select(
      "id, full_name, position, jersey_number, photo_url, team_id, teams(display_name, category), license_status, license_expiry_date, health_status, document_status"
    )
    .in("id", playerIds);

  const teamIds = Array.from(new Set((players ?? []).map((p: any) => p.team_id).filter(Boolean)));

  const [
    { data: upcomingSessions },
    { data: attendance },
    { data: reports },
    { data: fees },
    { data: announcements },
    { data: evaluations },
    { data: squads },
  ] = await Promise.all([
    teamIds.length
      ? supabase
          .from("training_sessions")
          .select("*")
          .in("team_id", teamIds)
          .gte("session_date", new Date().toISOString().slice(0, 10))
          .order("session_date", { ascending: true })
          .limit(15)
      : Promise.resolve({ data: [] }),
    supabase
      .from("training_attendance")
      .select("*, training_sessions(session_date, start_time)")
      .in("player_id", playerIds)
      .order("created_at", { ascending: false })
      .limit(30),
    supabase
      .from("player_development_reports")
      .select("*")
      .in("player_id", playerIds)
      .order("created_at", { ascending: false })
      .limit(10),
    supabase
      .from("player_fees")
      .select("*")
      .in("player_id", playerIds)
      .order("due_date", { ascending: false })
      .limit(24),
    supabase
      .from("academy_announcements")
      .select("*")
      .eq("is_published", true)
      .order("created_at", { ascending: false })
      .limit(10),
    supabase
      .from("player_coach_evaluations")
      .select("*")
      .in("player_id", playerIds)
      .order("created_at", { ascending: true })
      .limit(50),
    // "Oynadığı maçlar" — kadroya girdiği maçlar, bitmiş maç sonucuyla birlikte.
    supabase
      .from("match_squads")
      .select("*, fixtures(opponent, home_or_away, match_date, competition, home_score, away_score, status)")
      .in("player_id", playerIds)
      .order("created_at", { ascending: false })
      .limit(30),
  ]);

  // Yaz/kış futbol okulu, kamp, turnuva gibi yaklaşan etkinlikler — çocuğa özel
  // değil, herkese açık genel etkinlik takvimiyle aynı kaynak.
  const { data: events } = await supabase
    .from("events")
    .select("id, title, type, start_date, location, registration_open")
    .gte("start_date", new Date().toISOString())
    .order("start_date", { ascending: true })
    .limit(8);

  return NextResponse.json({
    parent,
    children: players ?? [],
    upcomingSessions: upcomingSessions ?? [],
    attendance: attendance ?? [],
    reports: reports ?? [],
    fees: fees ?? [],
    announcements: announcements ?? [],
    evaluations: evaluations ?? [],
    squads: squads ?? [],
    events: events ?? [],
  });
}