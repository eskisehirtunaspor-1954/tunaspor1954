import { NextRequest } from "next/server";
import { verifyParentSessionToken, type ParentSessionPayload } from "@/lib/session";

const PARENT_COOKIE_NAME = "tunaspor_parent_session";

export async function getParentSession(req: NextRequest): Promise<ParentSessionPayload | null> {
  const token = req.cookies.get(PARENT_COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyParentSessionToken(token);
}

export { PARENT_COOKIE_NAME };
