import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { getScoutSession } from "@/lib/scout-guard";
import { checkRateLimit } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  const session = getScoutSession(req);
  if (!session) return NextResponse.json({ error: "Oturum bulunamadı." }, { status: 401 });

  if (!checkRateLimit("scout-contact", session.scoutId, { windowMs: 60_000, max: 10 })) {
    return NextResponse.json({ error: "Çok fazla istek." }, { status: 429 });
  }

  const { playerId, message } = await req.json().catch(() => ({}));
  if (!playerId || !message || String(message).length < 5) {
    return NextResponse.json({ error: "Oyuncu ve mesaj (en az 5 karakter) gerekli." }, { status: 400 });
  }

  const supabase = createServiceClient();
  const { error } = await supabase.from("scout_contact_requests").insert({
    scout_id: session.scoutId,
    player_id: playerId,
    message: String(message).slice(0, 1000),
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true }, { status: 201 });
}
