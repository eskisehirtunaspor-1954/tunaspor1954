import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { requireModuleAccess } from "@/lib/admin-guard";
import { hashPassword, generateTotpSecret, totpKeyUri } from "@/lib/auth";
import { z } from "zod";
import QRCode from "qrcode";
import { friendlyError } from "@/lib/db-errors";

// GÜVENLİK YAMASI: Minimum şifre gücü zorunluluğu eklendi (önceden hiç kontrol yoktu).
const bodySchema = z.object({
  email: z.string().email(),
  password: z
    .string()
    .min(12, "Şifre en az 12 karakter olmalı.")
    .regex(/[A-Z]/, "Şifre en az bir büyük harf içermeli.")
    .regex(/[a-z]/, "Şifre en az bir küçük harf içermeli.")
    .regex(/[0-9]/, "Şifre en az bir rakam içermeli."),
  full_name: z.string().min(2).max(160),
  role: z.enum(["super_admin", "editor"]),
});

// Yalnızca super_admin yeni yönetici hesabı oluşturabilir.
export async function POST(req: NextRequest) {
  const access = await requireModuleAccess(req, "admin_users_create");
  if ("error" in access) return NextResponse.json({ error: access.error }, { status: access.status });
  if (access.session.role !== "super_admin") {
    return NextResponse.json({ error: "Yalnızca süper yönetici yeni hesap oluşturabilir." }, { status: 403 });
  }

  const parsed = bodySchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Geçersiz veri." }, { status: 400 });
  }
  const { email, password, full_name, role } = parsed.data;

  const supabase = createServiceClient();
  const password_hash = await hashPassword(password);
  const totp_secret = generateTotpSecret();

  // GÜVENLİK YAMASI: totp_enabled artık başlangıçta false. Yönetici QR'ı tarayıp
  // ilk kodu /api/admin/auth/confirm-totp üzerinden doğru girene kadar hesap
  // 2FA açısından "aktif" sayılmıyor ve giriş yapamıyor. Böylece kimse doğrulama
  // yapılmadan secret'in kendisine ait olduğunu iddia edemiyor, ve QR iletiminde
  // bir sorun olursa hesap sessizce yarım kurulu kalmıyor.
  const { data, error } = await supabase
    .from("admin_users")
    .insert({ email, password_hash, full_name, role, totp_secret, totp_enabled: false, is_active: true })
    .select()
    .single();

  if (error) return NextResponse.json({ error: friendlyError(error) }, { status: 500 });

  const uri = totpKeyUri(email, totp_secret);
  const qrCodeDataUrl = await QRCode.toDataURL(uri);

  await supabase.from("admin_audit_log").insert({
    admin_id: access.session.sub,
    action: "create",
    entity: "admin_users",
    entity_id: data.id,
  });

  return NextResponse.json({ data, qrCodeDataUrl });
}
