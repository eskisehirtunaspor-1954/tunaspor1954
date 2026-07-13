import { NextResponse } from "next/server";
import { COACH_COOKIE_NAME } from "@/lib/coach-guard";

export async function POST() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(COACH_COOKIE_NAME, "", { maxAge: 0, path: "/" });
  return res;
}
