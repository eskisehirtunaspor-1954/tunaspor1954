import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { verifyParentPassword } from "@/lib/parent-auth";
import { signParentSessionToken } from "@/lib/session";
import { PARENT_COOKIE_NAME } from "@/lib/parent-guard";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  const { email, password } = await req.json().catch(() => ({}));
  if (!email || !password) {
    return NextResponse.json({ error: "E-posta ve şifre gerekli." }, { status: 400 });
  }

  const key = String(email).toLowerCase();
  // Aynı brute-force koruma deseni: 5 denemede 15 dk kilit, hem email hem IP bazlı
  if (
    !checkRateLimit("parent-login-email", key, { windowMs: 15 * 60 * 1000, max: 5 }) ||
    !checkRateLimit("parent-login-ip", getClientIp(req), { windowMs: 15 * 60 * 1000, max: 20 })
  ) {
    return NextResponse.json({ error: "Çok fazla hatalı deneme. Lütfen 15 dakika sonra tekrar deneyin." }, { status: 429 });
  }

  const supabase = createServiceClient();
  const { data: parent } = await supabase
    .from("parent_accounts")
    .select("id, email, password_hash, is_active")
    .eq("email", key)
    .single();

  const valid = parent && parent.is_active && (await verifyParentPassword(password, parent.password_hash));
  if (!valid) {
    return NextResponse.json({ error: "E-posta veya şifre hatalı." }, { status: 401 });
  }

  await supabase.from("parent_accounts").update({ last_login_at: new Date().toISOString() }).eq("id", parent.id);

  const sessionToken = await signParentSessionToken({ parentId: parent.id, email: parent.email, kind: "parent" });

  const res = NextResponse.json({ ok: true });
  res.cookies.set(PARENT_COOKIE_NAME, sessionToken, {
    httpOnly: true,
    secure: true,
    sameSite: "strict",
    path: "/",
    maxAge: 60 * 60 * 24 * 14,
  });
  return res;
}
