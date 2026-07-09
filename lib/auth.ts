import bcrypt from "bcryptjs";
import { authenticator } from "otplib";
import type { AdminSessionPayload } from "@/lib/session";

// Geriye dönük uyumluluk için tip burada da re-export edilir; gerçek tanım lib/session.ts'te.
export type { AdminSessionPayload };

// GÜVENLİK/KULLANILABİLİRLİK: otplib varsayılan olarak yalnızca ±1 zaman adımı (±30sn)
// tolerans tanır. Sunucu ile telefon arasında küçük saat sapması olursa (çok yaygın),
// doğru kod bile "hatalı" görünür. window:2 ile toleransı ±60sn'ye çıkarıyoruz —
// güvenliği ciddi zayıflatmadan (TOTP zaten tek kullanımlık ve süreli) kullanılabilirliği artırır.
authenticator.options = { window: 2 };

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 12);
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

// ---- TOTP (Google Authenticator uyumlu 2FA) ----
export function generateTotpSecret(): string {
  return authenticator.generateSecret();
}

export function totpKeyUri(email: string, secret: string): string {
  return authenticator.keyuri(email, "Tunaspor 1954 Yönetim", secret);
}

export function verifyTotpToken(token: string, secret: string): boolean {
  return authenticator.verify({ token, secret });
}

// Rol bazlı yetki kontrolü — modül erişim matrisi.
// Spesifikasyon: "Yönetici" rolü (editor/content_manager) haberler, duyurular, maçlar,
// takımlar, oyuncular, akademi, galeri, sponsorlar, ana sayfa/hero (çeviriler üzerinden),
// iletişim ve sosyal medyayı yönetebilir; ancak sistem ayarlarına (site_settings) ve
// yönetici hesaplarına dokunamaz — bunlar yalnızca super_admin'e özeldir.
const YONETICI_PERMISSIONS = [
  "news", "teams", "players", "staff", "fixtures", "standings", "league_table_rows",
  "gallery_albums", "gallery_photos", "videos", "sponsors",
  "events", "event_registrations", "calendar_items", "supporter_wall",
  "contact_messages", "contact_info", "social_links", "social_posts",
  "translations", "languages", "seo_settings", "performance", "ai_knowledge_base",
  "jersey_designs", "game_scores", "academy_announcements", "player_fees",
  "products", "orders", "scout_contact_requests",
];

const ROLE_PERMISSIONS: Record<AdminSessionPayload["role"], string[]> = {
  super_admin: ["*"],
  editor: YONETICI_PERMISSIONS,
  content_manager: YONETICI_PERMISSIONS,
  coach: ["training_sessions", "players", "calendar_items", "staff", "fixtures", "standings",
    "training_attendance", "player_development_reports"],
};

export function canAccess(role: AdminSessionPayload["role"], module: string): boolean {
  const perms = ROLE_PERMISSIONS[role];
  return perms.includes("*") || perms.includes(module);
}
