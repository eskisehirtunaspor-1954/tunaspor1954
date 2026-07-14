import { NextRequest, NextResponse } from "next/server";
import { requireModuleAccess } from "@/lib/admin-guard";
import { getChannelAvailability } from "@/lib/notifications";

export async function GET(req: NextRequest) {
  const access = await requireModuleAccess(req, "parent_notifications");
  if ("error" in access) return NextResponse.json({ error: access.error }, { status: access.status });
  return NextResponse.json(getChannelAvailability());
}
