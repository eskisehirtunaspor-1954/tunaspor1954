import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  if (!checkRateLimit("push-subscribe", getClientIp(req), { windowMs: 60_000, max: 10 })) {
    return NextResponse.json({ error: "Çok fazla istek. Lütfen biraz sonra tekrar deneyin." }, { status: 429 });
  }

  const body = await req.json().catch(() => null);
  if (!body?.endpoint || !body?.keys?.p256dh || !body?.keys?.auth) {
    return NextResponse.json({ error: "Geçersiz abonelik verisi." }, { status: 400 });
  }

  const supabase = createServiceClient();
  const { error } = await supabase.from("push_subscriptions").upsert(
    { endpoint: body.endpoint, p256dh: body.keys.p256dh, auth: body.keys.auth },
    { onConflict: "endpoint" }
  );
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
