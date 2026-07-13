import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { getCoachSession } from "@/lib/coach-guard";

export async function GET(req: NextRequest) {
  const session = await getCoachSession(req);
  if (!session) return NextResponse.json({ error: "Oturum bulunamadı, lütfen giriş yapın." }, { status: 401 });

  const supabase = createServiceClient();

  const { data: coach } = await supabase
    .from("coach_accounts")
    .select("id, full_name, email, phone")
    .eq("id", session.coachId)
    .single();
  if (!coach) return NextResponse.json({ error: "Hesap bulunamadı." }, { status: 404 });

  const { data: assignments } = await supabase
    .from("coach_team_assignments")
    .select("team_id, teams(id, display_name, category)")
    .eq("coach_id", session.coachId);

  const teams = (assignments ?? []).map((a: any) => a.teams).filter(Boolean);
  const teamIds = teams.map((t: any) => t.id);

  if (!teamIds.length) {
    return NextResponse.json({ coach, teams: [], players: [], upcomingSessions: [], attendance: [], reports: [] });
  }

  const [
    { data: players },
    { data: upcomingSessions },
    { data: attendance },
    { data: reports },
  ] = await Promise.all([
    supabase.from("players").select("*").in("team_id", teamIds).eq("is_published", true).order("jersey_number"),
    supabase
      .from("training_sessions")
      .select("*")
      .in("team_id", teamIds)
      .gte("session_date", new Date().toISOString().slice(0, 10))
      .order("session_date", { ascending: true })
      .limit(20),
    supabase
      .from("training_attendance")
      .select("*, training_sessions!inner(team_id, session_date, start_time)")
      .in("training_sessions.team_id", teamIds)
      .order("created_at", { ascending: false })
      .limit(200),
    supabase
      .from("player_development_reports")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100),
  ]);

  const playerIds = new Set((players ?? []).map((p: any) => p.id));
  const scopedReports = (reports ?? []).filter((r: any) => playerIds.has(r.player_id));

  return NextResponse.json({
    coach,
    teams,
    players: players ?? [],
    upcomingSessions: upcomingSessions ?? [],
    attendance: attendance ?? [],
    reports: scopedReports,
  });
}
