import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

export const revalidate = 300; // 5 dakikada bir tazelensin, her istek için tüm tabloyu taramasın

export async function GET() {
  const supabase = createServiceClient();

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const [{ data: todayRows }, { data: allRows }] = await Promise.all([
    supabase.from("page_views").select("session_id").gte("created_at", startOfToday.toISOString()),
    supabase.from("page_views").select("session_id"),
  ]);

  const todayCount = new Set((todayRows ?? []).map((r) => r.session_id).filter(Boolean)).size;
  const totalCount = new Set((allRows ?? []).map((r) => r.session_id).filter(Boolean)).size;

  return NextResponse.json({ today: todayCount, total: totalCount });
}
