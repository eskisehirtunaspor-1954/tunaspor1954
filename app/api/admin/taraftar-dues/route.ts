import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { requireModuleAccess } from "@/lib/admin-guard";
import { friendlyError } from "@/lib/db-errors";

export async function GET(req: NextRequest) {
  const access = await requireModuleAccess(req, "taraftar_accounts");
  if ("error" in access) return NextResponse.json({ error: access.error }, { status: access.status });

  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("taraftar_dues")
    .select("*, taraftar_accounts(full_name, membership_no)")
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: friendlyError(error) }, { status: 500 });
  return NextResponse.json({ data });
}

// Yönetici bir üyeye aidat kaydı atar (bağışlar zaten üyenin kendi panelinden
// oluşturulur, bkz. app/api/taraftar/dues).
export async function POST(req: NextRequest) {
  const access = await requireModuleAccess(req, "taraftar_accounts");
  if ("error" in access) return NextResponse.json({ error: access.error }, { status: access.status });

  const { taraftar_id, amount, note } = await req.json().catch(() => ({}));
  if (!taraftar_id || !amount) return NextResponse.json({ error: "Üye ve tutar gerekli." }, { status: 400 });

  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("taraftar_dues")
    .insert({ taraftar_id, type: "aidat", amount, status: "bekliyor", note })
    .select()
    .single();

  if (error) return NextResponse.json({ error: friendlyError(error) }, { status: 500 });

  await supabase.from("admin_audit_log").insert({
    admin_id: access.session.sub,
    action: "create",
    entity: "taraftar_dues",
    entity_id: data.id,
    metadata: { taraftar_id, amount },
  });

  return NextResponse.json({ data }, { status: 201 });
}

// Bir aidat/bağış kaydını ödendi/bekliyor olarak işaretler.
export async function PATCH(req: NextRequest) {
  const access = await requireModuleAccess(req, "taraftar_accounts");
  if ("error" in access) return NextResponse.json({ error: access.error }, { status: access.status });

  const { id, status, payment_method } = await req.json().catch(() => ({}));
  if (!id || !status) return NextResponse.json({ error: "id ve durum gerekli." }, { status: 400 });

  const supabase = createServiceClient();
  const { error } = await supabase
    .from("taraftar_dues")
    .update({ status, payment_method, paid_at: status === "odendi" ? new Date().toISOString() : null })
    .eq("id", id);

  if (error) return NextResponse.json({ error: friendlyError(error) }, { status: 500 });

  await supabase.from("admin_audit_log").insert({
    admin_id: access.session.sub,
    action: "update",
    entity: "taraftar_dues",
    entity_id: id,
    metadata: { status },
  });

  return NextResponse.json({ ok: true });
}
