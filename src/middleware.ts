import { NextResponse, type NextRequest } from "next/server";

/**
 * Sets `x-pathname` so server layouts can branch on the current path
 * (e.g. skip Navbar/WhatsAppButton on `/preview/*`).
 */
export function middleware(request: NextRequest) {
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-pathname", request.nextUrl.pathname);
  // Layouts can't read searchParams, but the preview layout needs the signed
  // accountId to render the right agency's navbar/logo/colours. Forward the
  // raw query string; the layout verifies the token before trusting it.
  if (request.nextUrl.pathname.startsWith("/preview")) {
    requestHeaders.set("x-preview-qs", request.nextUrl.search);
  }
  return NextResponse.next({ request: { headers: requestHeaders } });
}

export const config = {
  matcher: [
    // Run on all paths except static assets / Next internals.
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)",
  ],
};
