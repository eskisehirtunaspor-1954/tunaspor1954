import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { getTaraftarSession } from "@/lib/taraftar-guard";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { friendlyError } from "@/lib/db-errors";
import { z } from "zod";

const schema = z.object({
  amount: z.number().positive().max(1_000_000),
  payment_method: z.enum(["havale", "kapida_odeme", "elden"]).optional(),
  note: z.string().max(300).optional(),
});

// Gerçek bir ödeme altyapısı bağlı değil (bilinçli tercih) — taraftar burada
// yalnızca bir bağış NİYETİ bildirir ("bekliyor" durumunda kayıt oluşur),
// ödeme fiilen alındığında yönetici panelinden "ödendi" olarak işaretlenir.
export async function POST(req: NextRequest) {
  const session = await getTaraftarSession(req);
  if (!session) return NextResponse.json({ error: "Oturum bulunamadı." }, { status: 401 });

  if (!checkRateLimit("taraftar-dues-create", getClientIp(req), { windowMs: 60_000, max: 5 })) {
    return NextResponse.json({ error: "Çok fazla istek. Lütfen biraz sonra tekrar deneyin." }, { status: 429 });
  }

  const parsed = schema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Geçersiz veri." }, { status: 400 });
  }

  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("taraftar_dues")
    .insert({ taraftar_id: session.taraftarId, type: "bagis", status: "bekliyor", ...parsed.data })
    .select()
    .single();

  if (error) return NextResponse.json({ error: friendlyError(error) }, { status: 500 });
  return NextResponse.json({ ok: true, data }, { status: 201 });
}
