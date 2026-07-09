import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { verifyTotpToken } from "@/lib/auth";
import { signSessionToken } from "@/lib/session";
import { authenticator } from "otplib";
import crypto from "crypto";

const COOKIE_NAME = process.env.ADMIN_SESSION_COOKIE_NAME || "tunaspor_admin_session";

// GÜVENLİK YAMASI: login route'undaki ile aynı desende brute-force koruması.
// Öncesinde bu endpoint'te hiç deneme sınırı yoktu; şifresini bilen biri
// 6 haneli TOTP kodunu sınırsız deneyebilirdi.
const attempts = new Map<string, { count: number; blockedUntil: number }>();
const MAX_ATTEMPTS = 5;
const BLOCK_MS = 15 * 60 * 1000;

function hashBackupCode(code: string): string {
  return crypto.createHash("sha256").update(code).digest("hex");
}

export async function POST(req: NextRequest) {
  const { email, token } = await req.json().catch(() => ({}));
  if (!email || !token) {
    return NextResponse.json({ error: "Doğrulama kodu gerekli." }, { status: 400 });
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
    .select("id, email, role, totp_secret, totp_backup_codes, is_active")
    .eq("email", String(email).toLowerCase())
    .single();

  if (!admin || !admin.is_active || !admin.totp_secret) {
    return NextResponse.json({ error: "Geçersiz oturum." }, { status: 401 });
  }

  let loginMethod: "totp" | "backup_code" = "totp";
  const validTotp = verifyTotpToken(token, admin.totp_secret);

  if (!validTotp) {
    // GEÇİCİ TEŞHİS LOGU — sorun çözülünce kaldırılabilir.
    console.log("--- TOTP TEŞHİS ---");
    console.log("Sunucu saati:", new Date().toISOString());
    console.log("Girilen kod:", token);
    console.log("Sunucunun şu an beklediği doğru kod:", authenticator.generate(admin.totp_secret));
    console.log("-------------------");

    // 6 haneli kod tutmadıysa, yedek kod olarak dene (telefon kaybolduğunda kullanılır)
    const backupCodes: string[] = admin.totp_backup_codes ?? [];
    const inputHash = hashBackupCode(String(token).toUpperCase().trim());
    const backupIndex = backupCodes.indexOf(inputHash);

    if (backupIndex === -1) {
      const next = { count: (record?.count ?? 0) + 1, blockedUntil: 0 };
      if (next.count >= MAX_ATTEMPTS) next.blockedUntil = Date.now() + BLOCK_MS;
      attempts.set(key, next);
      return NextResponse.json({ error: "Doğrulama kodu hatalı." }, { status: 401 });
    }

    // Yedek kod doğru — tek kullanımlık olduğu için listeden çıkar
    loginMethod = "backup_code";
    backupCodes.splice(backupIndex, 1);
    await supabase.from("admin_users").update({ totp_backup_codes: backupCodes }).eq("id", admin.id);
  }

  attempts.delete(key);

  await supabase
    .from("admin_users")
    .update({ last_login_at: new Date().toISOString() })
    .eq("id", admin.id);

  await supabase.from("admin_audit_log").insert({
    admin_id: admin.id,
    action: loginMethod === "backup_code" ? "login_backup_code" : "login",
    entity: "admin_users",
    entity_id: admin.id,
  });

  const sessionToken = await signSessionToken({
    sub: admin.id,
    email: admin.email,
    role: admin.role,
    totpVerified: true,
  });

  const res = NextResponse.json({ ok: true, method: loginMethod });
  res.cookies.set(COOKIE_NAME, sessionToken, {
    httpOnly: true,
    secure: true,
    sameSite: "strict",
    path: "/",
    maxAge: 60 * 60 * 8,
  });
  return res;
}
