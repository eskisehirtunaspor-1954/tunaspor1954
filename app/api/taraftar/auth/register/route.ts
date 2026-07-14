import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { hashTaraftarPassword, generateMembershipNo } from "@/lib/taraftar-auth";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { z } from "zod";

const schema = z
  .object({
    full_name: z.string().min(2).max(160),
    email: z.string().email().optional().or(z.literal("")),
    phone: z.string().min(10).max(20).optional().or(z.literal("")),
    password: z.string().min(8, "Şifre en az 8 karakter olmalı."),
  })
  .refine((v) => v.email || v.phone, { message: "E-posta veya telefon numarasından en az biri gerekli." });

// Taraftar hesabı herkese açık — veli/scout'un aksine onay beklemeden hemen
// aktif olur (aidat/bağış takibi ve dijital üyelik kartı dışında hassas bir
// yetki vermiyor, bu yüzden anında kayıt mantıklı).
export async function POST(req: NextRequest) {
  if (!checkRateLimit("taraftar-register", getClientIp(req), { windowMs: 60_000, max: 5 })) {
    return NextResponse.json({ error: "Çok fazla istek. Lütfen biraz sonra tekrar deneyin." }, { status: 429 });
  }

  const parsed = schema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Geçersiz veri." }, { status: 400 });
  }
  const { full_name, password } = parsed.data;
  const email = parsed.data.email || null;
  const phone = parsed.data.phone || null;

  const password_hash = await hashTaraftarPassword(password);
  const supabase = createServiceClient();
  const startDate = new Date();
  const endDate = new Date(startDate);
  endDate.setFullYear(endDate.getFullYear() + 1);

  // Üyelik numarası çakışması ihtimaline karşı birkaç kez dene.
  for (let attempt = 0; attempt < 5; attempt++) {
    const membership_no = generateMembershipNo();
    const { data, error } = await supabase
      .from("taraftar_accounts")
      .insert({
        full_name,
        email,
        phone,
        password_hash,
        membership_no,
        membership_start_date: startDate.toISOString().slice(0, 10),
        membership_end_date: endDate.toISOString().slice(0, 10),
      })
      .select("id, membership_no")
      .single();

    if (!error) return NextResponse.json({ ok: true, data }, { status: 201 });

    if (error.code === "23505") {
      // email/phone çakışması mı yoksa membership_no çakışması mı ayır
      if (error.message?.includes("membership_no")) continue;
      return NextResponse.json({ error: "Bu e-posta veya telefon numarasıyla zaten bir hesap var." }, { status: 409 });
    }
    return NextResponse.json({ error: "Kayıt oluşturulamadı." }, { status: 500 });
  }

  return NextResponse.json({ error: "Kayıt oluşturulamadı, lütfen tekrar deneyin." }, { status: 500 });
}
