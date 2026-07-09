import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { getCountryCode } from "@/lib/geo";

export async function POST(req: NextRequest) {
  if (!checkRateLimit("track", getClientIp(req), { windowMs: 60_000, max: 60 })) {
    return NextResponse.json({ error: "Çok fazla istek." }, { status: 429 });
  }

  const body = await req.json().catch(() => null);
  if (!body?.path) return NextResponse.json({ error: "path gerekli" }, { status: 400 });

  const countryCode = await getCountryCode(req);

  const supabase = createServiceClient();
  await supabase.from("page_views").insert({
    path: String(body.path).slice(0, 300),
    session_id: body.session_id ?? null,
    device_type: body.device_type ?? null,
    referrer: req.headers.get("referer"),
    country_code: countryCode,
  });

  return NextResponse.json({ ok: true });
}
