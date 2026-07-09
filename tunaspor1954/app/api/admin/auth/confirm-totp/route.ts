import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { verifyPassword, verifyTotpToken } from "@/lib/auth";
import { checkRateLimit } from "@/lib/rate-limit";
import crypto from "crypto";

// GÜVENLİK: create-admin artık totp_enabled=false ile hesap açıyor. Bu endpoint,
// yeni yönetici (veya onu oluşturan süper admin) QR'ı tarayıp authenticator'dan gelen
// ilk kodu buraya girdiğinde çağrılır. Şifre + doğru TOTP kodu ikisi birden doğrulanmadan
// hesap 2FA açısından aktif olmaz — bu sayede secret'in gerçekten doğru kişiye ulaştığı
// kanıtlanmış olur. Onay anında tek kullanımlık 10 yedek kod üretilir (SADECE bu response'ta
// düz metin döner, DB'ye hash'lenmiş kaydedilir).

function hashBackupCode(code: string): string {
  return crypto.createHash("sha256").update(code).digest("hex");
}

function generateBackupCodes(count = 10) {
  const plainCodes: string[] = [];
  const hashedCodes: string[] = [];
  for (let i = 0; i < count; i++) {
    const code = crypto.randomBytes(5).toString("hex").toUpperCase(); // örn: A1B2C3D4E5
    plainCodes.push(code);
    hashedCodes.push(hashBackupCode(code));
  }
  return { plainCodes, hashedCodes };
}

export async function POST(req: NextRequest) {
  const { email, password, token } = await req.json().catch(() => ({}));
  if (!email || !password || !token) {
    return NextResponse.json({ error: "E-posta, şifre ve doğrulama kodu gerekli." }, { status: 400 });
  }

  const key = String(email).toLowerCase();
  if (!checkRateLimit("confirm-totp", key, { windowMs: 15 * 60 * 1000, max: 8 })) {
    return NextResponse.json(
      { error: "Çok fazla hatalı deneme. Lütfen 15 dakika sonra tekrar deneyin." },
      { status: 429 }
    );
  }

  const supabase = createServiceClient();
  const { data: admin } = await supabase
    .from("admin_users")
    .select("id, password_hash, totp_secret, totp_enabled, is_active")
    .eq("email", key)
    .single();

  if (!admin || !admin.is_active) {
    return NextResponse.json({ error: "Hesap bulunamadı." }, { status: 404 });
  }
  if (admin.totp_enabled) {
    return NextResponse.json({ error: "Bu hesapta 2FA zaten aktif." }, { status: 409 });
  }

  const validPassword = await verifyPassword(password, admin.password_hash);
  if (!validPassword) {
    return NextResponse.json({ error: "E-posta veya şifre hatalı." }, { status: 401 });
  }

  const validTotp = verifyTotpToken(token, admin.totp_secret);
  if (!validTotp) {
    return NextResponse.json({ error: "Doğrulama kodu hatalı, authenticator'ı kontrol edip tekrar dene." }, { status: 401 });
  }

  const { plainCodes, hashedCodes } = generateBackupCodes();

  const { error: updateError } = await supabase
    .from("admin_users")
    .update({ totp_enabled: true, totp_backup_codes: hashedCodes })
    .eq("id", admin.id);

  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 });

  await supabase.from("admin_audit_log").insert({
    admin_id: admin.id,
    action: "totp_confirm",
    entity: "admin_users",
    entity_id: admin.id,
  });

  return NextResponse.json({ ok: true, backupCodes: plainCodes });
}
