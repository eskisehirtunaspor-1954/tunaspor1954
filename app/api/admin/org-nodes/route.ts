import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { requireModuleAccess } from "@/lib/admin-guard";
import { friendlyError } from "@/lib/db-errors";
import { z } from "zod";

// Silinmiş (deleted_at dolu) kayıtlar da dahil TÜM ağaç döner — admin panelinin
// "Silinenler / Geri Yükle" bölümü bu sayede aynı tek istekten çalışır.
export async function GET(req: NextRequest) {
  const access = await requireModuleAccess(req, "org_nodes");
  if ("error" in access) return NextResponse.json({ error: access.error }, { status: access.status });

  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("org_nodes")
    .select("*, staff_members(full_name, role, photo_url)")
    .order("display_order", { ascending: true });

  if (error) return NextResponse.json({ error: friendlyError(error) }, { status: 500 });
  return NextResponse.json({ data });
}

const createSchema = z.object({
  parent_id: z.string().uuid().nullable().optional(),
  title: z.string().min(1).max(160),
  node_type: z.enum(["baslik", "personel", "sayfa_baglantisi", "metin"]).default("baslik"),
  staff_id: z.string().uuid().nullable().optional(),
  link_href: z.string().max(300).nullable().optional(),
  content: z.string().max(4000).nullable().optional(),
});

export async function POST(req: NextRequest) {
  const access = await requireModuleAccess(req, "org_nodes");
  if ("error" in access) return NextResponse.json({ error: access.error }, { status: access.status });

  const parsed = createSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Geçersiz veri." }, { status: 400 });
  }

  const supabase = createServiceClient();

  // Yeni düğüm, aynı üst öğenin altındaki en büyük sıra numarasının bir fazlasına yerleşir.
  let siblingQuery = supabase.from("org_nodes").select("display_order").is("deleted_at", null);
  siblingQuery = parsed.data.parent_id
    ? siblingQuery.eq("parent_id", parsed.data.parent_id)
    : siblingQuery.is("parent_id", null);
  const { data: siblings } = await siblingQuery.order("display_order", { ascending: false }).limit(1);
  const nextOrder = (siblings?.[0]?.display_order ?? -1) + 1;

  const { data, error } = await supabase
    .from("org_nodes")
    .insert({ ...parsed.data, display_order: nextOrder })
    .select()
    .single();

  if (error) return NextResponse.json({ error: friendlyError(error) }, { status: 500 });

  await supabase.from("admin_audit_log").insert({
    admin_id: access.session.sub,
    action: "create",
    entity: "org_nodes",
    entity_id: data.id,
    metadata: parsed.data,
  });

  return NextResponse.json({ data }, { status: 201 });
}

const patchSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1).max(160).optional(),
  is_active: z.boolean().optional(),
  is_hidden: z.boolean().optional(),
  content: z.string().max(4000).nullable().optional(),
  link_href: z.string().max(300).nullable().optional(),
  staff_id: z.string().uuid().nullable().optional(),
  display_order: z.number().int().optional(),
  deleted_at: z.string().nullable().optional(),
});

export async function PATCH(req: NextRequest) {
  const access = await requireModuleAccess(req, "org_nodes");
  if ("error" in access) return NextResponse.json({ error: access.error }, { status: access.status });

  const parsed = patchSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Geçersiz veri." }, { status: 400 });
  }
  const { id, ...updates } = parsed.data;

  const supabase = createServiceClient();
  const { data, error } = await supabase.from("org_nodes").update(updates).eq("id", id).select().single();
  if (error) return NextResponse.json({ error: friendlyError(error) }, { status: 500 });

  await supabase.from("admin_audit_log").insert({
    admin_id: access.session.sub,
    action: "update",
    entity: "org_nodes",
    entity_id: id,
    metadata: updates,
  });

  return NextResponse.json({ data });
}

// Kalıcı silme yerine yumuşak silme (deleted_at) kullanılır, bu yüzden DELETE
// yalnızca gerçekten kalıcı temizlik gerektiğinde kullanılır (nadiren).
export async function DELETE(req: NextRequest) {
  const access = await requireModuleAccess(req, "org_nodes");
  if ("error" in access) return NextResponse.json({ error: access.error }, { status: access.status });

  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id gerekli." }, { status: 400 });

  const supabase = createServiceClient();
  const { error } = await supabase.from("org_nodes").delete().eq("id", id);
  if (error) return NextResponse.json({ error: friendlyError(error) }, { status: 500 });

  await supabase.from("admin_audit_log").insert({
    admin_id: access.session.sub,
    action: "delete",
    entity: "org_nodes",
    entity_id: id,
  });

  return NextResponse.json({ ok: true });
}
