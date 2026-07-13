import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { requireModuleAccess } from "@/lib/admin-guard";

const SAFE_COLUMNS = "id, email, full_name, role, is_active, totp_enabled, last_login_at, created_at";

export async function GET(req: NextRequest) {
  const access = await requireModuleAccess(req, "admin_users_create");
  if ("error" in access) return NextResponse.json({ error: access.error }, { status: access.status });
  if (access.session.role !== "super_admin") {
    return NextResponse.json({ error: "Yetkiniz yok." }, { status: 403 });
  }

  const supabase = createServiceClient();
  const { data, error } = await supabase.from("admin_users").select(SAFE_COLUMNS).order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}

// Yalnızca rol ve aktiflik durumu güncellenebilir — şifre/TOTP bu route üzerinden değiştirilemez.
export async function PATCH(req: NextRequest) {
  const access = await requireModuleAccess(req, "admin_users_create");
  if ("error" in access) return NextResponse.json({ error: access.error }, { status: access.status });
  if (access.session.role !== "super_admin") {
    return NextResponse.json({ error: "Yetkiniz yok." }, { status: 403 });
  }

  const { id, is_active, role } = await req.json().catch(() => ({}));
  if (!id) return NextResponse.json({ error: "id gerekli." }, { status: 400 });

  const updates: Record<string, unknown> = {};
  if (typeof is_active === "boolean") updates.is_active = is_active;
  if (role) updates.role = role;

  const supabase = createServiceClient();
  const { data, error } = await supabase.from("admin_users").update(updates).eq("id", id).select(SAFE_COLUMNS).single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await supabase.from("admin_audit_log").insert({
    admin_id: access.session.sub, action: "update", entity: "admin_users", entity_id: id, metadata: updates,
  });

  return NextResponse.json({ data });
}

export async function DELETE(req: NextRequest) {
  const access = await requireModuleAccess(req, "admin_users_create");
  if ("error" in access) return NextResponse.json({ error: access.error }, { status: access.status });
  if (access.session.role !== "super_admin") {
    return NextResponse.json({ error: "Yetkiniz yok." }, { status: 403 });
  }

  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id gerekli." }, { status: 400 });
  if (id === access.session.sub) {
    return NextResponse.json({ error: "Kendi hesabınızı silemezsiniz." }, { status: 400 });
  }

  const supabase = createServiceClient();
  const { error } = await supabase.from("admin_users").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await supabase.from("admin_audit_log").insert({
    admin_id: access.session.sub, action: "delete", entity: "admin_users", entity_id: id,
  });

  return NextResponse.json({ ok: true });
}
