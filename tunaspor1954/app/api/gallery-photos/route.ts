import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  const albumId = req.nextUrl.searchParams.get("album_id");
  if (!albumId) return NextResponse.json({ error: "album_id gerekli" }, { status: 400 });

  const supabase = createClient();
  const { data, error } = await supabase
    .from("gallery_photos")
    .select("id, image_url, caption, sort_order")
    .eq("album_id", albumId)
    .order("sort_order");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data: data ?? [] });
}
