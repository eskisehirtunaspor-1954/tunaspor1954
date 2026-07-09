import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

// GÜVENLİK: Scout oturumları da admin/veli JWT sistemlerinden tamamen ayrı —
// kendi "kind" ayırt edicisi ile. Scout hesapları self-servis başvuru ile açılır
// ama is_approved=false başlar; admin onaylamadan giriş YAPILAMAZ (bkz. login route).
const JWT_SECRET = process.env.JWT_SECRET!;
const SCOUT_SESSION_TTL_SECONDS = 60 * 60 * 24 * 7; // 7 gün

export interface ScoutSessionPayload {
  scoutId: string;
  email: string;
  kind: "scout";
}

export async function hashScoutPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 12);
}

export async function verifyScoutPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

export function signScoutSessionToken(payload: ScoutSessionPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: SCOUT_SESSION_TTL_SECONDS });
}

export function verifyScoutSessionToken(token: string): ScoutSessionPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as ScoutSessionPayload;
    if (decoded.kind !== "scout") return null;
    return decoded;
  } catch {
    return null;
  }
}
