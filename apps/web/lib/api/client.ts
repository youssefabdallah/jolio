import { copy } from "@/copy";

export interface ApiErrorBody {
  code: string;
  message: string;
  details?: Record<string, string[]>;
}

/**
 * Typed fetch failure: network (status 0) or a structured backend error.
 */
export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly body: ApiErrorBody
  ) {
    super(body.message);
    this.name = "ApiError";
  }
}

/**
 * Bound for browser → same-origin proxy calls. Without it a hung
 * upstream leaves forms in a permanent submitting state.
 */
const CLIENT_TIMEOUT_MS = 10_000;

/**
 * One automatic retry after a short pause. Stack restarts (deploys,
 * `make restart`) drop in-flight calls for a few seconds; retrying
 * once lets idempotent reads and upserts ride out the blip instead
 * of failing the user. Mutations that must never run twice
 * (register, login) opt out by passing 0.
 */
const RETRY_DELAY_MS = 800;

async function sleep(ms: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

function clientSignal(): AbortSignal {
  // AbortSignal.timeout is widely available in modern browsers and Node 18+.
  // Fall back to a manual AbortController where it is missing.
  if (typeof AbortSignal.timeout === "function") {
    return AbortSignal.timeout(CLIENT_TIMEOUT_MS);
  }
  const controller = new AbortController();
  setTimeout(() => controller.abort(), CLIENT_TIMEOUT_MS);
  return controller.signal;
}

/**
 * POST or PUT JSON to a same-origin proxy route, resolving `data` or
 * throwing a typed ApiError. All user-facing text comes from copy.ts
 * or the backend envelope — never invented here.
 */
export async function postJson<T>(
  path: string,
  payload: unknown,
  method: "POST" | "PUT" = "POST",
  retries = 0
): Promise<T> {
  let response: Response;
  try {
    response = await fetch(path, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: clientSignal(),
    });
  } catch {
    if (retries > 0) {
      await sleep(RETRY_DELAY_MS);
      return postJson<T>(path, payload, method, retries - 1);
    }
    throw new ApiError(0, { code: "UPSTREAM_UNREACHABLE", message: copy.common.failedConnection });
  }

  const body = await response.json().catch(() => null);

  if (!response.ok) {
    // A 502 from our own proxy means the backend was unreachable at
    // that instant (restart, boot window) — worth one retry.
    if (response.status === 502 && retries > 0) {
      await sleep(RETRY_DELAY_MS);
      return postJson<T>(path, payload, method, retries - 1);
    }
    const error: ApiErrorBody =
      body?.error ?? { code: "UNKNOWN", message: copy.common.unexpectedError };
    throw new ApiError(response.status, error);
  }

  return body.data as T;
}

/**
 * GET JSON from a same-origin proxy route, resolving `data` or throwing
 * a typed ApiError. Reads retry once: they are idempotent.
 */
export async function getJson<T>(path: string, retries = 1): Promise<T> {
  let response: Response;
  try {
    response = await fetch(path, { headers: { Accept: "application/json" }, signal: clientSignal() });
  } catch {
    if (retries > 0) {
      await sleep(RETRY_DELAY_MS);
      return getJson<T>(path, retries - 1);
    }
    throw new ApiError(0, { code: "UPSTREAM_UNREACHABLE", message: copy.common.failedConnection });
  }

  const body = await response.json().catch(() => null);

  if (!response.ok) {
    if (response.status === 502 && retries > 0) {
      await sleep(RETRY_DELAY_MS);
      return getJson<T>(path, retries - 1);
    }
    const error: ApiErrorBody =
      body?.error ?? { code: "UNKNOWN", message: copy.common.unexpectedError };
    throw new ApiError(response.status, error);
  }

  return body.data as T;
}

/**
 * POST with an empty body, resolving void on 2xx or throwing ApiError.
 * Retries once: revoking twice is harmless and the cookie clears anyway.
 */
export async function postVoid(path: string, retries = 1): Promise<void> {
  let response: Response;
  try {
    response = await fetch(path, { method: "POST", signal: clientSignal() });
  } catch {
    if (retries > 0) {
      await sleep(RETRY_DELAY_MS);
      return postVoid(path, retries - 1);
    }
    throw new ApiError(0, { code: "UPSTREAM_UNREACHABLE", message: copy.common.failedConnection });
  }

  if (!response.ok) {
    if (response.status === 502 && retries > 0) {
      await sleep(RETRY_DELAY_MS);
      return postVoid(path, retries - 1);
    }
    const body = await response.json().catch(() => null);
    const error: ApiErrorBody =
      body?.error ?? { code: "UNKNOWN", message: copy.common.unexpectedError };
    throw new ApiError(response.status, error);
  }
}
