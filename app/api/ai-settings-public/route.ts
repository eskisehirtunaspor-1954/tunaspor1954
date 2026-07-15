import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Golden Wolf sohbet balonunun ilk açılışta göstereceği karşılama mesajı ve
// asistan adı — yalnızca bu iki alan herkese açık, sistem talimatı/yasaklı
// konular gibi iç ayarlar burada asla döndürülmez.
export async function GET() {
  const supabase = createClient();
  const { data } = await supabase.from("ai_settings").select("assistant_name, welcome_message").eq("id", 1).maybeSingle();
  return NextResponse.json({
    assistant_name: data?.assistant_name || "Golden Wolf",
    welcome_message: data?.welcome_message || null,
  });
}
