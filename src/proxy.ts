import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, verifySession } from "@/lib/server/session-token";

const AUTH_PAGES = ["/login", "/register"];
// Marketing pages anyone can open, signed in or not.
const OPEN_PAGES = ["/pricing", "/privacy", "/terms"];

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (OPEN_PAGES.includes(pathname)) return NextResponse.next();

  const signedIn = !!(await verifySession(req.cookies.get(SESSION_COOKIE)?.value));

  if (!signedIn) {
    // Signed-out visitors to "/" see the landing page while the URL stays "/".
    if (pathname === "/") return NextResponse.rewrite(new URL("/welcome", req.url));
    if (AUTH_PAGES.includes(pathname)) return NextResponse.next();
    if (pathname === "/welcome") return NextResponse.redirect(new URL("/", req.url));
    const url = new URL("/login", req.url);
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }
  if (AUTH_PAGES.includes(pathname) || pathname === "/welcome") return NextResponse.redirect(new URL("/", req.url));
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|manifest.webmanifest|.*\\.(?:png|jpg|jpeg|svg|webp|ico)$).*)"],
};
