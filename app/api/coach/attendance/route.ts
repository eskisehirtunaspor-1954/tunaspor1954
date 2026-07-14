import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { getCoachSession } from "@/lib/coach-guard";
import { notifyParentsOfPlayer } from "@/lib/notifications";
import { friendlyError } from "@/lib/db-errors";
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
    .select("id, team_id, session_date, start_time, teams(display_name)")
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
  if (error) return NextResponse.json({ error: friendlyError(error) }, { status: 500 });

  // Devamsızlık sayısını otomatik güncelle + katılmayan oyuncuların velisine bildirim gönder.
  // (Hata olursa ana işlemi bozmasın diye best-effort — yoklama zaten kaydedildi.)
  const teamName = (trainingSession as any).teams?.display_name ?? "Antrenman";
  for (const r of records) {
    try {
      const { count } = await supabase
        .from("training_attendance")
        .select("id", { count: "exact", head: true })
        .eq("player_id", r.player_id)
        .eq("status", "katilmadi");
      await supabase.from("players").update({ missed_trainings_count: count ?? 0 }).eq("id", r.player_id);

      if (r.status === "katilmadi") {
        const { data: player } = await supabase.from("players").select("full_name").eq("id", r.player_id).single();
        await notifyParentsOfPlayer(r.player_id, "antrenman_devamsizlik", {
          player_name: player?.full_name ?? "",
          date: new Date(trainingSession.session_date).toLocaleDateString("tr-TR"),
          time: trainingSession.start_time,
          team_name: teamName,
        });
      }
    } catch (e) {
      console.error("Devamsızlık bildirimi/hesabı hatası:", e);
    }
  }

  return NextResponse.json({ ok: true });
}
