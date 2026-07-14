import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { getTaraftarSession } from "@/lib/taraftar-guard";

export async function GET(req: NextRequest) {
  const session = await getTaraftarSession(req);
  if (!session) return NextResponse.json({ error: "Oturum bulunamadı." }, { status: 401 });

  const supabase = createServiceClient();

  const [{ data: account }, { data: dues }] = await Promise.all([
    supabase
      .from("taraftar_accounts")
      .select(
        "id, full_name, email, phone, photo_url, notification_preferences, membership_no, membership_status, membership_start_date, membership_end_date, badge_tier"
      )
      .eq("id", session.taraftarId)
      .single(),
    supabase
      .from("taraftar_dues")
      .select("*")
      .eq("taraftar_id", session.taraftarId)
      .order("created_at", { ascending: false }),
  ]);

  if (!account) return NextResponse.json({ error: "Hesap bulunamadı." }, { status: 404 });

  return NextResponse.json({ account, dues: dues ?? [] });
}
