import { NextRequest } from "next/server";
import { verifyCoachSessionToken, type CoachSessionPayload } from "@/lib/session";

const COACH_COOKIE_NAME = "tunaspor_coach_session";

export async function getCoachSession(req: NextRequest): Promise<CoachSessionPayload | null> {
  const token = req.cookies.get(COACH_COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyCoachSessionToken(token);
}

export { COACH_COOKIE_NAME };
