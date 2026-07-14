import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { requireModuleAccess } from "@/lib/admin-guard";
import { friendlyError } from "@/lib/db-errors";

export async function GET(req: NextRequest) {
  const access = await requireModuleAccess(req, "scout_accounts");
  if ("error" in access) return NextResponse.json({ error: access.error }, { status: access.status });

  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("scout_accounts")
    .select("id, club_name, contact_name, email, phone, is_approved, is_active, last_login_at, created_at")
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: friendlyError(error) }, { status: 500 });
  return NextResponse.json({ data: data ?? [] });
}

export async function PATCH(req: NextRequest) {
  const access = await requireModuleAccess(req, "scout_accounts");
  if ("error" in access) return NextResponse.json({ error: access.error }, { status: access.status });
  if (access.session.role !== "super_admin") {
    return NextResponse.json({ error: "Yalnızca süper yönetici onaylayabilir." }, { status: 403 });
  }

  const { id, is_approved, is_active } = await req.json().catch(() => ({}));
  if (!id) return NextResponse.json({ error: "id gerekli." }, { status: 400 });

  const updates: Record<string, boolean> = {};
  if (typeof is_approved === "boolean") updates.is_approved = is_approved;
  if (typeof is_active === "boolean") updates.is_active = is_active;

  const supabase = createServiceClient();
  const { error } = await supabase.from("scout_accounts").update(updates).eq("id", id);
  if (error) return NextResponse.json({ error: friendlyError(error) }, { status: 500 });

  await supabase.from("admin_audit_log").insert({
    admin_id: access.session.sub,
    action: "update",
    entity: "scout_accounts",
    entity_id: id,
    metadata: updates,
  });

  return NextResponse.json({ ok: true });
}
