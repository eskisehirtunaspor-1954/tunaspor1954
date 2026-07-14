import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { friendlyError } from "@/lib/db-errors";
import { z } from "zod";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

const layoutItem = z.object({ x: z.number(), y: z.number(), scale: z.number() });

const schema = z.object({
  designer_name: z.string().min(2).max(60),
  primary_color: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Geçerli bir renk kodu gerekli."),
  secondary_color: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Geçerli bir renk kodu gerekli."),
  pattern: z.enum(["duz", "cizgili", "capraz"]),
  player_name: z.string().max(20).optional().or(z.literal("")),
  player_number: z
    .string()
    .max(2)
    .regex(/^\d{0,2}$/, "Numara en fazla 2 haneli olmalı.")
    .optional()
    .or(z.literal("")),
  kit_type: z.enum(["ev_sahibi", "deplasman", "kaleci", "antrenman"]).optional(),
  collar_type: z.enum(["bisiklet", "polo", "v_yaka"]).optional(),
  sleeve_type: z.enum(["kisa", "uzun"]).optional(),
  shorts_color: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional().or(z.literal("")),
  socks_color: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional().or(z.literal("")),
  fabric: z.enum(["mat", "parlak", "klasik"]).optional(),
  sponsor_logo_url: z.string().url().optional().or(z.literal("")),
  design_layout: z.object({ logo: layoutItem, sponsor: layoutItem, name: layoutItem, number: layoutItem }).optional(),
});

// Herkes tasarım gönderebilir (onaydan sonra herkese görünür — supporter_wall ile aynı desen)
export async function POST(req: NextRequest) {
  if (!checkRateLimit("jersey-design-create", getClientIp(req), { windowMs: 60_000, max: 5 })) {
    return NextResponse.json({ error: "Çok fazla istek. Lütfen biraz sonra tekrar deneyin." }, { status: 429 });
  }

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Geçersiz veri." }, { status: 400 });
  }

  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("jersey_designs")
    .insert({ ...parsed.data, is_approved: false })
    .select()
    .single();

  if (error) return NextResponse.json({ error: friendlyError(error) }, { status: 500 });
  return NextResponse.json({ ok: true, data }, { status: 201 });
}

// Onaylanmış tasarımları oy sırasına göre listele (herkes görebilir)
export async function GET() {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("jersey_designs")
    .select("id, designer_name, primary_color, secondary_color, pattern, player_name, player_number, votes, created_at, kit_type")
    .eq("is_approved", true)
    .order("votes", { ascending: false })
    .limit(60);

  if (error) return NextResponse.json({ error: friendlyError(error) }, { status: 500 });
  return NextResponse.json({ data: data ?? [] });
}
