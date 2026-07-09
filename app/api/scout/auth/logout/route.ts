import { NextResponse } from "next/server";
import { SCOUT_COOKIE_NAME } from "@/lib/scout-guard";

export async function POST() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(SCOUT_COOKIE_NAME, "", { maxAge: 0, path: "/" });
  return res;
}
