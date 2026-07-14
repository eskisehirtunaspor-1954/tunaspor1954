import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { verifyTaraftarPassword } from "@/lib/taraftar-auth";
import { signTaraftarSessionToken } from "@/lib/session";
import { TARAFTAR_COOKIE_NAME } from "@/lib/taraftar-guard";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

// Giriş e-posta VEYA telefon ile yapılabilir — hangisiyle kayıt olunduysa.
export async function POST(req: NextRequest) {
  const { identifier, password } = await req.json().catch(() => ({}));
  if (!identifier || !password) {
    return NextResponse.json({ error: "E-posta/telefon ve şifre gerekli." }, { status: 400 });
  }

  const key = String(identifier).toLowerCase().trim();
  if (
    !checkRateLimit("taraftar-login-id", key, { windowMs: 15 * 60 * 1000, max: 5 }) ||
    !checkRateLimit("taraftar-login-ip", getClientIp(req), { windowMs: 15 * 60 * 1000, max: 20 })
  ) {
    return NextResponse.json({ error: "Çok fazla hatalı deneme. Lütfen 15 dakika sonra tekrar deneyin." }, { status: 429 });
  }

  const supabase = createServiceClient();
  const { data: account } = await supabase
    .from("taraftar_accounts")
    .select("id, email, phone, password_hash, is_active")
    .or(`email.eq.${key},phone.eq.${key}`)
    .maybeSingle();

  const valid = account && account.is_active && (await verifyTaraftarPassword(password, account.password_hash));
  if (!valid) {
    return NextResponse.json({ error: "Bilgiler hatalı." }, { status: 401 });
  }

  await supabase.from("taraftar_accounts").update({ last_login_at: new Date().toISOString() }).eq("id", account.id);

  const sessionToken = await signTaraftarSessionToken({
    taraftarId: account.id,
    email: account.email ?? account.phone ?? "",
    kind: "taraftar",
  });

  const res = NextResponse.json({ ok: true });
  res.cookies.set(TARAFTAR_COOKIE_NAME, sessionToken, {
    httpOnly: true,
    secure: true,
    sameSite: "strict",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  return res;
}
