import { NextRequest, NextResponse } from "next/server";
import { isSameOrigin, forbiddenResponse, unreachableResponse } from "@/lib/api/proxy";
import { readJsonBody, upstreamFetch } from "@/lib/api/server";
import { SESSION_COOKIE } from "@/lib/auth/config";
import { parseSessionUser } from "@/lib/auth/user";
import { copy } from "@/copy";
import { cookies } from "next/headers";

/**
 * Session lookup for server-rendered UI. Reads the httpOnly cookie and
 * forwards it as a Bearer token; the token itself is never exposed.
 *
 * Status mapping is explicit: only 401/403 mean "not signed in". A
 * rate-limited, broken, or unreachable backend is a 502/429 of its own
 * — coercing those into 401 would sign users out during outages and
 * hide the real problem from the UI.
 */
export async function GET(req: NextRequest) {
  if (!isSameOrigin(req)) {
    return forbiddenResponse();
  }

  const token = (await cookies()).get(SESSION_COOKIE)?.value;

  if (!token) {
    return NextResponse.json(
      { error: { code: "UNAUTHENTICATED", message: "Not signed in." } },
      { status: 401 }
    );
  }

  let upstream: Response;
  try {
    upstream = await upstreamFetch("/api/user", {
      headers: { Accept: "application/json", Authorization: `Bearer ${token}` },
    });
  } catch {
    return unreachableResponse();
  }

  if (upstream.status === 401 || upstream.status === 403) {
    return NextResponse.json(
      { error: { code: "UNAUTHENTICATED", message: "Not signed in." } },
      { status: 401 }
    );
  }

  if (!upstream.ok) {
    if (upstream.status === 429) {
      const body = await readJsonBody(upstream);
      return NextResponse.json(
        body ?? { error: { code: "UPSTREAM_INVALID", message: copy.common.failedConnection } },
        { status: 429 }
      );
    }
    return unreachableResponse();
  }

  const user = parseSessionUser(await readJsonBody(upstream));
  if (user === null) {
    return unreachableResponse();
  }

  return NextResponse.json({ data: { user } });
}
