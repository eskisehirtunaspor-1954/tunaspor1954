import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { requireModuleAccess } from "@/lib/admin-guard";
import { hashParentPassword } from "@/lib/parent-auth";
import { z } from "zod";

// GÜVENLİK: Veli hesabı oluşturma ve çocuk eşleştirme YALNIZCA super_admin yapabilir.
// Bir alt-yetkili (editor/coach) bile bunu yapamaz — çünkü yanlış eşleştirme,
// bir yetişkinin başkasının çocuğunun kişisel verisine (devam durumu, gelişim
// raporu, aidat) erişmesi anlamına gelir. Bu asla self-servis bir işlem değildir.
const schema = z.object({
  email: z.string().email(),
  password: z.string().min(10, "Şifre en az 10 karakter olmalı."),
  full_name: z.string().min(2).max(160),
  phone: z.string().max(30).optional(),
  player_ids: z.array(z.string().uuid()).min(1, "En az bir çocuk seçilmeli."),
});

export async function POST(req: NextRequest) {
  const access = await requireModuleAccess(req, "parent_accounts");
  if ("error" in access) return NextResponse.json({ error: access.error }, { status: access.status });
  if (access.session.role !== "super_admin") {
    return NextResponse.json({ error: "Yalnızca süper yönetici veli hesabı oluşturabilir." }, { status: 403 });
  }

  const parsed = schema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Geçersiz veri." }, { status: 400 });
  }
  const { email, password, full_name, phone, player_ids } = parsed.data;

  const supabase = createServiceClient();
  const password_hash = await hashParentPassword(password);

  const { data: parent, error } = await supabase
    .from("parent_accounts")
    .insert({ email, password_hash, full_name, phone, is_active: true })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const links = player_ids.map((player_id) => ({ parent_id: parent.id, player_id }));
  const { error: linkError } = await supabase.from("parent_player_links").insert(links);
  if (linkError) return NextResponse.json({ error: linkError.message }, { status: 500 });

  await supabase.from("admin_audit_log").insert({
    admin_id: access.session.sub,
    action: "create",
    entity: "parent_accounts",
    entity_id: parent.id,
    metadata: { player_ids },
  });

  return NextResponse.json({ ok: true, data: parent });
}

// Mevcut veli hesaplarını (ve bağlı çocuklarını) listele
export async function GET(req: NextRequest) {
  const access = await requireModuleAccess(req, "parent_accounts");
  if ("error" in access) return NextResponse.json({ error: access.error }, { status: access.status });

  const supabase = createServiceClient();
  const { data: parents } = await supabase
    .from("parent_accounts")
    .select("id, email, full_name, phone, is_active, last_login_at, created_at")
    .order("created_at", { ascending: false });

  const { data: links } = await supabase
    .from("parent_player_links")
    .select("parent_id, players(id, full_name)");


    const withChildren = (parents ?? []).map((p: any) => ({
  ...p,
  children: (links ?? [])
    .filter((l: any) => l.parent_id === p.id)
    .map((l: any) => l.players),
}));


  return NextResponse.json({ data: withChildren });
}

// Hesabı aktif/pasif yap (silmek yerine — geçmiş kayıtlarla ilişkiler korunur)
export async function PATCH(req: NextRequest) {
  const access = await requireModuleAccess(req, "parent_accounts");
  if ("error" in access) return NextResponse.json({ error: access.error }, { status: access.status });
  if (access.session.role !== "super_admin") {
    return NextResponse.json({ error: "Yalnızca süper yönetici değiştirebilir." }, { status: 403 });
  }

  const { id, is_active } = await req.json().catch(() => ({}));
  if (!id) return NextResponse.json({ error: "id gerekli." }, { status: 400 });

  const supabase = createServiceClient();
  const { error } = await supabase.from("parent_accounts").update({ is_active }).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
