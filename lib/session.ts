import { SignJWT, jwtVerify, type JWTPayload } from "jose";

/**
 * MİMARİ NOT (Edge Runtime uyumluluğu):
 * Next.js middleware her zaman Edge Runtime'da çalışır ve Edge Runtime, Node.js'in
 * 'crypto' modülünü desteklemez. `jsonwebtoken`, `bcryptjs` (bazı durumlarda) ve
 * `otplib` gibi paketler Node 'crypto' API'sine dayanır — bu yüzden middleware.ts
 * içinden ASLA doğrudan veya dolaylı olarak import edilmemeli.
 *
 * Bu dosya JWT sign/verify işlemlerini `jose` ile yapar. `jose`, Web Crypto API
 * (globalThis.crypto) kullanır ve hem Node.js hem de Edge Runtime'da native olarak
 * çalışır. Şifre hashleme (bcryptjs) ve TOTP (otplib) işlemleri Node-only kaldığı
 * için lib/auth.ts, lib/parent-auth.ts, lib/scout-auth.ts içinde bırakıldı — bu
 * dosyalar middleware tarafından değil, yalnızca Node.js runtime'da çalışan
 * app/api/** route handler'ları tarafından import edilir.
 */

const encodedSecret = () => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET ortam değişkeni tanımlı değil.");
  }
  return new TextEncoder().encode(secret);
};

// ---- Admin (super_admin / editor="Yönetici") ----
// NOT: "coach" (antrenör) artık burada değil — kendi izole oturum sistemine
// taşındı (kind:"coach", bkz. aşağıdaki Antrenör bölümü). Süper Admin dahil hiçbir
// admin-session token'ı antrenör paneline erişemez; izolasyon buradan gelir.

export interface AdminSessionPayload extends JWTPayload {
  sub: string;
  email: string;
  role: "super_admin" | "editor";
  totpVerified: boolean;
}

const ADMIN_SESSION_TTL = "8h";

export async function signSessionToken(payload: AdminSessionPayload): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(ADMIN_SESSION_TTL)
    .sign(encodedSecret());
}

export async function verifySessionToken(token: string): Promise<AdminSessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, encodedSecret());
    return payload as AdminSessionPayload;
  } catch {
    return null;
  }
}

// ---- Veli (parent) ----

export interface ParentSessionPayload extends JWTPayload {
  parentId: string;
  email: string;
  kind: "parent";
}

const PARENT_SESSION_TTL = "14d";

export async function signParentSessionToken(payload: ParentSessionPayload): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(PARENT_SESSION_TTL)
    .sign(encodedSecret());
}

export async function verifyParentSessionToken(token: string): Promise<ParentSessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, encodedSecret());
    const decoded = payload as ParentSessionPayload;
    if (decoded.kind !== "parent") return null; // admin/scout token'ı asla kabul edilmez
    return decoded;
  } catch {
    return null;
  }
}

// ---- Scout ----

export interface ScoutSessionPayload extends JWTPayload {
  scoutId: string;
  email: string;
  kind: "scout";
}

const SCOUT_SESSION_TTL = "7d";

export async function signScoutSessionToken(payload: ScoutSessionPayload): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(SCOUT_SESSION_TTL)
    .sign(encodedSecret());
}

export async function verifyScoutSessionToken(token: string): Promise<ScoutSessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, encodedSecret());
    const decoded = payload as ScoutSessionPayload;
    if (decoded.kind !== "scout") return null;
    return decoded;
  } catch {
    return null;
  }
}

// ---- Antrenör (coach) ----
// Veli paneliyle birebir aynı izolasyon deseni: ayrı "kind" ayracı sayesinde
// admin/veli/scout token'ları bu panele asla kabul edilmez.

export interface CoachSessionPayload extends JWTPayload {
  coachId: string;
  email: string;
  kind: "coach";
}

const COACH_SESSION_TTL = "14d";

export async function signCoachSessionToken(payload: CoachSessionPayload): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(COACH_SESSION_TTL)
    .sign(encodedSecret());
}

export async function verifyCoachSessionToken(token: string): Promise<CoachSessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, encodedSecret());
    const decoded = payload as CoachSessionPayload;
    if (decoded.kind !== "coach") return null;
    return decoded;
  } catch {
    return null;
  }
}
