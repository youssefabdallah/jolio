import { NextRequest, NextResponse } from "next/server";
import { isSameOrigin, forbiddenResponse, unreachableResponse, setTokenCookie } from "@/lib/api/proxy";
import { readJsonBody, upstreamFetch } from "@/lib/api/server";
import { parseSessionUser } from "@/lib/auth/user";
import { copy } from "@/copy";

/**
 * Same-origin sign-in proxy. Mirrors the register proxy: the backend
 * token lands in an httpOnly cookie, only the validated user object
 * reaches JS.
 */
export async function POST(req: NextRequest) {
  if (!isSameOrigin(req)) {
    return forbiddenResponse();
  }

  const payload: unknown = await req.json().catch(() => ({}));

  let upstream: Response;
  try {
    upstream = await upstreamFetch("/api/v1/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(payload),
    });
  } catch {
    return unreachableResponse();
  }

  const body = await readJsonBody(upstream);

  // Backend errors (401 invalid credentials, 422 validation, 429
  // rate-limit) pass through with their own status and envelope so the
  // UI can react appropriately; only a malformed success is ours to map.
  if (!upstream.ok) {
    return NextResponse.json(
      body ?? { error: { code: "UPSTREAM_INVALID", message: copy.common.unexpectedError } },
      { status: upstream.status }
    );
  }

  const record = body as { data?: { token?: unknown; user?: unknown } } | null;
  const token = record?.data?.token;
  const user = parseSessionUser(record?.data?.user);
  if (typeof token !== "string" || token === "" || user === null) {
    return NextResponse.json(
      { error: { code: "UPSTREAM_INVALID", message: copy.common.unexpectedError } },
      { status: 502 }
    );
  }

  await setTokenCookie(req, token);

  return NextResponse.json({ data: { user } }, { status: 200 });
}
