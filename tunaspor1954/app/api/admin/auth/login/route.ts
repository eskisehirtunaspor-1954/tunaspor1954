import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { verifyPassword } from "@/lib/auth";

// Basit bellek-içi brute-force koruması (prod'da Redis ile değiştirilmeli)
const attempts = new Map<string, { count: number; blockedUntil: number }>();
const MAX_ATTEMPTS = 5;
const BLOCK_MS = 15 * 60 * 1000;

export async function POST(req: NextRequest) {
  const { email, password } = await req.json().catch(() => ({}));
  if (!email || !password) {
    return NextResponse.json({ error: "E-posta ve şifre gerekli." }, { status: 400 });
  }

  const key = String(email).toLowerCase();
  const record = attempts.get(key);
  if (record && record.blockedUntil > Date.now()) {
    return NextResponse.json(
      { error: "Çok fazla hatalı deneme. Lütfen 15 dakika sonra tekrar deneyin." },
      { status: 429 }
    );
  }

  const supabase = createServiceClient();
  const { data: admin } = await supabase
    .from("admin_users")
    .select("id, email, password_hash, is_active, totp_enabled")
    .eq("email", key)
    .single();

  const valid = admin && admin.is_active && (await verifyPassword(password, admin.password_hash));

  if (!valid) {
    const next = { count: (record?.count ?? 0) + 1, blockedUntil: 0 };
    if (next.count >= MAX_ATTEMPTS) next.blockedUntil = Date.now() + BLOCK_MS;
    attempts.set(key, next);
    return NextResponse.json({ error: "E-posta veya şifre hatalı." }, { status: 401 });
  }

  attempts.delete(key);

  if (!admin.totp_enabled) {
    return NextResponse.json(
      { error: "Bu hesapta iki adımlı doğrulama henüz aktifleştirilmemiş. Sistem yöneticinizle iletişime geçin." },
      { status: 403 }
    );
  }

  return NextResponse.json({ ok: true, step: "totp" });
}
