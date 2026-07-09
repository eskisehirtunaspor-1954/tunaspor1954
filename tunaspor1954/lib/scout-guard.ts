import { NextRequest } from "next/server";
import { verifyScoutSessionToken, type ScoutSessionPayload } from "@/lib/session";

const SCOUT_COOKIE_NAME = "tunaspor_scout_session";

export async function getScoutSession(req: NextRequest): Promise<ScoutSessionPayload | null> {
  const token = req.cookies.get(SCOUT_COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyScoutSessionToken(token);
}

export { SCOUT_COOKIE_NAME };
