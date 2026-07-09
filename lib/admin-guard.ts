import { NextRequest } from "next/server";
import { verifySessionToken, canAccess, AdminSessionPayload } from "@/lib/auth";

const COOKIE_NAME = process.env.ADMIN_SESSION_COOKIE_NAME || "tunaspor_admin_session";

export function getAdminSession(req: NextRequest): AdminSessionPayload | null {
  const token = req.cookies.get(COOKIE_NAME)?.value;
  if (!token) return null;
  const session = verifySessionToken(token);
  if (!session?.totpVerified) return null;
  return session;
}

export function requireModuleAccess(
  req: NextRequest,
  moduleName: string
): { session: AdminSessionPayload } | { error: string; status: number } {
  const session = getAdminSession(req);
  if (!session) return { error: "Oturum bulunamadı, lütfen giriş yapın.", status: 401 };
  if (!canAccess(session.role, moduleName)) {
    return { error: "Bu modüle erişim yetkiniz yok.", status: 403 };
  }
  return { session };
}
