import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { requireModuleAccess } from "@/lib/admin-guard";
import { friendlyError } from "@/lib/db-errors";

// Salt okunur — TUNA AI sohbet geçmişi, session_id bazlı gruplanmış olarak döner.
export async function GET(req: NextRequest) {
  const access = await requireModuleAccess(req, "ai_knowledge_base");
  if ("error" in access) return NextResponse.json({ error: access.error }, { status: access.status });

  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("ai_chat_logs")
    .select("*")
    .order("created_at", { ascending: true })
    .limit(1000);
  if (error) return NextResponse.json({ error: friendlyError(error) }, { status: 500 });

  const sessions = new Map<string, { session_id: string; started_at: string; messages: { role: string; message: string; created_at: string }[] }>();
  for (const row of data ?? []) {
    if (!sessions.has(row.session_id)) {
      sessions.set(row.session_id, { session_id: row.session_id, started_at: row.created_at, messages: [] });
    }
    sessions.get(row.session_id)!.messages.push({ role: row.role, message: row.message, created_at: row.created_at });
  }

  const result = Array.from(sessions.values()).sort((a, b) => (a.started_at < b.started_at ? 1 : -1));
  return NextResponse.json({ data: result });
}
