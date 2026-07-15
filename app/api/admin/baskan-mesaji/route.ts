import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { requireModuleAccess } from "@/lib/admin-guard";
import { friendlyError } from "@/lib/db-errors";

export async function GET(req: NextRequest) {
  const access = await requireModuleAccess(req, "baskan_mesaji");
  if ("error" in access) return NextResponse.json({ error: access.error }, { status: access.status });
  const supabase = createServiceClient();
  const { data, error } = await supabase.from("baskan_mesaji").select("*").eq("id", 1).single();
  if (error) return NextResponse.json({ error: friendlyError(error) }, { status: 500 });
  return NextResponse.json({ data });
}

export async function PATCH(req: NextRequest) {
  const access = await requireModuleAccess(req, "baskan_mesaji");
  if ("error" in access) return NextResponse.json({ error: access.error }, { status: access.status });
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Geçersiz istek." }, { status: 400 });
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("baskan_mesaji")
    .update({ ...body, updated_at: new Date().toISOString() })
    .eq("id", 1)
    .select()
    .single();
  if (error) return NextResponse.json({ error: friendlyError(error) }, { status: 500 });
  return NextResponse.json({ data });
}
