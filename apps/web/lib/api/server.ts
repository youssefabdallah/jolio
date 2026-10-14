import { getApiBaseUrl, getVerifyTimeoutMs } from "@/lib/auth/config";

/**
 * Server-only upstream fetch for the same-origin auth proxies.
 * Never import from client components.
 *
 * Guarantees: bounded timeout (no hanging route handlers), manual
 * redirect handling (the Authorization header is never forwarded to a
 * redirect target), and a base URL from trusted server configuration
 * only — endpoint paths stay fixed literals at each call site.
 */
export async function upstreamFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const base = getApiBaseUrl();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), getVerifyTimeoutMs());

  try {
    return await fetch(`${base}${path}`, {
      ...init,
      redirect: "manual",
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timer);
  }
}

export function isJsonResponse(res: Response): boolean {
  return (res.headers.get("content-type") ?? "").includes("application/json");
}

/** Parse a JSON body as unknown; undefined when the body is not JSON. */
export async function readJsonBody(res: Response): Promise<unknown> {
  if (!isJsonResponse(res)) {
    return undefined;
  }
  return res.json().catch(() => undefined);
}
