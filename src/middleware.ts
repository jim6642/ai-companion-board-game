import { NextRequest, NextResponse } from "next/server";
import { resolveLocalApiProxyOrigin } from "@/lib/middleware-proxy";

const LOCALE_COOKIE = "aicb.locale";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-aicb-pathname", pathname);
  const continueWithPathname = () => NextResponse.next({ request: { headers: requestHeaders } });

  // Opt-in bridge used when a fresh frontend build runs beside an older
  // API process that already owns the user's in-memory prototype credentials.
  // Must be explicitly enabled via LOCAL_API_PROXY_BASE_URL; never implied
  // by hostname/port, otherwise a single Next.js process serving on :3001
  // would silently rewrite /api/* to :3000 and ECONNREFUSED.
  const proxy = resolveLocalApiProxyOrigin(process.env.LOCAL_API_PROXY_BASE_URL);
  if (proxy.kind === "rewrite" && pathname.startsWith("/api/")) {
    const upstream = new URL(`${pathname}${request.nextUrl.search}`, proxy.origin);
    return NextResponse.rewrite(upstream);
  }

  // Skip static files, API routes, and paths that already have locale
  if (
    pathname.startsWith("/zh") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.includes(".")
  ) {
    return continueWithPathname();
  }

  // Check if user has a saved locale preference (cookie)
  const savedLocale = request.cookies.get(LOCALE_COOKIE)?.value;
  if (savedLocale === "zh") {
    const url = new URL(pathname === "/" ? "/zh" : `/zh${pathname}`, request.url);
    url.search = request.nextUrl.search;
    return NextResponse.redirect(url);
  }
  if (savedLocale === "en") {
    // User explicitly chose English, stay on current path
    return continueWithPathname();
  }

  // No saved preference: detect browser language from Accept-Language header
  const acceptLanguage = request.headers.get("accept-language") || "";
  const prefersChinese = acceptLanguage
    .split(",")
    .some((lang) => lang.trim().toLowerCase().startsWith("zh"));

  if (prefersChinese) {
    const url = new URL(pathname === "/" ? "/zh" : `/zh${pathname}`, request.url);
    url.search = request.nextUrl.search;
    return NextResponse.redirect(url);
  }

  return continueWithPathname();
}

export const config = {
  matcher: ["/((?!_next|.*\\..*).*)"],
};
