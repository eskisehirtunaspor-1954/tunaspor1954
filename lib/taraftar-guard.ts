import { NextRequest } from "next/server";
import { verifyTaraftarSessionToken, type TaraftarSessionPayload } from "@/lib/session";

const TARAFTAR_COOKIE_NAME = "tunaspor_taraftar_session";

export async function getTaraftarSession(req: NextRequest): Promise<TaraftarSessionPayload | null> {
  const token = req.cookies.get(TARAFTAR_COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyTaraftarSessionToken(token);
}

export { TARAFTAR_COOKIE_NAME };
