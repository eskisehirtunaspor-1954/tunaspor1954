import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import crypto from "crypto";

// GÜVENLİK: IP adresi düz metin olarak saklanmıyor — hash'lenip tutuluyor,
// ama yine de "aynı IP iki kez oy veremez" kısıtını uygulamaya yetiyor.
function hashIp(ip: string): string {
  return crypto.createHash("sha256").update(ip).digest("hex");
}

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  if (!checkRateLimit("jersey-design-vote", ip, { windowMs: 60_000, max: 20 })) {
    return NextResponse.json({ error: "Çok fazla istek." }, { status: 429 });
  }

  const { designId } = await req.json().catch(() => ({}));
  if (!designId) return NextResponse.json({ error: "Tasarım id'si gerekli." }, { status: 400 });

  const supabase = createServiceClient();
  const voterIpHash = hashIp(ip);

  // unique(design_id, voter_ip_hash) kısıtı sayesinde aynı IP aynı tasarıma
  // ikinci kez oy veremez — insert çakışırsa hata döner, o da "zaten oy verdin" demektir.
  const { error: voteError } = await supabase
    .from("jersey_design_votes")
    .insert({ design_id: designId, voter_ip_hash: voterIpHash });

  if (voteError) {
    return NextResponse.json({ error: "Bu tasarıma zaten oy verdin." }, { status: 409 });
  }

  const { data, error } = await supabase.rpc("increment_jersey_votes", { design_id_input: designId });

  if (error) {
    // rpc yoksa (migration çalıştırılmadıysa) basit fallback: oku-artır-yaz
    const { data: current } = await supabase.from("jersey_designs").select("votes").eq("id", designId).single();
    if (!current) return NextResponse.json({ error: "Tasarım bulunamadı." }, { status: 404 });
    await supabase.from("jersey_designs").update({ votes: current.votes + 1 }).eq("id", designId);
    return NextResponse.json({ ok: true, votes: current.votes + 1 });
  }

  return NextResponse.json({ ok: true, votes: data });
}
