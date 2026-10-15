import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  isBodyTooLarge,
  bodyTooLargeResponse,
  isPayloadTooLarge,
  isSameOrigin,
  forbiddenResponse,
  unreachableResponse,
  MAX_PROFILE_BODY_BYTES,
} from "@/lib/api/proxy";
import { readJsonBody, upstreamFetch } from "@/lib/api/server";
import { SESSION_COOKIE } from "@/lib/auth/config";
import { copy } from "@/copy";

/**
 * Session-scoped profile proxy. Reads and replaces the caller's
 * candidate profile; the token travels as a Bearer header and never
 * reaches the browser. A missing profile answers null data (blank
 * form), never 404.
 */
async function token(): Promise<string | null> {
  return (await cookies()).get(SESSION_COOKIE)?.value ?? null;
}

export async function GET(req: NextRequest) {
  if (!isSameOrigin(req)) {
    return forbiddenResponse();
  }

  const session = await token();
  if (!session) {
    return NextResponse.json(
      { error: { code: "UNAUTHENTICATED", message: "Not signed in." } },
      { status: 401 }
    );
  }

  let upstream: Response;
  try {
    upstream = await upstreamFetch("/api/profile", {
      headers: { Accept: "application/json", Authorization: `Bearer ${session}` },
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
    return unreachableResponse();
  }

  return NextResponse.json(await readJsonBody(upstream));
}

export async function PUT(req: NextRequest) {
  if (!isSameOrigin(req)) {
    return forbiddenResponse();
  }

  const session = await token();
  if (!session) {
    return NextResponse.json(
      { error: { code: "UNAUTHENTICATED", message: "Not signed in." } },
      { status: 401 }
    );
  }

  if (isBodyTooLarge(req, MAX_PROFILE_BODY_BYTES)) {
    return bodyTooLargeResponse();
  }

  const payload: unknown = await req.json().catch(() => ({}));
  if (isPayloadTooLarge(payload, MAX_PROFILE_BODY_BYTES)) {
    return bodyTooLargeResponse();
  }

  let upstream: Response;
  try {
    upstream = await upstreamFetch("/api/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json", Accept: "application/json", Authorization: `Bearer ${session}` },
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

  return NextResponse.json(body, { status: 200 });
}
