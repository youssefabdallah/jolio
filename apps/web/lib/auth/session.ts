import { getApiBaseUrl, getVerifyTimeoutMs, SESSION_COOKIE } from "./config";
import { parseSessionUser } from "./user";
import type { AuthResult } from "./result";

export { SESSION_COOKIE };

/**
 * Prove a session token against Laravel (GET /api/user).
 *
 * Status mapping follows the backend's actual contract:
 * - 200 + valid user JSON        -> authenticated
 * - 401 (revoked/expired/invalid token; Laravel's unauthenticated
 *   response for auth:sanctum) or 403 (explicit refusal) -> unauthenticated
 * - anything else (429 rate-limit, 5xx, network failure, timeout,
 *   redirect, non-JSON body, malformed payload) -> unavailable.
 *
 * Safeguards: bounded timeout (AbortController), redirect:"manual" so
 * the Authorization header is never forwarded to a redirect target,
 * content-type gate before parsing, runtime schema validation, and no
 * credential content in logs (only the status code is recorded).
 */
export async function verifySession(token: string): Promise<AuthResult> {
  if (token === "") {
    return { status: "unauthenticated" };
  }

  let base: string;
  try {
    base = getApiBaseUrl();
  } catch {
    console.error("[auth] session verification misconfigured");
    return { status: "unavailable" };
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), getVerifyTimeoutMs());

  let response: Response;
  try {
    response = await fetch(`${base}/api/user`, {
      headers: { Accept: "application/json", Authorization: `Bearer ${token}` },
      cache: "no-store",
      redirect: "manual",
      signal: controller.signal,
    });
  } catch {
    // Timeout, DNS, connection refused/reset — the session may still be
    // valid; report unavailable so the caller keeps the cookie.
    return { status: "unavailable" };
  } finally {
    clearTimeout(timer);
  }

  if (response.status === 401 || response.status === 403) {
    return { status: "unauthenticated" };
  }
  if (!response.ok) {
    // 429, 5xx, 3xx (redirect:manual surfaces them), and any other
    // unexpected status: never proof of an invalid session.
    return { status: "unavailable" };
  }

  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) {
    return { status: "unavailable" };
  }

  const body: unknown = await response.json().catch(() => undefined);
  if (body === undefined) {
    return { status: "unavailable" };
  }

  const user = parseSessionUser(body);
  if (user === null) {
    return { status: "unavailable" };
  }

  return { status: "authenticated", user };
}
