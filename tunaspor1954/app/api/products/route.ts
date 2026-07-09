import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

export const revalidate = 60;

export async function GET() {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("products")
    .select("id, name, category, price, image_url, sizes, stock")
    .eq("is_published", true)
    .order("category");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data: data ?? [] });
}
