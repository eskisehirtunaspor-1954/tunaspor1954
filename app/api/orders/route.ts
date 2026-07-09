import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { z } from "zod";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

const itemSchema = z.object({
  productId: z.string().uuid(),
  name: z.string(),
  size: z.string().optional(),
  quantity: z.number().int().min(1).max(20),
  unitPrice: z.number().min(0),
});

const schema = z.object({
  customer_name: z.string().min(2).max(120),
  phone: z.string().min(6).max(30),
  email: z.string().email().optional().or(z.literal("")),
  address: z.string().min(10).max(500),
  payment_method: z.enum(["havale", "kapida_odeme"]),
  items: z.array(itemSchema).min(1).max(30),
});

// NOT: Gerçek online ödeme entegrasyonu yok — sipariş kaydedilir, admin panelinden
// takip edilip ödeme (havale/kapıda ödeme) manuel olarak onaylanır.
export async function POST(req: NextRequest) {
  if (!checkRateLimit("orders-create", getClientIp(req), { windowMs: 60_000, max: 5 })) {
    return NextResponse.json({ error: "Çok fazla istek. Lütfen biraz sonra tekrar deneyin." }, { status: 429 });
  }

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Geçersiz veri." }, { status: 400 });
  }

  const { items, ...rest } = parsed.data;
  const total_amount = items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0);

  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("orders")
    .insert({ ...rest, items, total_amount, status: "beklemede" })
    .select()
    .single();

  if (error) return NextResponse.json({ error: "Sipariş oluşturulamadı." }, { status: 500 });
  return NextResponse.json({ ok: true, data }, { status: 201 });
}
