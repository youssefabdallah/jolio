import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { copy } from "@/copy";
import { SESSION_COOKIE } from "@/lib/auth/config";
import { sessionCookieAttributes } from "@/lib/auth/cookies";

/**
 * Shared server-only helpers for the same-origin API proxies.
 * Never import this module from client components.
 */

/**
 * CSRF guard for cookie-authenticated mutations: allow missing Origin
 * (curl, tests, non-browser clients) but refuse a mismatched one.
 */
export function isSameOrigin(req: NextRequest): boolean {
  const origin = req.headers.get("origin");
  if (!origin) {
    return true;
  }
  try {
    return new URL(origin).host === (req.headers.get("host") ?? "");
  } catch {
    return false;
  }
}

export function forbiddenResponse() {
  return NextResponse.json(
    { error: { code: "FORBIDDEN", message: copy.common.forbidden } },
    { status: 403 }
  );
}

export function unreachableResponse() {
  return NextResponse.json(
    { error: { code: "UPSTREAM_UNREACHABLE", message: copy.common.failedConnection } },
    { status: 502 }
  );
}

/**
 * Store the backend token where JS can never read it. Attributes come
 * from the single cookie policy in lib/auth/cookies so login, register,
 * OAuth exchange, and the proxy's deletion all scope identically.
 */
export async function setTokenCookie(req: NextRequest, token: string): Promise<void> {
  const store = await cookies();
  store.set(SESSION_COOKIE, token, sessionCookieAttributes(req));
}

/**
 * Expire the session cookie with mirrored attributes (see
 * clearSessionCookie for why the attributes must match).
 */
export async function deleteTokenCookie(req: NextRequest): Promise<void> {
  const store = await cookies();
  store.set(SESSION_COOKIE, "", {
    ...sessionCookieAttributes(req),
    maxAge: 0,
    expires: new Date(0),
  });
}
