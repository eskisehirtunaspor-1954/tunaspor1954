import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { z } from "zod";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

const schema = z.object({
  nickname: z
    .string()
    .min(2, "Rumuz en az 2 karakter olmalı.")
    .max(20, "Rumuz en fazla 20 karakter olabilir.")
    .regex(/^[\p{L}0-9 _-]+$/u, "Rumuzda sadece harf, rakam, boşluk, - ve _ kullanılabilir."),
  score: z.number().int().min(0).max(5),
});

export async function POST(req: NextRequest) {
  if (!checkRateLimit("game-score-submit", getClientIp(req), { windowMs: 60_000, max: 10 })) {
    return NextResponse.json({ error: "Çok fazla istek." }, { status: 429 });
  }

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Geçersiz veri." }, { status: 400 });
  }

  const supabase = createServiceClient();
  const { error } = await supabase.from("game_scores").insert(parsed.data);
  if (error) return NextResponse.json({ error: "Kaydedilemedi." }, { status: 500 });

  return NextResponse.json({ ok: true });
}

// Haftalık liderlik tablosu (bu haftanın Pazartesi 00:00'ından itibaren)
export async function GET() {
  const supabase = createServiceClient();

  const now = new Date();
  const day = now.getDay(); // 0=Pazar
  const diffToMonday = day === 0 ? 6 : day - 1;
  const monday = new Date(now);
  monday.setHours(0, 0, 0, 0);
  monday.setDate(now.getDate() - diffToMonday);

  const { data, error } = await supabase
    .from("game_scores")
    .select("nickname, score, created_at")
    .gte("created_at", monday.toISOString())
    .order("score", { ascending: false })
    .order("created_at", { ascending: true })
    .limit(20);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data: data ?? [], weekStart: monday.toISOString() });
}
