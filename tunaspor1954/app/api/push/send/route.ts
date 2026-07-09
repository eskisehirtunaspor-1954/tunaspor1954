import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { requireModuleAccess } from "@/lib/admin-guard";
import { webpush } from "@/lib/push";

export async function POST(req: NextRequest) {
  const access = await requireModuleAccess(req, "news"); // yayın yetkisi olan editör/süper admin gönderebilir
  if ("error" in access) return NextResponse.json({ error: access.error }, { status: access.status });

  const { title, body: message, url } = await req.json().catch(() => ({}));
  if (!title || !message) {
    return NextResponse.json({ error: "Başlık ve mesaj zorunludur." }, { status: 400 });
  }

  const supabase = createServiceClient();
  const { data: subscriptions } = await supabase.from("push_subscriptions").select("*");

  const payload = JSON.stringify({ title, body: message, url: url ?? "/" });
  let sent = 0;
  let failed = 0;

  for (const sub of subscriptions ?? []) {
    try {
      await webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        payload
      );
      sent += 1;
    } catch {
      failed += 1;
      // Geçersiz/expired abonelikleri temizle
      await supabase.from("push_subscriptions").delete().eq("id", sub.id);
    }
  }

  return NextResponse.json({ ok: true, sent, failed });
}
