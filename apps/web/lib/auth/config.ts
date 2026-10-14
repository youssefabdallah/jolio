/**
 * Centralized server-side configuration for authentication.
 *
 * Single place where environment-controlled auth settings are read and
 * validated. The backend base URL is trusted configuration only: it is
 * never built from request-controlled input (no Host header, no query
 * params), so credentials cannot be steered to an attacker destination.
 */

export const SESSION_COOKIE = "jolio_token";

/** Per-request budget for proving a session against Laravel. */
const DEFAULT_VERIFY_TIMEOUT_MS = 2500;
const MIN_VERIFY_TIMEOUT_MS = 500;
const MAX_VERIFY_TIMEOUT_MS = 10_000;

/**
 * Validated server-to-server API origin (e.g. "http://api:8000").
 *
 * Throws on misconfiguration so callers fail closed (service
 * unavailable) instead of fetching an attacker-influenced URL.
 * Only the origin is returned: endpoint paths are fixed literals at
 * each call site, never derived from user input.
 */
export function getApiBaseUrl(): string {
  const raw = (process.env.API_BASE_URL ?? "http://api:8000").trim();

  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new Error("API_BASE_URL is not a valid absolute URL.");
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error("API_BASE_URL must use http or https.");
  }
  if (url.username !== "" || url.password !== "") {
    throw new Error("API_BASE_URL must not embed credentials.");
  }

  // NOTE: plain http is legitimate here in local/dev Docker setups where
  // this is server-to-server traffic on an internal network
  // (web -> api service). Browser-facing TLS is a deployment concern and
  // is covered by the session cookie's Secure flag, not by this URL.
  return url.origin;
}

/**
 * Bounded timeout (ms) for backend session verification.
 * Overridable via AUTH_VERIFY_TIMEOUT_MS, clamped so a misconfigured env
 * can neither hang navigations nor make every check fail instantly.
 */
export function getVerifyTimeoutMs(): number {
  const parsed = Number.parseInt(process.env.AUTH_VERIFY_TIMEOUT_MS ?? "", 10);
  if (!Number.isFinite(parsed)) {
    return DEFAULT_VERIFY_TIMEOUT_MS;
  }
  return Math.min(MAX_VERIFY_TIMEOUT_MS, Math.max(MIN_VERIFY_TIMEOUT_MS, parsed));
}

export function isProduction(): boolean {
  return process.env.NODE_ENV === "production";
}
