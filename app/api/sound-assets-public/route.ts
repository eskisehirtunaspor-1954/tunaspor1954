import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = createClient();
  const { data } = await supabase.from("sound_assets").select("key, file_url, volume, loop, is_active, autoplay");
  return NextResponse.json({ data: data ?? [] });
}
