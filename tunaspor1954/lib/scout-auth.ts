import bcrypt from "bcryptjs";
import type { ScoutSessionPayload } from "@/lib/session";

// GÜVENLİK: Scout oturumları da admin/veli JWT sistemlerinden tamamen ayrı —
// kendi "kind" ayırt edicisi ile. Scout hesapları self-servis başvuru ile açılır
// ama is_approved=false başlar; admin onaylamadan giriş YAPILAMAZ (bkz. login route).
// JWT sign/verify artık lib/session.ts'te (jose, Edge + Node uyumlu).
export type { ScoutSessionPayload };

export async function hashScoutPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 12);
}

export async function verifyScoutPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}
