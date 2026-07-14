import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  verifySessionToken,
  verifyParentSessionToken,
  verifyScoutSessionToken,
  verifyCoachSessionToken,
  verifyTaraftarSessionToken,
} from "@/lib/session";

const COOKIE_NAME = process.env.ADMIN_SESSION_COOKIE_NAME || "tunaspor_admin_session";
const PARENT_COOKIE_NAME = "tunaspor_parent_session";
const SCOUT_COOKIE_NAME = "tunaspor_scout_session";
const COACH_COOKIE_NAME = "tunaspor_coach_session";
const TARAFTAR_COOKIE_NAME = "tunaspor_taraftar_session";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/admin/login")) {
    return NextResponse.next();
  }

  if (pathname.startsWith("/admin")) {
    const token = request.cookies.get(COOKIE_NAME)?.value;
    const session = token ? await verifySessionToken(token) : null;

    if (!session || !session.totpVerified) {
      const loginUrl = new URL("/admin/login", request.url);
      loginUrl.searchParams.set("redirectedFrom", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  if (pathname.startsWith("/veli/giris")) {
    return NextResponse.next();
  }

  if (pathname.startsWith("/veli")) {
    const token = request.cookies.get(PARENT_COOKIE_NAME)?.value;
    const session = token ? await verifyParentSessionToken(token) : null;

    if (!session) {
      const loginUrl = new URL("/veli/giris", request.url);
      loginUrl.searchParams.set("redirectedFrom", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  if (pathname.startsWith("/scout/giris") || pathname.startsWith("/scout/basvuru")) {
    return NextResponse.next();
  }

  if (pathname.startsWith("/scout")) {
    const token = request.cookies.get(SCOUT_COOKIE_NAME)?.value;
    const session = token ? await verifyScoutSessionToken(token) : null;

    if (!session) {
      const loginUrl = new URL("/scout/giris", request.url);
      loginUrl.searchParams.set("redirectedFrom", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  if (pathname.startsWith("/antrenor/giris")) {
    return NextResponse.next();
  }

  // İZOLASYON: Bu blok yalnızca tunaspor_coach_session cookie'sini kabul eder.
  // Admin (super_admin dahil), veli veya scout oturumu burada geçersizdir —
  // Antrenör Paneli'ne yalnızca kendi hesabıyla giriş yapan antrenörler erişebilir.
  if (pathname.startsWith("/antrenor")) {
    const token = request.cookies.get(COACH_COOKIE_NAME)?.value;
    const session = token ? await verifyCoachSessionToken(token) : null;

    if (!session) {
      const loginUrl = new URL("/antrenor/giris", request.url);
      loginUrl.searchParams.set("redirectedFrom", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  if (pathname.startsWith("/taraftar/giris") || pathname.startsWith("/taraftar/kayit")) {
    return NextResponse.next();
  }

  // İZOLASYON: Bu blok yalnızca tunaspor_taraftar_session cookie'sini kabul eder —
  // admin/veli/scout/antrenör oturumları burada geçersizdir.
  if (pathname.startsWith("/taraftar")) {
    const token = request.cookies.get(TARAFTAR_COOKIE_NAME)?.value;
    const session = token ? await verifyTaraftarSessionToken(token) : null;

    if (!session) {
      const loginUrl = new URL("/taraftar/giris", request.url);
      loginUrl.searchParams.set("redirectedFrom", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/veli/:path*", "/scout/:path*", "/antrenor/:path*", "/taraftar/:path*"],
};
