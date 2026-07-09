import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifySessionToken, verifyParentSessionToken, verifyScoutSessionToken } from "@/lib/session";

const COOKIE_NAME = process.env.ADMIN_SESSION_COOKIE_NAME || "tunaspor_admin_session";
const PARENT_COOKIE_NAME = "tunaspor_parent_session";
const SCOUT_COOKIE_NAME = "tunaspor_scout_session";

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

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/veli/:path*", "/scout/:path*"],
};
