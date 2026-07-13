import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { verifyCoachPassword } from "@/lib/coach-auth";
import { signCoachSessionToken } from "@/lib/session";
import { COACH_COOKIE_NAME } from "@/lib/coach-guard";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  const { email, password } = await req.json().catch(() => ({}));
  if (!email || !password) {
    return NextResponse.json({ error: "E-posta ve şifre gerekli." }, { status: 400 });
  }

  const key = String(email).toLowerCase();
  if (
    !checkRateLimit("coach-login-email", key, { windowMs: 15 * 60 * 1000, max: 5 }) ||
    !checkRateLimit("coach-login-ip", getClientIp(req), { windowMs: 15 * 60 * 1000, max: 20 })
  ) {
    return NextResponse.json({ error: "Çok fazla hatalı deneme. Lütfen 15 dakika sonra tekrar deneyin." }, { status: 429 });
  }

  const supabase = createServiceClient();
  const { data: coach } = await supabase
    .from("coach_accounts")
    .select("id, email, password_hash, is_active")
    .eq("email", key)
    .single();

  const valid = coach && coach.is_active && (await verifyCoachPassword(password, coach.password_hash));
  if (!valid) {
    return NextResponse.json({ error: "E-posta veya şifre hatalı." }, { status: 401 });
  }

  await supabase.from("coach_accounts").update({ last_login_at: new Date().toISOString() }).eq("id", coach.id);

  const sessionToken = await signCoachSessionToken({ coachId: coach.id, email: coach.email, kind: "coach" });

  const res = NextResponse.json({ ok: true });
  res.cookies.set(COACH_COOKIE_NAME, sessionToken, {
    httpOnly: true,
    secure: true,
    sameSite: "strict",
    path: "/",
    maxAge: 60 * 60 * 24 * 14,
  });
  return res;
}
