import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { z } from "zod";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

const schema = z.object({
  event_id: z.string().uuid(),
  full_name: z.string().min(2).max(120),
  birth_date: z.string().optional(),
  parent_name: z.string().max(120).optional(),
  phone: z.string().min(6).max(30),
  email: z.string().email().optional().or(z.literal("")),
  notes: z.string().max(1000).optional(),
});

export async function POST(req: NextRequest) {
  if (!checkRateLimit("event-registration", getClientIp(req), { windowMs: 60_000, max: 5 })) {
    return NextResponse.json({ error: "Çok fazla istek. Lütfen biraz sonra tekrar deneyin." }, { status: 429 });
  }

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Lütfen zorunlu alanları eksiksiz doldurun." }, { status: 400 });
  }

  const supabase = createServiceClient();

  const { data: event } = await supabase
    .from("events")
    .select("id, capacity, registration_open")
    .eq("id", parsed.data.event_id)
    .single();

  if (!event || !event.registration_open) {
    return NextResponse.json({ error: "Bu etkinlik için kayıt şu anda kapalı." }, { status: 400 });
  }

  let status: "pending" | "waitlisted" = "pending";
  if (event.capacity) {
    const { count } = await supabase
      .from("event_registrations")
      .select("id", { count: "exact", head: true })
      .eq("event_id", event.id)
      .in("status", ["pending", "approved"]);
    if ((count ?? 0) >= event.capacity) status = "waitlisted";
  }

  const { error } = await supabase.from("event_registrations").insert({ ...parsed.data, status });
  if (error) return NextResponse.json({ error: "Kayıt oluşturulamadı." }, { status: 500 });

  return NextResponse.json({
    ok: true,
    status,
    message:
      status === "waitlisted"
        ? "Etkinlik kontenjanı dolu, bekleme listesine alındınız."
        : "Başvurunuz alındı, onay sonrası bilgilendirileceksiniz.",
  });
}
