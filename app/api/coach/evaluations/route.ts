import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { getCoachSession } from "@/lib/coach-guard";
import { z } from "zod";

const bodySchema = z.object({
  player_id: z.string().uuid(),
  period_label: z.string().min(2).max(120),
  technical_score: z.number().int().min(1).max(10),
  tactical_score: z.number().int().min(1).max(10),
  physical_score: z.number().int().min(1).max(10),
  mental_score: z.number().int().min(1).max(10),
  comment: z.string().max(2000).optional(),
});

// player_development_reports (serbest metin) ile aynı yetki deseni: antrenör
// yalnızca kendi atandığı takımın oyuncularını değerlendirebilir.
export async function POST(req: NextRequest) {
  const session = await getCoachSession(req);
  if (!session) return NextResponse.json({ error: "Oturum bulunamadı, lütfen giriş yapın." }, { status: 401 });

  const parsed = bodySchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Geçersiz veri." }, { status: 400 });
  }
  const { player_id, ...scores } = parsed.data;

  const supabase = createServiceClient();

  const { data: player } = await supabase.from("players").select("id, team_id").eq("id", player_id).single();
  if (!player) return NextResponse.json({ error: "Oyuncu bulunamadı." }, { status: 404 });

  const { data: assignment } = await supabase
    .from("coach_team_assignments")
    .select("id")
    .eq("coach_id", session.coachId)
    .eq("team_id", player.team_id)
    .maybeSingle();
  if (!assignment) return NextResponse.json({ error: "Bu oyuncuya erişim yetkiniz yok." }, { status: 403 });

  const { data, error } = await supabase
    .from("player_coach_evaluations")
    .insert({ player_id, ...scores })
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true, data });
}
