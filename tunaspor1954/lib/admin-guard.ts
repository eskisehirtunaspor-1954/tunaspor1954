import { NextRequest } from "next/server";
import { verifySessionToken, type AdminSessionPayload } from "@/lib/session";
import { canAccess } from "@/lib/auth";

const COOKIE_NAME = process.env.ADMIN_SESSION_COOKIE_NAME || "tunaspor_admin_session";

export async function getAdminSession(req: NextRequest): Promise<AdminSessionPayload | null> {
  const token = req.cookies.get(COOKIE_NAME)?.value;
  if (!token) return null;
  const session = await verifySessionToken(token);
  if (!session?.totpVerified) return null;
  return session;
}

export async function requireModuleAccess(
  req: NextRequest,
  moduleName: string
): Promise<{ session: AdminSessionPayload } | { error: string; status: number }> {
  const session = await getAdminSession(req);
  if (!session) return { error: "Oturum bulunamadı, lütfen giriş yapın.", status: 401 };
  if (!canAccess(session.role, moduleName)) {
    return { error: "Bu modüle erişim yetkiniz yok.", status: 403 };
  }
  return { session };
}
