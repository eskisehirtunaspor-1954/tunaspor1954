import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { requireModuleAccess } from "@/lib/admin-guard";
import { friendlyError } from "@/lib/db-errors";
import { notifyParentsOfPlayer } from "@/lib/notifications";

// Bu tablo generic crud-factory yerine özel bir route kullanıyor: bir aidat
// kaydı ödendi işaretlendiğinde oyuncunun players.fee_paid_total/fee_balance/
// fee_last_payment_at özetini yeniden hesaplamamız ve veliye teşekkür bildirimi
// göndermemiz gerekiyor — bu iş mantığı generic factory'e sığmıyor.
async function syncPlayerFeeSummary(playerId: string) {
  const supabase = createServiceClient();
  const { data: fees } = await supabase.from("player_fees").select("amount, is_paid").eq("player_id", playerId);

  const paidTotal = (fees ?? []).filter((f: any) => f.is_paid).reduce((sum: number, f: any) => sum + Number(f.amount), 0);
  const balance = (fees ?? []).filter((f: any) => !f.is_paid).reduce((sum: number, f: any) => sum + Number(f.amount), 0);

  await supabase.from("players").update({ fee_paid_total: paidTotal, fee_balance: balance }).eq("id", playerId);
}

export async function GET(req: NextRequest) {
  const access = await requireModuleAccess(req, "player_fees");
  if ("error" in access) return NextResponse.json({ error: access.error }, { status: access.status });

  const supabase = createServiceClient();
  const { data, error } = await supabase.from("player_fees").select("*").order("due_date", { ascending: false });
  if (error) return NextResponse.json({ error: friendlyError(error) }, { status: 500 });
  return NextResponse.json({ data });
}

export async function POST(req: NextRequest) {
  const access = await requireModuleAccess(req, "player_fees");
  if ("error" in access) return NextResponse.json({ error: access.error }, { status: access.status });

  const body = await req.json().catch(() => null);
  if (!body?.player_id) return NextResponse.json({ error: "Oyuncu seçilmedi." }, { status: 400 });

  const supabase = createServiceClient();
  const { data, error } = await supabase.from("player_fees").insert(body).select().single();
  if (error) return NextResponse.json({ error: friendlyError(error) }, { status: 500 });

  await syncPlayerFeeSummary(body.player_id);

  await supabase.from("admin_audit_log").insert({
    admin_id: access.session.sub, action: "create", entity: "player_fees", entity_id: data.id, metadata: body,
  });

  return NextResponse.json({ data }, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const access = await requireModuleAccess(req, "player_fees");
  if ("error" in access) return NextResponse.json({ error: access.error }, { status: access.status });

  const body = await req.json().catch(() => null);
  if (!body?.id) return NextResponse.json({ error: "Kayıt id'si gerekli." }, { status: 400 });
  const { id, ...updates } = body;

  const supabase = createServiceClient();
  const { data: before } = await supabase.from("player_fees").select("player_id, is_paid, period_label").eq("id", id).single();

  const { data, error } = await supabase.from("player_fees").update(updates).eq("id", id).select().single();
  if (error) return NextResponse.json({ error: friendlyError(error) }, { status: 500 });

  await syncPlayerFeeSummary(data.player_id);

  const justPaid = before && !before.is_paid && updates.is_paid === true;
  if (justPaid) {
    await supabase.from("players").update({ fee_last_payment_at: new Date().toISOString().slice(0, 10) }).eq("id", data.player_id);
    const { data: player } = await supabase.from("players").select("full_name").eq("id", data.player_id).single();
    await notifyParentsOfPlayer(data.player_id, "aidat_tesekkur", {
      player_name: player?.full_name ?? "",
      period_label: data.period_label ?? "",
    }).catch((e) => console.error("Aidat teşekkür bildirimi hatası:", e));
  }

  await supabase.from("admin_audit_log").insert({
    admin_id: access.session.sub, action: "update", entity: "player_fees", entity_id: id, metadata: updates,
  });

  return NextResponse.json({ data });
}

export async function DELETE(req: NextRequest) {
  const access = await requireModuleAccess(req, "player_fees");
  if ("error" in access) return NextResponse.json({ error: access.error }, { status: access.status });

  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Kayıt id'si gerekli." }, { status: 400 });

  const supabase = createServiceClient();
  const { data: before } = await supabase.from("player_fees").select("player_id").eq("id", id).single();

  const { error } = await supabase.from("player_fees").delete().eq("id", id);
  if (error) return NextResponse.json({ error: friendlyError(error) }, { status: 500 });

  if (before?.player_id) await syncPlayerFeeSummary(before.player_id);

  await supabase.from("admin_audit_log").insert({
    admin_id: access.session.sub, action: "delete", entity: "player_fees", entity_id: id,
  });

  return NextResponse.json({ ok: true });
}
