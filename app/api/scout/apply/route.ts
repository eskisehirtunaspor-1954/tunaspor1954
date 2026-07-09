import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { hashScoutPassword } from "@/lib/scout-auth";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { z } from "zod";

const schema = z.object({
  club_name: z.string().min(2).max(160),
  contact_name: z.string().min(2).max(120),
  email: z.string().email(),
  password: z.string().min(10, "Şifre en az 10 karakter olmalı."),
  phone: z.string().max(30).optional(),
});

// Herkes başvurabilir ama is_approved=false ile açılır — admin onaylamadan giriş yapılamaz.
export async function POST(req: NextRequest) {
  if (!checkRateLimit("scout-apply", getClientIp(req), { windowMs: 60_000, max: 3 })) {
    return NextResponse.json({ error: "Çok fazla istek. Lütfen biraz sonra tekrar deneyin." }, { status: 429 });
  }

  const parsed = schema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Geçersiz veri." }, { status: 400 });
  }

  const { password, ...rest } = parsed.data;
  const password_hash = await hashScoutPassword(password);

  const supabase = createServiceClient();
  const { error } = await supabase.from("scout_accounts").insert({ ...rest, password_hash, is_approved: false });

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json({ error: "Bu e-posta ile zaten bir başvuru var." }, { status: 409 });
    }
    return NextResponse.json({ error: "Başvuru gönderilemedi." }, { status: 500 });
  }

  return NextResponse.json({ ok: true }, { status: 201 });
}
