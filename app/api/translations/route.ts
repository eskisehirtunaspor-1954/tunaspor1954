import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  const supabase = createClient();
  const namespace = req.nextUrl.searchParams.get("namespace") ?? "common";

  const [{ data: languages }, { data: translations }] = await Promise.all([
    supabase.from("languages").select("code, name, is_default").eq("is_active", true),
    supabase.from("translations").select("key, lang_code, value").eq("namespace", namespace),
  ]);

  // { en: { nav_home: "Home" }, de: { nav_home: "Startseite" }, ... }
  const dictionary: Record<string, Record<string, string>> = {};
  for (const t of translations ?? []) {
    (dictionary[t.lang_code] ??= {})[t.key] = t.value;
  }

  return NextResponse.json({ languages: languages ?? [], dictionary });
}
