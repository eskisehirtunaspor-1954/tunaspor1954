import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { requireModuleAccess } from "@/lib/admin-guard";
import { friendlyError } from "@/lib/db-errors";

// Veli hesapları gibi taraftar hesapları da yalnızca Süper Admin tarafından
// yönetilir — üye şifre hash'i asla döndürülmez.
export async function GET(req: NextRequest) {
  const access = await requireModuleAccess(req, "taraftar_accounts");
  if ("error" in access) return NextResponse.json({ error: access.error }, { status: access.status });

  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("taraftar_accounts")
    .select(
      "id, full_name, email, phone, membership_no, membership_status, membership_start_date, membership_end_date, badge_tier, is_active, last_login_at, created_at"
    )
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: friendlyError(error) }, { status: 500 });
  return NextResponse.json({ data });
}

export async function PATCH(req: NextRequest) {
  const access = await requireModuleAccess(req, "taraftar_accounts");
  if ("error" in access) return NextResponse.json({ error: access.error }, { status: access.status });
  if (access.session.role !== "super_admin") {
    return NextResponse.json({ error: "Yalnızca süper yönetici değiştirebilir." }, { status: 403 });
  }

  const { id, ...updates } = await req.json().catch(() => ({}));
  if (!id) return NextResponse.json({ error: "id gerekli." }, { status: 400 });

  const allowed = ["membership_status", "membership_end_date", "badge_tier", "is_active"];
  const patch = Object.fromEntries(Object.entries(updates).filter(([k]) => allowed.includes(k)));

  const supabase = createServiceClient();
  const { error } = await supabase.from("taraftar_accounts").update(patch).eq("id", id);
  if (error) return NextResponse.json({ error: friendlyError(error) }, { status: 500 });

  await supabase.from("admin_audit_log").insert({
    admin_id: access.session.sub,
    action: "update",
    entity: "taraftar_accounts",
    entity_id: id,
    metadata: patch,
  });

  return NextResponse.json({ ok: true });
}
