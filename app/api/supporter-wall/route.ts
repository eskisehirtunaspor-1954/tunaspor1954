import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { z } from "zod";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

const schema = z.object({
  supporter_name: z.string().min(2).max(120),
  supporter_logo_url: z.string().url().optional().or(z.literal("")),
  message: z.string().min(3).max(500),
});

export async function POST(req: NextRequest) {
  if (!checkRateLimit("supporter-wall", getClientIp(req), { windowMs: 60_000, max: 5 })) {
    return NextResponse.json({ error: "Çok fazla istek. Lütfen biraz sonra tekrar deneyin." }, { status: 429 });
  }

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Lütfen adınızı ve mesajınızı girin." }, { status: 400 });
  }

  const supabase = createServiceClient();
  const { error } = await supabase.from("supporter_wall").insert({
    supporter_name: parsed.data.supporter_name,
    supporter_logo_url: parsed.data.supporter_logo_url || null,
    message: parsed.data.message,
    is_approved: false,
  });
  if (error) return NextResponse.json({ error: "Gönderilemedi, lütfen tekrar deneyin." }, { status: 500 });

  return NextResponse.json({
    ok: true,
    message: "Mesajınız alındı! Yönetici onayından sonra duvarda yayınlanacak.",
  });
}
