import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { requireModuleAccess } from "@/lib/admin-guard";

// contact_info ve site_settings tekil (id=1) kayıtlardır — liste yerine tek nesne döner/güncellenir.
export async function GET(req: NextRequest) {
  const access = await requireModuleAccess(req, "contact_info");
  if ("error" in access) return NextResponse.json({ error: access.error }, { status: access.status });
  const supabase = createServiceClient();
  const { data, error } = await supabase.from("contact_info").select("*").eq("id", 1).single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}

export async function PATCH(req: NextRequest) {
  const access = await requireModuleAccess(req, "contact_info");
  if ("error" in access) return NextResponse.json({ error: access.error }, { status: access.status });
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Geçersiz istek." }, { status: 400 });
  const supabase = createServiceClient();
  const { data, error } = await supabase.from("contact_info").update(body).eq("id", 1).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}
