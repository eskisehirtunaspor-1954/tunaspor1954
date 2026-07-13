import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { requireModuleAccess } from "@/lib/admin-guard";

// Haberlere eklenen PDF/DOCX belgeleri — "news" modülünün bir parçası, ayrı bir
// izin adı yok (haber üzerinde düzenleme yetkisi olan zaten ekini de yönetebilir).
export async function GET(req: NextRequest) {
  const access = await requireModuleAccess(req, "news");
  if ("error" in access) return NextResponse.json({ error: access.error }, { status: access.status });

  const newsId = req.nextUrl.searchParams.get("news_id");
  if (!newsId) return NextResponse.json({ error: "news_id gerekli." }, { status: 400 });

  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("news_attachments")
    .select("*")
    .eq("news_id", newsId)
    .order("created_at", { ascending: true });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}

export async function POST(req: NextRequest) {
  const access = await requireModuleAccess(req, "news");
  if ("error" in access) return NextResponse.json({ error: access.error }, { status: access.status });

  const body = await req.json().catch(() => null);
  if (!body?.news_id || !body?.file_url || !body?.file_path || !body?.file_name) {
    return NextResponse.json({ error: "news_id, file_url, file_path ve file_name gerekli." }, { status: 400 });
  }

  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("news_attachments")
    .insert({
      news_id: body.news_id,
      file_url: body.file_url,
      file_path: body.file_path,
      file_name: body.file_name,
    })
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}

export async function DELETE(req: NextRequest) {
  const access = await requireModuleAccess(req, "news");
  if ("error" in access) return NextResponse.json({ error: access.error }, { status: access.status });

  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id gerekli." }, { status: 400 });

  const supabase = createServiceClient();
  const { data: existing } = await supabase.from("news_attachments").select("file_path").eq("id", id).single();
  if (existing?.file_path) {
    await supabase.storage.from("media").remove([existing.file_path]);
  }

  const { error } = await supabase.from("news_attachments").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
