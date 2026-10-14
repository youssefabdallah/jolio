import { NextRequest, NextResponse } from "next/server";
import { isSameOrigin, forbiddenResponse, unreachableResponse, setTokenCookie } from "@/lib/api/proxy";
import { readJsonBody, upstreamFetch } from "@/lib/api/server";
import { parseSessionUser } from "@/lib/auth/user";
import { copy } from "@/copy";

/**
 * Same-origin registration proxy. The browser never sees the backend
 * token: it is stored in an httpOnly cookie, and only the validated
 * user object is returned to the client.
 */
export async function POST(req: NextRequest) {
  if (!isSameOrigin(req)) {
    return forbiddenResponse();
  }

  const payload: unknown = await req.json().catch(() => ({}));

  let upstream: Response;
  try {
    upstream = await upstreamFetch("/api/v1/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(payload),
    });
  } catch {
    return unreachableResponse();
  }

  const body = await readJsonBody(upstream);

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

  return NextResponse.json({ data: { user } }, { status: 201 });
}
