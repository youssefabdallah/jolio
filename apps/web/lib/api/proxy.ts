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

/** Upper bound for auth JSON bodies (login/register/OAuth exchange). */
export const MAX_AUTH_BODY_BYTES = 32 * 1024;

/** Upper bound for a single opaque token string. */
export const MAX_TOKEN_CHARS = 8 * 1024;

/**
 * Fast pre-parse guard: reject an obviously oversized body before
 * buffering it. Chunked requests carry no Content-Length, so callers
 * must also cap the parsed payload (see isPayloadTooLarge).
 */
export function isBodyTooLarge(req: NextRequest, maxBytes: number): boolean {
  const length = Number(req.headers.get("content-length") ?? "0");
  return Number.isFinite(length) && length > maxBytes;
}

/** Post-parse guard for chunked bodies: cap the reserialized size. */
export function isPayloadTooLarge(payload: unknown, maxBytes: number): boolean {
  try {
    const serialized = JSON.stringify(payload);
    return typeof serialized === "string" ? serialized.length > maxBytes : true;
  } catch {
    return true;
  }
}

export function bodyTooLargeResponse() {
  return NextResponse.json(
    { error: { code: "PAYLOAD_TOO_LARGE", message: copy.common.requestTooLarge } },
    { status: 413 }
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
