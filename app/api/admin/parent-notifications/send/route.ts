import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { requireModuleAccess } from "@/lib/admin-guard";
import { notifyParentsDirect } from "@/lib/notifications";
import { z } from "zod";

const bodySchema = z.object({
  target: z.enum(["parent", "team", "all"]),
  parentId: z.string().uuid().optional(),
  teamId: z.string().uuid().optional(),
  subject: z.string().min(1, "Başlık gerekli."),
  message: z.string().min(1, "Mesaj gerekli."),
});

export async function POST(req: NextRequest) {
  const access = await requireModuleAccess(req, "parent_notifications");
  if ("error" in access) return NextResponse.json({ error: access.error }, { status: access.status });

  const parsed = bodySchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Geçersiz veri." }, { status: 400 });
  }
  const { target, parentId, teamId, subject, message } = parsed.data;

  const supabase = createServiceClient();
  let parentIds: string[] = [];

  if (target === "parent") {
    if (!parentId) return NextResponse.json({ error: "Veli seçilmedi." }, { status: 400 });
    parentIds = [parentId];
  } else if (target === "team") {
    if (!teamId) return NextResponse.json({ error: "Takım seçilmedi." }, { status: 400 });
    const { data: players } = await supabase.from("players").select("id").eq("team_id", teamId);
    const playerIds = (players ?? []).map((p: any) => p.id);
    if (!playerIds.length) return NextResponse.json({ ok: true, sent: 0, failed: 0 });
    const { data: links } = await supabase.from("parent_player_links").select("parent_id").in("player_id", playerIds);
    parentIds = Array.from(new Set((links ?? []).map((l: any) => l.parent_id)));
  } else {
    const { data: all } = await supabase.from("parent_accounts").select("id").eq("is_active", true);
    parentIds = (all ?? []).map((p: any) => p.id);
  }

  if (!parentIds.length) return NextResponse.json({ ok: true, sent: 0, failed: 0 });

  const result = await notifyParentsDirect(parentIds, subject, message);
  return NextResponse.json({ ok: true, ...result });
}
