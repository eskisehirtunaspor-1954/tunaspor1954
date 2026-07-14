import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { requireModuleAccess } from "@/lib/admin-guard";
import { friendlyError } from "@/lib/db-errors";

// Salt okunur gönderim geçmişi — kayıtlar yalnızca sistem tarafından
// (lib/notifications.ts) oluşturulur, admin panelinden düzenlenemez/silinemez.
export async function GET(req: NextRequest) {
  const access = await requireModuleAccess(req, "parent_notifications");
  if ("error" in access) return NextResponse.json({ error: access.error }, { status: access.status });

  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("parent_notifications")
    .select("id, type, channel, subject, body, status, error, created_at, parent_id, player_id, parent_accounts(full_name), players(full_name)")
    .order("created_at", { ascending: false })
    .limit(200);
  if (error) return NextResponse.json({ error: friendlyError(error) }, { status: 500 });
  return NextResponse.json({ data });
}
