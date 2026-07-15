import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { requireModuleAccess } from "@/lib/admin-guard";
import { friendlyError } from "@/lib/db-errors";

export async function GET(req: NextRequest) {
  const access = await requireModuleAccess(req, "sound_assets");
  if ("error" in access) return NextResponse.json({ error: access.error }, { status: access.status });
  const supabase = createServiceClient();
  const { data, error } = await supabase.from("sound_assets").select("*").order("key");
  if (error) return NextResponse.json({ error: friendlyError(error) }, { status: 500 });
  return NextResponse.json({ data });
}

// key sabit bir kayıt kümesi olduğu için (13 ses türü) burada insert değil,
// yalnızca update yapılır — admin panelinden dosya yükleyip ayar değiştirmek
// için bu yeterlidir.
export async function PATCH(req: NextRequest) {
  const access = await requireModuleAccess(req, "sound_assets");
  if ("error" in access) return NextResponse.json({ error: access.error }, { status: access.status });

  const { key, ...updates } = await req.json().catch(() => ({}));
  if (!key) return NextResponse.json({ error: "key gerekli." }, { status: 400 });

  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("sound_assets")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("key", key)
    .select()
    .single();

  if (error) return NextResponse.json({ error: friendlyError(error) }, { status: 500 });

  await supabase.from("admin_audit_log").insert({
    admin_id: access.session.sub,
    action: "update",
    entity: "sound_assets",
    entity_id: key,
    metadata: updates,
  });

  return NextResponse.json({ data });
}
