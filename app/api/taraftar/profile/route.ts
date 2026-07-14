import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { getTaraftarSession } from "@/lib/taraftar-guard";
import { friendlyError } from "@/lib/db-errors";
import { z } from "zod";

const schema = z.object({
  full_name: z.string().min(2).max(160).optional(),
  phone: z.string().max(20).optional().or(z.literal("")),
  photo_url: z.string().url().optional().or(z.literal("")),
  notification_preferences: z
    .object({ email: z.boolean(), push: z.boolean(), sms: z.boolean() })
    .partial()
    .optional(),
});

export async function PATCH(req: NextRequest) {
  const session = await getTaraftarSession(req);
  if (!session) return NextResponse.json({ error: "Oturum bulunamadı." }, { status: 401 });

  const parsed = schema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Geçersiz veri." }, { status: 400 });
  }

  const supabase = createServiceClient();
  const { error } = await supabase.from("taraftar_accounts").update(parsed.data).eq("id", session.taraftarId);
  if (error) return NextResponse.json({ error: friendlyError(error) }, { status: 500 });

  return NextResponse.json({ ok: true });
}
