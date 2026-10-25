import { getSessionCookie } from "better-auth/cookies";
import { type NextRequest, NextResponse } from "next/server";
import { appPrefixes, matchesPrefix, operatorPrefix } from "./lib/app-paths";

/**
 * Per-request Content-Security-Policy with nonce (concept chapter 16) and an optimistic
 * redirect to the login page for app routes. The real session check happens on the server.
 */
/**
 * "/admin" is deliberately not protected: without a session cookie it is answered by a route
 * that does not exist, so status, page and even the route tree in the payload are those of any
 * unknown address (E-041, E-048).
 */
const unknownRoute = "/__unbekannt";

export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const signedIn = Boolean(getSessionCookie(request, { cookiePrefix: "ep" }));
  const isProtected = appPrefixes.some((prefix) => matchesPrefix(pathname, prefix));
  if (isProtected && !signedIn) {
    const login = new URL("/login", request.url);
    login.searchParams.set("next", `${pathname}${search}`);
    return NextResponse.redirect(login);
  }
  const hidden = !signedIn && matchesPrefix(pathname, operatorPrefix);

  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
  const isDev = process.env.NODE_ENV === "development";
  const csp = [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${isDev ? " 'unsafe-eval'" : ""}`,
    // Inline styles stay allowed (style attributes cannot carry a nonce); scripts stay strict.
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' blob: data:",
    "font-src 'self'",
    "connect-src 'self'",
    "media-src 'self' blob:",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "frame-src 'self'",
    ...(request.nextUrl.protocol === "https:" ? ["upgrade-insecure-requests"] : []),
  ].join("; ");

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("x-pathname", pathname);
  requestHeaders.set("Content-Security-Policy", csp);
  const response = hidden
    ? NextResponse.rewrite(new URL(unknownRoute, request.url), {
        request: { headers: requestHeaders },
      })
    : NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set("Content-Security-Policy", csp);
  return response;
}

export const config = {
  matcher: [
    {
      source: "/((?!api|_next/static|_next/image|favicon.ico).*)",
      missing: [
        { type: "header", key: "next-router-prefetch" },
        { type: "header", key: "purpose", value: "prefetch" },
      ],
    },
    // Prefetches of the operator area too, so they are rewritten like every other request.
    "/admin/:path*",
  ],
};
