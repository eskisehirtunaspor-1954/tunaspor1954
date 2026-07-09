import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { verifyScoutPassword, signScoutSessionToken } from "@/lib/scout-auth";
import { SCOUT_COOKIE_NAME } from "@/lib/scout-guard";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  const { email, password } = await req.json().catch(() => ({}));
  if (!email || !password) {
    return NextResponse.json({ error: "E-posta ve şifre gerekli." }, { status: 400 });
  }

  const key = String(email).toLowerCase();
  if (
    !checkRateLimit("scout-login-email", key, { windowMs: 15 * 60 * 1000, max: 5 }) ||
    !checkRateLimit("scout-login-ip", getClientIp(req), { windowMs: 15 * 60 * 1000, max: 20 })
  ) {
    return NextResponse.json({ error: "Çok fazla hatalı deneme. Lütfen 15 dakika sonra tekrar deneyin." }, { status: 429 });
  }

  const supabase = createServiceClient();
  const { data: scout } = await supabase
    .from("scout_accounts")
    .select("id, email, password_hash, is_active, is_approved")
    .eq("email", key)
    .single();

  const passwordOk = scout && (await verifyScoutPassword(password, scout.password_hash));
  if (!passwordOk || !scout.is_active) {
    return NextResponse.json({ error: "E-posta veya şifre hatalı." }, { status: 401 });
  }
  if (!scout.is_approved) {
    return NextResponse.json({ error: "Başvurun henüz onaylanmadı. Kulüp seninle iletişime geçecek." }, { status: 403 });
  }

  await supabase.from("scout_accounts").update({ last_login_at: new Date().toISOString() }).eq("id", scout.id);

  const sessionToken = signScoutSessionToken({ scoutId: scout.id, email: scout.email, kind: "scout" });

  const res = NextResponse.json({ ok: true });
  res.cookies.set(SCOUT_COOKIE_NAME, sessionToken, {
    httpOnly: true,
    secure: true,
    sameSite: "strict",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
  return res;
}
