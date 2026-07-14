import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Forma tasarım stüdyosunda "sponsor logosu" seçimi için — yalnızca yayınlanmış
// sponsorların adı/logosu döner, herkese açık (anon) veri, hassas bir şey içermez.
export async function GET() {
  const supabase = createClient();
  const { data } = await supabase.from("sponsors").select("id, name, logo_url").eq("is_published", true);
  return NextResponse.json({ data: data ?? [] });
}
