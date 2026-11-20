import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import { configuredPreviewOrigin } from "@/lib/preview-origin";
import { requestOrigin } from "@/lib/request-origin";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (requestOrigin(request) === configuredPreviewOrigin()) {
    return pathname === "/api/proxy"
      ? NextResponse.next()
      : new NextResponse("Not found", { status: 404 });
  }
  // API handlers authenticate and authorize at the point of use.
  if (pathname.startsWith("/api/")) return NextResponse.next();

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
    "/((?!_next/|favicon.ico|sitemap.xml|robots.txt).*)",
  ],
};
