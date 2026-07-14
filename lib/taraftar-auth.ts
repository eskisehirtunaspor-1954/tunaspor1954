import bcrypt from "bcryptjs";
import type { TaraftarSessionPayload } from "@/lib/session";

// GÜVENLİK: Taraftar oturumları diğer tüm oturum sistemlerinden (admin/veli/scout/
// antrenör) tamamen ayrı tutulur — farklı cookie adı, farklı payload şekli ("kind"
// ayracı). JWT sign/verify lib/session.ts'te (jose, Edge + Node uyumlu).
export type { TaraftarSessionPayload };

export async function hashTaraftarPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 12);
}

export async function verifyTaraftarPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

// Benzersiz üyelik numarası üretir (ör. TS-482913) — çakışma ihtimaline karşı
// çağıran taraf insert sonrası unique constraint hatasını (23505) yakalayıp
// tekrar deneyebilir.
export function generateMembershipNo(): string {
  const random = Math.floor(100000 + Math.random() * 900000);
  return `TS-${random}`;
}
