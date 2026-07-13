import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Herkese açık, salt-okunur site ayarları — yalnızca güvenli/genel alanları döner.
// Admin paneli tam yönetim için /api/admin/site-settings kullanır.
export async function GET() {
  const supabase = createClient();
  const { data } = await supabase
    .from("site_settings")
    .select("site_name, founded_year, atmosphere_mode, weather_mode, achievements_count, social_links, lightning_intensity, intro_mode, ambient_sound_enabled")
    .eq("id", 1)
    .single();

  return NextResponse.json(data ?? {});
}
