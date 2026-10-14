import type { NextRequest } from "next/server";

/**
 * Explicit route access policy (single source of truth).
 *
 * Actual app routes (verified by glob, Oct 2026): "/" (sign-in),
 * "/register", "/auth/callback" (OAuth landing), "/dashboard"
 * (protected), "/unavailable" (service notice, added here), and
 * "/api/auth/*" route handlers (excluded from the proxy matcher and
 * authorized individually). No forgot-password, verify-email, terms, or
 * privacy pages exist — nothing is invented below.
 *
 * - Auth pages render without a session; a proven session bounces to
 *   the dashboard.
 * - Public routes render for anyone WITHOUT spending a verification
 *   call (this also makes /unavailable loop-proof during outages).
 * - Every other matched path is protected: unknown routes fail closed
 *   rather than fail open.
 * - The proxy is a UX gate only. Backend authorization stays
 *   authoritative for all data and state-changing operations.
 */

export const LOGIN_PATH = "/";
export const REGISTER_PATH = "/register";
export const OAUTH_CALLBACK_PATH = "/auth/callback";
export const DASHBOARD_PATH = "/dashboard";
export const UNAVAILABLE_PATH = "/unavailable";

const AUTH_PAGES: ReadonlySet<string> = new Set([LOGIN_PATH, REGISTER_PATH, OAUTH_CALLBACK_PATH]);

const PUBLIC_PATHS: ReadonlySet<string> = new Set([UNAVAILABLE_PATH]);

/** Collapse "/register/" to "/register" (root stays "/"). Next usually
 *  normalizes this already; the guard keeps direct unit calls honest. */
export function normalizePath(pathname: string): string {
  if (pathname.length > 1) {
    const stripped = pathname.replace(/\/+$/, "");
    return stripped === "" ? "/" : stripped;
  }
  return pathname === "" ? "/" : pathname;
}

export function isAuthPage(pathname: string): boolean {
  return AUTH_PAGES.has(normalizePath(pathname));
}

export function isPublicRoute(pathname: string): boolean {
  return PUBLIC_PATHS.has(normalizePath(pathname));
}

/**
 * Validate a post-login destination. Accepts same-origin absolute paths
 * only ("/dashboard", "/dashboard?tab=x" is fine — only the path part
 * is used). Rejects absolute URLs, protocol-relative "//evil",
 * backslashes, control characters, and encoded "//" smuggling. Anything
 * rejected falls back to the dashboard, so an open redirect is
 * impossible even if an attacker crafts ?next=.
 */
export function isSafeNextPath(value: unknown): value is string {
  if (typeof value !== "string" || value === "") {
    return false;
  }
  if (!value.startsWith("/") || value.startsWith("//")) {
    return false;
  }
  if (value.includes("\\") || /[\s\x00-\x1f\x7f]/.test(value)) {
    return false;
  }
  let decoded = value;
  try {
    decoded = decodeURIComponent(value);
  } catch {
    return false;
  }
  if (!decoded.startsWith("/") || decoded.startsWith("//") || decoded.includes("\\")) {
    return false;
  }
  return true;
}

/** Login URL, optionally carrying a validated ?next= for post-login return. */
export function loginUrl(req: NextRequest, next: string | null): URL {
  const url = req.nextUrl.clone();
  url.pathname = LOGIN_PATH;
  url.hash = "";
  if (next !== null && isSafeNextPath(next)) {
    url.search = `?next=${encodeURIComponent(next)}`;
  } else {
    url.search = "";
  }
  return url;
}

export function dashboardUrl(req: NextRequest): URL {
  const url = req.nextUrl.clone();
  url.pathname = DASHBOARD_PATH;
  url.search = "";
  url.hash = "";
  return url;
}
