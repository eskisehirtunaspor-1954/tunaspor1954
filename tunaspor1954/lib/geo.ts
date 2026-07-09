import { NextRequest } from "next/server";

// GÜVENLİK/GİZLİLİK NOTU: Bu dosya tekil ziyaretçinin tam konumunu ASLA tutmaz —
// sadece ülke kodu (örn. "TR") döner, o da page_views.country_code'a yazılır.
// Bu, standart web analitiğinde (Google Analytics vb.) kullanılan seviyede,
// kişiyi tanımlamayan toplu (aggregate) bir veridir.

// Aynı IP için tekrar tekrar harici servise sormamak için kısa süreli önbellek
const countryCache = new Map<string, { code: string | null; expiresAt: number }>();
const CACHE_TTL_MS = 6 * 60 * 60 * 1000; // 6 saat

export async function getCountryCode(req: NextRequest): Promise<string | null> {
  // Öncelik 1: Cloudflare önünde çalışıyorsa (varsa) hazır header — ekstra istek yok
  const cf = req.headers.get("cf-ipcountry");
  if (cf && cf !== "XX") return cf.toUpperCase();

  // Öncelik 2: Vercel'de barındırılıyorsa hazır header
  const vercel = req.headers.get("x-vercel-ip-country");
  if (vercel) return vercel.toUpperCase();

  // Öncelik 3: Hiçbiri yoksa (self-hosted + CDN'siz), harici ücretsiz servise sor.
  // Bu servis yavaşlarsa/başarısız olursa sessizce vazgeç — ziyaretçi kaydı ülkesiz devam eder,
  // asla kullanıcı deneyimini yavaşlatacak şekilde bekletmiyoruz (1.5sn sert zaman aşımı).
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim();
  if (!ip || ip === "unknown" || ip.startsWith("127.") || ip.startsWith("192.168.") || ip.startsWith("10.")) {
    return null;
  }

  const cached = countryCache.get(ip);
  if (cached && cached.expiresAt > Date.now()) return cached.code;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 1500);
    const res = await fetch(`https://ipapi.co/${ip}/country/`, { signal: controller.signal });
    clearTimeout(timeout);
    if (!res.ok) throw new Error("geo lookup failed");
    const text = (await res.text()).trim().toUpperCase();
    const code = /^[A-Z]{2}$/.test(text) ? text : null;
    countryCache.set(ip, { code, expiresAt: Date.now() + CACHE_TTL_MS });
    return code;
  } catch {
    countryCache.set(ip, { code: null, expiresAt: Date.now() + CACHE_TTL_MS });
    return null;
  }
}
