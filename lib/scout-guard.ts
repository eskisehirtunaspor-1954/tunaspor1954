import { NextRequest } from "next/server";
import { verifyScoutSessionToken, ScoutSessionPayload } from "@/lib/scout-auth";

const SCOUT_COOKIE_NAME = "tunaspor_scout_session";

export function getScoutSession(req: NextRequest): ScoutSessionPayload | null {
  const token = req.cookies.get(SCOUT_COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyScoutSessionToken(token);
}

export { SCOUT_COOKIE_NAME };
