import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { notifyParentsOfPlayer } from "@/lib/notifications";

// Günde bir kez GitHub Actions cron'u tarafından çağrılır (bkz.
// .github/workflows/dues-reminder-cron.yml). Vadesi geçmiş, henüz hatırlatma
// gönderilmemiş aidatları tarayıp veliye bir kez hatırlatma gönderir.
export async function POST(req: NextRequest) {
  const secret = req.headers.get("authorization")?.replace("Bearer ", "");
  if (!process.env.CRON_SECRET || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Yetkisiz." }, { status: 401 });
  }

  const supabase = createServiceClient();
  const today = new Date().toISOString().slice(0, 10);

  const { data: overdueFees } = await supabase
    .from("player_fees")
    .select("id, player_id, period_label, amount, due_date, players(full_name)")
    .eq("is_paid", false)
    .lt("due_date", today)
    .is("reminder_sent_at", null);

  let sent = 0;
  for (const fee of overdueFees ?? []) {
    try {
      await notifyParentsOfPlayer(fee.player_id, "aidat_hatirlatma", {
        player_name: (fee as any).players?.full_name ?? "",
        period_label: fee.period_label ?? "",
        amount: fee.amount,
        due_date: new Date(fee.due_date).toLocaleDateString("tr-TR"),
      });
      await supabase.from("player_fees").update({ reminder_sent_at: new Date().toISOString() }).eq("id", fee.id);
      sent += 1;
    } catch (e) {
      console.error("Aidat hatırlatma hatası:", e);
    }
  }

  return NextResponse.json({ ok: true, scanned: overdueFees?.length ?? 0, sent });
}
