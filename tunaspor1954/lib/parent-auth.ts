import bcrypt from "bcryptjs";
import type { ParentSessionPayload } from "@/lib/session";

// GÜVENLİK: Veli oturumları admin JWT sisteminden TAMAMEN ayrı tutulur — farklı
// cookie adı, farklı payload şekli (role alanı yok, admin middleware'i bu cookie'yi
// tanımaz). Bu ayrım kasıtlı: bir veli hesabının admin paneline sızma ihtimalini
// mimari olarak imkansız kılar.
// JWT sign/verify artık lib/session.ts'te (jose, Edge + Node uyumlu).
export type { ParentSessionPayload };

export async function hashParentPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 12);
}

export async function verifyParentPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}
