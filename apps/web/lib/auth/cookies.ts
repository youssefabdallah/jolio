import type { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE } from "./config";

/**
 * Single owner of the session cookie's attributes.
 *
 * Policy: HttpOnly (never readable from JS), SameSite=Lax (top-level
 * OAuth navigations still work, CSRF risk contained), Path=/, 30-day
 * lifetime matching the token model, Secure whenever the request
 * actually arrived over https (directly or via x-forwarded-proto, i.e.
 * TLS terminated at the deployment proxy). No Domain is ever set, so
 * the cookie stays host-only.
 *
 * Deliberately NOT using the `__Host-` prefix: it mandates Secure on
 * every response, which would break plain-HTTP local development. The
 * Secure-in-production behavior here gives the same protection where it
 * matters without breaking the dev loop.
 *
 * This module is edge-safe: it only touches the request/response cookie
 * APIs, never next/headers (which the proxy cannot use).
 */

const THIRTY_DAYS_SECONDS = 60 * 60 * 24 * 30;

interface SessionCookieAttributes {
  httpOnly: boolean;
  secure: boolean;
  sameSite: "lax";
  path: string;
  maxAge: number;
}

export function sessionCookieAttributes(req: NextRequest): SessionCookieAttributes {
  const forwardedProto = req.headers.get("x-forwarded-proto");
  // Secure follows the scheme the browser actually used. Behind a
  // TLS-terminating proxy that scheme arrives via x-forwarded-proto;
  // for direct https access the URL protocol covers it. Plain local
  // HTTP therefore keeps working while production (https) is protected.
  const secure = forwardedProto === "https" || req.nextUrl.protocol === "https:";
  return {
    httpOnly: true,
    secure,
    sameSite: "lax",
    path: "/",
    maxAge: THIRTY_DAYS_SECONDS,
  };
}

/**
 * Expire the session cookie, mirroring the attributes it was set with so
 * the deletion actually scopes to the same cookie (Path/SameSite/Secure
 * mismatches are the classic reason "logout" leaves a cookie behind).
 */
export function clearSessionCookie(req: NextRequest, res: NextResponse): void {
  res.cookies.set(SESSION_COOKIE, "", {
    ...sessionCookieAttributes(req),
    maxAge: 0,
    expires: new Date(0),
  });
}
