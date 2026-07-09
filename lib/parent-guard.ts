import { NextRequest } from "next/server";
import { verifyParentSessionToken, ParentSessionPayload } from "@/lib/parent-auth";

const PARENT_COOKIE_NAME = "tunaspor_parent_session";

export function getParentSession(req: NextRequest): ParentSessionPayload | null {
  const token = req.cookies.get(PARENT_COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyParentSessionToken(token);
}

export { PARENT_COOKIE_NAME };
