import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { getCoachSession } from "@/lib/coach-guard";
import { z } from "zod";

const bodySchema = z.object({
  session_id: z.string().uuid(),
  records: z.array(z.object({
    player_id: z.string().uuid(),
    status: z.enum(["katildi", "katilmadi", "izinli"]),
    note: z.string().max(500).optional(),
  })).min(1),
});

export async function POST(req: NextRequest) {
  const session = await getCoachSession(req);
  if (!session) return NextResponse.json({ error: "Oturum bulunamadı, lütfen giriş yapın." }, { status: 401 });

  const parsed = bodySchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Geçersiz veri." }, { status: 400 });
  }
  const { session_id, records } = parsed.data;

  const supabase = createServiceClient();

  // Güvenlik: bu antrenman oturumu, antrenörün kendi atandığı bir takıma mı ait?
  // Aksi halde bir antrenör başka bir kategorinin yoklamasını girebilirdi.
  const { data: trainingSession } = await supabase
    .from("training_sessions")
    .select("id, team_id")
    .eq("id", session_id)
    .single();
  if (!trainingSession) return NextResponse.json({ error: "Antrenman oturumu bulunamadı." }, { status: 404 });

  const { data: assignment } = await supabase
    .from("coach_team_assignments")
    .select("id")
    .eq("coach_id", session.coachId)
    .eq("team_id", trainingSession.team_id)
    .maybeSingle();
  if (!assignment) return NextResponse.json({ error: "Bu takıma erişim yetkiniz yok." }, { status: 403 });

  const rows = records.map((r) => ({ session_id, player_id: r.player_id, status: r.status, note: r.note ?? null }));
  const { error } = await supabase.from("training_attendance").upsert(rows, { onConflict: "session_id,player_id" });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
