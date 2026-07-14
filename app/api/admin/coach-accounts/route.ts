import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { requireModuleAccess } from "@/lib/admin-guard";
import { hashCoachPassword } from "@/lib/coach-auth";
import { friendlyError } from "@/lib/db-errors";
import { z } from "zod";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(10, "Şifre en az 10 karakter olmalı."),
  full_name: z.string().min(2).max(160),
  phone: z.string().max(30).optional(),
  team_ids: z.array(z.string().uuid()).min(1, "En az bir takım/kategori seçilmeli."),
});

export async function POST(req: NextRequest) {
  const access = await requireModuleAccess(req, "coach_accounts");
  if ("error" in access) return NextResponse.json({ error: access.error }, { status: access.status });
  if (access.session.role !== "super_admin") {
    return NextResponse.json({ error: "Yalnızca süper admin antrenör hesabı oluşturabilir." }, { status: 403 });
  }

  const parsed = schema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Geçersiz veri." }, { status: 400 });
  }
  const { email, password, full_name, phone, team_ids } = parsed.data;

  const supabase = createServiceClient();
  const password_hash = await hashCoachPassword(password);

  const { data: coach, error } = await supabase
    .from("coach_accounts")
    .insert({ email, password_hash, full_name, phone, is_active: true })
    .select()
    .single();
  if (error) return NextResponse.json({ error: friendlyError(error) }, { status: 500 });

  const links = team_ids.map((team_id: string) => ({ coach_id: coach.id, team_id }));
  const { error: linkError } = await supabase.from("coach_team_assignments").insert(links);
  if (linkError) return NextResponse.json({ error: friendlyError(linkError) }, { status: 500 });

  await supabase.from("admin_audit_log").insert({
    admin_id: access.session.sub,
    action: "create",
    entity: "coach_accounts",
    entity_id: coach.id,
    metadata: { team_ids },
  });

  return NextResponse.json({ ok: true, data: coach });
}

export async function GET(req: NextRequest) {
  const access = await requireModuleAccess(req, "coach_accounts");
  if ("error" in access) return NextResponse.json({ error: access.error }, { status: access.status });

  const supabase = createServiceClient();
  const { data: coaches } = await supabase
    .from("coach_accounts")
    .select("id, email, full_name, phone, is_active, last_login_at, created_at")
    .order("created_at", { ascending: false });

  const { data: links } = await supabase
    .from("coach_team_assignments")
    .select("coach_id, teams(id, display_name)");

  const withTeams = (coaches ?? []).map((c: any) => ({
    ...c,
    teams: (links ?? []).filter((l: any) => l.coach_id === c.id).map((l: any) => l.teams?.display_name).filter(Boolean),
  }));

  return NextResponse.json({ data: withTeams });
}

export async function PATCH(req: NextRequest) {
  const access = await requireModuleAccess(req, "coach_accounts");
  if ("error" in access) return NextResponse.json({ error: access.error }, { status: access.status });
  if (access.session.role !== "super_admin") {
    return NextResponse.json({ error: "Yalnızca süper admin değiştirebilir." }, { status: 403 });
  }

  const { id, is_active } = await req.json().catch(() => ({}));
  if (!id) return NextResponse.json({ error: "id gerekli." }, { status: 400 });

  const supabase = createServiceClient();
  const { error } = await supabase.from("coach_accounts").update({ is_active }).eq("id", id);
  if (error) return NextResponse.json({ error: friendlyError(error) }, { status: 500 });

  return NextResponse.json({ ok: true });
}
