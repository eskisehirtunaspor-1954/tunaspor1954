import { NextResponse } from "next/server";
import { TARAFTAR_COOKIE_NAME } from "@/lib/taraftar-guard";

export async function POST() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(TARAFTAR_COOKIE_NAME, "", { maxAge: 0, path: "/" });
  return res;
}
