import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { getCoachSession } from "@/lib/coach-guard";
import { friendlyError } from "@/lib/db-errors";
import { z } from "zod";

const bodySchema = z.object({
  fixture_id: z.string().uuid(),
  entries: z
    .array(
      z.object({
        player_id: z.string().uuid(),
        is_starting: z.boolean(),
        minutes_played: z.number().int().min(0).max(120).optional(),
        goals: z.number().int().min(0).optional(),
        assists: z.number().int().min(0).optional(),
        yellow_card: z.boolean().optional(),
        red_card: z.boolean().optional(),
      })
    )
    .min(1),
});

// Antrenör, kendi takımının bir maçı için kadro/istatistik bilgisini girer —
// veli panelinde "oynadığı maçlar" bu kayıtlardan türetilir.
export async function POST(req: NextRequest) {
  const session = await getCoachSession(req);
  if (!session) return NextResponse.json({ error: "Oturum bulunamadı, lütfen giriş yapın." }, { status: 401 });

  const parsed = bodySchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Geçersiz veri." }, { status: 400 });
  }
  const { fixture_id, entries } = parsed.data;

  const supabase = createServiceClient();

  const { data: fixture } = await supabase.from("fixtures").select("id, team_id").eq("id", fixture_id).single();
  if (!fixture) return NextResponse.json({ error: "Maç bulunamadı." }, { status: 404 });

  const { data: assignment } = await supabase
    .from("coach_team_assignments")
    .select("id")
    .eq("coach_id", session.coachId)
    .eq("team_id", fixture.team_id)
    .maybeSingle();
  if (!assignment) return NextResponse.json({ error: "Bu maça erişim yetkiniz yok." }, { status: 403 });

  const rows = entries.map((e) => ({ fixture_id, ...e }));
  const { error } = await supabase.from("match_squads").upsert(rows, { onConflict: "fixture_id,player_id" });
  if (error) return NextResponse.json({ error: friendlyError(error) }, { status: 500 });

  return NextResponse.json({ ok: true });
}
