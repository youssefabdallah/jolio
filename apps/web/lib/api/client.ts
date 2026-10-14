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
 * POST JSON to a same-origin proxy route, resolving `data` or throwing
 * a typed ApiError. All user-facing text comes from copy.ts or the
 * backend envelope — never invented here.
 */
export async function postJson<T>(path: string, payload: unknown): Promise<T> {
  let response: Response;
  try {
    response = await fetch(path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  } catch {
    throw new ApiError(0, { code: "UPSTREAM_UNREACHABLE", message: copy.common.failedConnection });
  }

  const body = await response.json().catch(() => null);

  if (!response.ok) {
    const error: ApiErrorBody =
      body?.error ?? { code: "UNKNOWN", message: copy.common.unexpectedError };
    throw new ApiError(response.status, error);
  }

  return body.data as T;
}

/**
 * GET JSON from a same-origin proxy route, resolving `data` or throwing
 * a typed ApiError.
 */
export async function getJson<T>(path: string): Promise<T> {
  let response: Response;
  try {
    response = await fetch(path, { headers: { Accept: "application/json" } });
  } catch {
    throw new ApiError(0, { code: "UPSTREAM_UNREACHABLE", message: copy.common.failedConnection });
  }

  const body = await response.json().catch(() => null);

  if (!response.ok) {
    const error: ApiErrorBody =
      body?.error ?? { code: "UNKNOWN", message: copy.common.unexpectedError };
    throw new ApiError(response.status, error);
  }

  return body.data as T;
}

/**
 * POST with an empty body, resolving void on 2xx or throwing ApiError.
 */
export async function postVoid(path: string): Promise<void> {
  let response: Response;
  try {
    response = await fetch(path, { method: "POST" });
  } catch {
    throw new ApiError(0, { code: "UPSTREAM_UNREACHABLE", message: copy.common.failedConnection });
  }

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    const error: ApiErrorBody =
      body?.error ?? { code: "UNKNOWN", message: copy.common.unexpectedError };
    throw new ApiError(response.status, error);
  }
}
