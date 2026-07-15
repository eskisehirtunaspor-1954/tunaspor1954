import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Hamburger menüsündeki "Kulübümüz" açılır panelinin ve /kulubumuz sayfasının
// istemci tarafından (client component) da okuyabileceği herkese açık uç nokta.
export async function GET() {
  const supabase = createClient();
  const { data } = await supabase
    .from("org_nodes")
    .select("*, staff_members(id, full_name, role, photo_url, uefa_license, specialization, start_date, bio, phone, email, social_media)")
    .order("display_order");
  return NextResponse.json({ data: data ?? [] });
}
