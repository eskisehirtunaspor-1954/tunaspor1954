import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { z } from "zod";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

const schema = z.object({
  full_name: z.string().min(2).max(120),
  email: z.string().email(),
  phone: z.string().max(30).optional(),
  subject: z.string().max(160).optional(),
  message: z.string().min(5).max(3000),
});

export async function POST(req: NextRequest) {
  if (!checkRateLimit("contact", getClientIp(req), { windowMs: 60_000, max: 5 })) {
    return NextResponse.json({ error: "Çok fazla istek. Lütfen biraz sonra tekrar deneyin." }, { status: 429 });
  }

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Lütfen tüm zorunlu alanları doğru doldurun." }, { status: 400 });
  }

  const supabase = createServiceClient();
  const { error } = await supabase.from("contact_messages").insert(parsed.data);
  if (error) return NextResponse.json({ error: "Mesaj gönderilemedi, lütfen tekrar deneyin." }, { status: 500 });

  return NextResponse.json({ ok: true });
}
