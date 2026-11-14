import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
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
    "/((?!_next/static|_next/image|favicon.ico|vendor|landing.html|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
