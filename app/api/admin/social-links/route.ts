import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { requireModuleAccess } from "@/lib/admin-guard";
import { friendlyError } from "@/lib/db-errors";

// site_settings tablosu hem sistemsel ayarları (bakım modu, atmosfer/hava durumu modu)
// hem de sosyal medya linklerini barındırıyor. Bu route yalnızca social_links alanını
// okur/yazar, böylece "Yönetici" rolü sistem ayarlarına dokunmadan sosyal medyayı yönetebilir.
export async function GET(req: NextRequest) {
  const access = await requireModuleAccess(req, "social_links");
  if ("error" in access) return NextResponse.json({ error: access.error }, { status: access.status });

  const supabase = createServiceClient();
  const { data, error } = await supabase.from("site_settings").select("social_links").eq("id", 1).single();
  if (error) return NextResponse.json({ error: friendlyError(error) }, { status: 500 });
  return NextResponse.json({ data: data?.social_links ?? {} });
}

export async function PATCH(req: NextRequest) {
  const access = await requireModuleAccess(req, "social_links");
  if ("error" in access) return NextResponse.json({ error: access.error }, { status: access.status });

  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Geçersiz istek." }, { status: 400 });
  }

  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("site_settings")
    .update({ social_links: body })
    .eq("id", 1)
    .select("social_links")
    .single();
  if (error) return NextResponse.json({ error: friendlyError(error) }, { status: 500 });

  await supabase.from("admin_audit_log").insert({
    admin_id: access.session.sub, action: "update", entity: "site_settings.social_links",
  });

  return NextResponse.json({ data: data.social_links });
}
