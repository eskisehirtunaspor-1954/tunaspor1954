import bcrypt from "bcryptjs";
import type { CoachSessionPayload } from "@/lib/session";

// GÜVENLİK: Antrenör oturumları admin JWT sisteminden TAMAMEN ayrı tutulur — farklı
// cookie adı, farklı payload şekli (role alanı yok, admin middleware'i bu cookie'yi
// tanımaz). Veli paneliyle birebir aynı izolasyon deseni: Süper Admin dahil hiçbir
// admin hesabı bu cookie'yi üretemez/kullanamaz.
export type { CoachSessionPayload };

export async function hashCoachPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 12);
}

export async function verifyCoachPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}
