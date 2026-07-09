import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

// GÜVENLİK: Veli oturumları admin JWT sisteminden TAMAMEN ayrı tutulur — farklı
// cookie adı, farklı payload şekli (role alanı yok, admin middleware'i bu cookie'yi
// tanımaz). Bu ayrım kasıtlı: bir veli hesabının admin paneline sızma ihtimalini
// mimari olarak imkansız kılar.
const JWT_SECRET = process.env.JWT_SECRET!;
const PARENT_SESSION_TTL_SECONDS = 60 * 60 * 24 * 14; // 14 gün — veliler daha az sık giriş yapar

export interface ParentSessionPayload {
  parentId: string;
  email: string;
  kind: "parent"; // admin session'larıyla asla karışmasın diye ayırt edici alan
}

export async function hashParentPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 12);
}

export async function verifyParentPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

export function signParentSessionToken(payload: ParentSessionPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: PARENT_SESSION_TTL_SECONDS });
}

export function verifyParentSessionToken(token: string): ParentSessionPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as ParentSessionPayload;
    if (decoded.kind !== "parent") return null; // admin token'ı buraya asla kabul edilmez
    return decoded;
  } catch {
    return null;
  }
}
