import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin-guard";

// OpenStreetMap Nominatim — API anahtarı gerektirmez, ama kullanım politikası
// gereği isteklerde tanımlayıcı bir User-Agent zorunludur (aksi halde 403/429
// riski artar). Yalnızca admin oturumu olan kullanıcılar çağırabilir.
export async function POST(req: NextRequest) {
  const session = await getAdminSession(req);
  if (!session) {
    return NextResponse.json({ error: "Oturum bulunamadı, lütfen giriş yapın." }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const address = typeof body?.address === "string" ? body.address.trim() : "";
  if (!address) {
    return NextResponse.json({ error: "Adres boş olamaz." }, { status: 400 });
  }

  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(address)}`;
    const res = await fetch(url, {
      headers: { "User-Agent": "Tunaspor1954WebSite/1.0 (iletisim@tunaspor1954.org)" },
    });
    if (!res.ok) throw new Error("Nominatim isteği başarısız");

    const results = await res.json();
    const first = Array.isArray(results) ? results[0] : null;
    if (!first) {
      return NextResponse.json({ error: "Adres bulunamadı. Lütfen daha ayrıntılı bir adres giriniz." }, { status: 404 });
    }

    return NextResponse.json({
      lat: parseFloat(first.lat),
      lng: parseFloat(first.lon),
      display_name: first.display_name as string,
    });
  } catch {
    return NextResponse.json({ error: "Konum servisi şu anda yanıt vermiyor. Lütfen daha sonra tekrar deneyin." }, { status: 502 });
  }
}
