import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  // Transparently route foreign subresources (e.g. /assets/chunk.js, /cdn-cgi/...) from proxy iframe
  const isCyathRoute =
    pathname === "/" ||
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/login") ||
    pathname.startsWith("/pro") ||
    pathname.startsWith("/settings") ||
    pathname.startsWith("/terms") ||
    pathname.startsWith("/privacy") ||
    pathname.startsWith("/auth") ||
    pathname.startsWith("/r/") ||
    pathname.startsWith("/api/") ||
    pathname.startsWith("/fonts/") ||
    pathname === "/favicon.ico" ||
    pathname === "/favicon.svg" ||
    pathname === "/landing.html" ||
    pathname === "/sitemap.xml" ||
    pathname === "/robots.txt";

  if (!isCyathRoute) {
    const referer = request.headers.get("referer");
    if (referer) {
      try {
        const refUrl = new URL(referer);
        const proxyUrlParam = refUrl.searchParams.get("url");
        const reviewUrlParam = refUrl.searchParams.get("u");
        const targetStr = proxyUrlParam || reviewUrlParam;

        if (targetStr && (targetStr.startsWith("http://") || targetStr.startsWith("https://"))) {
          const targetOrigin = new URL(targetStr).origin;
          const fullTarget = `${targetOrigin}${pathname}${search}`;
          return NextResponse.rewrite(
            new URL(`/api/proxy?url=${encodeURIComponent(fullTarget)}`, request.url)
          );
        }
      } catch {}
    }
  }

  if (pathname === "/") {
    const cookies = request.cookies.getAll();
    const hasSupabaseSession = cookies.some(
      (c) => c.name.startsWith("sb-") && c.name.endsWith("-auth-token")
    );
    const hasAuthCookie = request.cookies.get("cyath_auth_active")?.value === "true";

    if (hasSupabaseSession || hasAuthCookie) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  return await updateSession(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|landing.html|sitemap.xml|robots.txt).*)",
  ],
};
