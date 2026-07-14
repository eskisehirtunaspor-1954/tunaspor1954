import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { getParentSession } from "@/lib/parent-guard";
import { friendlyError } from "@/lib/db-errors";

export async function POST(req: NextRequest) {
  if (!checkRateLimit("push-subscribe", getClientIp(req), { windowMs: 60_000, max: 10 })) {
    return NextResponse.json({ error: "Çok fazla istek. Lütfen biraz sonra tekrar deneyin." }, { status: 429 });
  }

  const body = await req.json().catch(() => null);
  if (!body?.endpoint || !body?.keys?.p256dh || !body?.keys?.auth) {
    return NextResponse.json({ error: "Geçersiz abonelik verisi." }, { status: 400 });
  }

  // Veli oturumu varsa (örn. /veli/panel'deyken bu istek atıldıysa) aboneliği
  // o veliyle eşleştiriyoruz — hedefli push bildirim (devamsızlık/aidat) bunu gerektirir.
  const parentSession = await getParentSession(req);

  const supabase = createServiceClient();
  const { error } = await supabase.from("push_subscriptions").upsert(
    {
      endpoint: body.endpoint,
      p256dh: body.keys.p256dh,
      auth: body.keys.auth,
      ...(parentSession ? { parent_id: parentSession.parentId } : {}),
    },
    { onConflict: "endpoint" }
  );
  if (error) return NextResponse.json({ error: friendlyError(error) }, { status: 500 });

  return NextResponse.json({ ok: true });
}
