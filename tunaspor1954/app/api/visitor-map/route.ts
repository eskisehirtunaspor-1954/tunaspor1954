import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

export const revalidate = 600; // 10 dakika — her istek için tüm tabloyu taramasın

export async function GET() {
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from("page_views")
    .select("country_code, session_id")
    .not("country_code", "is", null);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Ülke başına TEKİL ziyaretçi (session_id) sayısı — aynı kişinin sayfa
  // yenilemeleri tekrar tekrar sayılmasın.
  const bySessionPerCountry = new Map<string, Set<string>>();
  for (const row of data ?? []) {
    const code = row.country_code as string;
    if (!bySessionPerCountry.has(code)) bySessionPerCountry.set(code, new Set());
    if (row.session_id) bySessionPerCountry.get(code)!.add(row.session_id);
  }

  const countries = Array.from(bySessionPerCountry.entries())
    .map(([code, sessions]) => ({ code, count: sessions.size }))
    .filter((c) => c.count > 0)
    .sort((a, b) => b.count - a.count);

  return NextResponse.json({
    countries,
    totalCountries: countries.length,
    totalVisitors: countries.reduce((sum, c) => sum + c.count, 0),
  });
}
