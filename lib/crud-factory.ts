import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { requireModuleAccess } from "@/lib/admin-guard";

interface CrudOptions {
  table: string;
  moduleName: string;
  defaultOrder?: { column: string; ascending?: boolean };
}

// Her admin modülü için tek tip GET (liste) / POST (oluştur) / PATCH (güncelle) /
// DELETE (sil) davranışı üretir. Rol bazlı erişim requireModuleAccess ile kontrol edilir,
// tüm yazma işlemleri admin_audit_log tablosuna kaydedilir.
export function createCrudHandlers({ table, moduleName, defaultOrder }: CrudOptions) {
  async function GET(req: NextRequest) {
    const access = requireModuleAccess(req, moduleName);
    if ("error" in access) return NextResponse.json({ error: access.error }, { status: access.status });

    const supabase = createServiceClient();
    let query = supabase.from(table).select("*");
    if (defaultOrder) query = query.order(defaultOrder.column, { ascending: defaultOrder.ascending ?? false });

    const { data, error } = await query;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ data });
  }

  async function POST(req: NextRequest) {
    const access = requireModuleAccess(req, moduleName);
    if ("error" in access) return NextResponse.json({ error: access.error }, { status: access.status });

    const body = await req.json().catch(() => null);
    if (!body) return NextResponse.json({ error: "Geçersiz istek gövdesi." }, { status: 400 });

    const supabase = createServiceClient();
    const { data, error } = await supabase.from(table).insert(body).select().single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    await supabase.from("admin_audit_log").insert({
      admin_id: access.session.sub,
      action: "create",
      entity: table,
      entity_id: data.id,
      metadata: body,
    });

    return NextResponse.json({ data }, { status: 201 });
  }

  async function PATCH(req: NextRequest) {
    const access = requireModuleAccess(req, moduleName);
    if ("error" in access) return NextResponse.json({ error: access.error }, { status: access.status });

    const body = await req.json().catch(() => null);
    if (!body?.id) return NextResponse.json({ error: "Kayıt id'si gerekli." }, { status: 400 });

    const { id, ...updates } = body;
    const supabase = createServiceClient();
    const { data, error } = await supabase.from(table).update(updates).eq("id", id).select().single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    await supabase.from("admin_audit_log").insert({
      admin_id: access.session.sub,
      action: "update",
      entity: table,
      entity_id: id,
      metadata: updates,
    });

    return NextResponse.json({ data });
  }

  async function DELETE(req: NextRequest) {
    const access = requireModuleAccess(req, moduleName);
    if ("error" in access) return NextResponse.json({ error: access.error }, { status: access.status });

    const id = req.nextUrl.searchParams.get("id");
    if (!id) return NextResponse.json({ error: "Kayıt id'si gerekli." }, { status: 400 });

    const supabase = createServiceClient();
    const { error } = await supabase.from(table).delete().eq("id", id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    await supabase.from("admin_audit_log").insert({
      admin_id: access.session.sub,
      action: "delete",
      entity: table,
      entity_id: id,
    });

    return NextResponse.json({ ok: true });
  }

  return { GET, POST, PATCH, DELETE };
}
