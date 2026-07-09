import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { getScoutSession } from "@/lib/scout-guard";

export async function GET(req: NextRequest) {
  const session = getScoutSession(req);
  if (!session) return NextResponse.json({ error: "Oturum bulunamadı." }, { status: 401 });

  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("scout_watchlist")
    .select("id, note, created_at, players(id, full_name, position, jersey_number, photo_url)")
    .eq("scout_id", session.scoutId)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data: data ?? [] });
}

export async function POST(req: NextRequest) {
  const session = getScoutSession(req);
  if (!session) return NextResponse.json({ error: "Oturum bulunamadı." }, { status: 401 });

  const { playerId, note } = await req.json().catch(() => ({}));
  if (!playerId) return NextResponse.json({ error: "playerId gerekli." }, { status: 400 });

  const supabase = createServiceClient();
  const { error } = await supabase
    .from("scout_watchlist")
    .insert({ scout_id: session.scoutId, player_id: playerId, note: note ?? null });

  if (error) {
    if (error.code === "23505") return NextResponse.json({ error: "Bu oyuncu zaten listende." }, { status: 409 });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true }, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const session = getScoutSession(req);
  if (!session) return NextResponse.json({ error: "Oturum bulunamadı." }, { status: 401 });

  const playerId = req.nextUrl.searchParams.get("playerId");
  if (!playerId) return NextResponse.json({ error: "playerId gerekli." }, { status: 400 });

  const supabase = createServiceClient();
  const { error } = await supabase
    .from("scout_watchlist")
    .delete()
    .eq("scout_id", session.scoutId)
    .eq("player_id", playerId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
