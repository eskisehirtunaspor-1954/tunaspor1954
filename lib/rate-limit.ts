import { NextRequest } from "next/server";

// GÜVENLİK: Ortak IP bazlı rate limiter. app/api/chat/route.ts içindeki mevcut
// desenin aynısı — kod tekrarını önlemek için buraya taşındı ve public
// formlarda (contact, event-registration, supporter-wall, push/subscribe, track)
// kullanılıyor. Bu endpoint'lerde daha önce hiç limit yoktu; bot/script ile
// spam veya depolama şişirme (DB flooding) mümkündü.
//
// Not: In-memory Map olduğu için tek instance'ta çalışır. Birden fazla sunucu
// instance'ı arkasında (yatay ölçekleme) çalışılırsa Redis gibi paylaşımlı bir
// store'a geçilmesi gerekir — mevcut login rate limiter'ı da aynı sınırlamaya sahip.

interface RateLimitOptions {
  windowMs?: number;
  max?: number;
}

const stores = new Map<string, Map<string, { count: number; resetAt: number }>>();

function getStore(bucket: string) {
  if (!stores.has(bucket)) stores.set(bucket, new Map());
  return stores.get(bucket)!;
}

export function getClientIp(req: NextRequest): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0].trim() || "unknown";
}

/**
 * @param bucket - Endpoint'e özel isim (örn. "contact", "supporter-wall") — her
 *                 endpoint'in sayaçları birbirinden bağımsız tutulur.
 * @param ip - getClientIp(req) ile alınan istemci IP'si
 */
export function checkRateLimit(
  bucket: string,
  ip: string,
  { windowMs = 60_000, max = 5 }: RateLimitOptions = {}
): boolean {
  const store = getStore(bucket);
  const now = Date.now();
  const entry = store.get(ip);

  if (!entry || now > entry.resetAt) {
    store.set(ip, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (entry.count >= max) return false;
  entry.count += 1;
  return true;
}
