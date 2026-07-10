import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { requireModuleAccess } from "@/lib/admin-guard";

export async function GET(req: NextRequest) {
  const access = await requireModuleAccess(req, "performance");
  if ("error" in access) return NextResponse.json({ error: access.error }, { status: access.status });

  const supabase = createServiceClient();
  const since30d = new Date(Date.now() - 30 * 86_400_000).toISOString();
  const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);

  const [{ data: views30d }, { data: todayViews }, { count: allTimeTotal }] = await Promise.all([
    supabase.from("page_views").select("path, device_type, session_id, created_at").gte("created_at", since30d),
    supabase.from("page_views").select("session_id").gte("created_at", todayStart.toISOString()),
    supabase.from("page_views").select("id", { count: "exact", head: true }),
  ]);

  const rows = views30d ?? [];
  const totalViews = rows.length;
  const uniqueSessions = new Set(rows.map((r: any) => r.session_id)).size;

  const todayRows = todayViews ?? [];
  const todayViewCount = todayRows.length;
  const todayUniqueVisitors = new Set(todayRows.map((r: any) => r.session_id)).size;

  const byPath = rows.reduce((acc: Record<string, number>, r: any) => {
    acc[r.path] = (acc[r.path] ?? 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  const topPages = (Object.entries(byPath) as [string, number][])
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([path, count]) => ({ path, count }));

  const deviceSplit = rows.reduce((acc: Record<string, number>, r: any) => {
    const key = r.device_type ?? "unknown";
    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const { data: topNews } = await supabase
    .from("news")
    .select("title, view_count")
    .eq("is_published", true)
    .order("view_count", { ascending: false })
    .limit(5);

  return NextResponse.json({
    todayViews: todayViewCount,
    todayUniqueVisitors,
    allTimeTotal: allTimeTotal ?? 0,
    totalViews,
    uniqueSessions,
    topPages,
    deviceSplit,
    topNews: topNews ?? [],
  });
}
