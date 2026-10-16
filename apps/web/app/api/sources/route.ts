import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  isBodyTooLarge,
  bodyTooLargeResponse,
  isPayloadTooLarge,
  isSameOrigin,
  forbiddenResponse,
  unreachableResponse,
  MAX_SOURCES_BODY_BYTES,
} from "@/lib/api/proxy";
import { readJsonBody, upstreamFetch } from "@/lib/api/server";
import { SESSION_COOKIE } from "@/lib/auth/config";
import { copy } from "@/copy";

/**
 * Session-scoped sources proxy. Lists the caller's registry and adds
 * entries; the token travels as a Bearer header and never reaches the
 * browser. Backend 409/422 bodies pass through untouched so the form
 * can map field details onto inputs.
 */
async function token(): Promise<string | null> {
  return (await cookies()).get(SESSION_COOKIE)?.value ?? null;
}

function unauthenticated() {
  return NextResponse.json(
    { error: { code: "UNAUTHENTICATED", message: "Not signed in." } },
    { status: 401 }
  );
}

export async function GET(req: NextRequest) {
  if (!isSameOrigin(req)) {
    return forbiddenResponse();
  }

  const session = await token();
  if (!session) {
    return unauthenticated();
  }

  let upstream: Response;
  try {
    upstream = await upstreamFetch(`/api/v1/sources${req.nextUrl.search}`, {
      headers: { Accept: "application/json", Authorization: `Bearer ${session}` },
    });
  } catch {
    return unreachableResponse();
  }

  if (upstream.status === 401 || upstream.status === 403) {
    return unauthenticated();
  }

  if (!upstream.ok) {
    // Invalid list params (page/per_page) answer 422 with field
    // details; anything else is treated as an outage.
    if (upstream.status === 422) {
      return NextResponse.json(await readJsonBody(upstream), { status: 422 });
    }
    return unreachableResponse();
  }

  return NextResponse.json(await readJsonBody(upstream));
}

export async function POST(req: NextRequest) {
  if (!isSameOrigin(req)) {
    return forbiddenResponse();
  }

  const session = await token();
  if (!session) {
    return unauthenticated();
  }

  if (isBodyTooLarge(req, MAX_SOURCES_BODY_BYTES)) {
    return bodyTooLargeResponse();
  }

  const payload: unknown = await req.json().catch(() => ({}));
  if (isPayloadTooLarge(payload, MAX_SOURCES_BODY_BYTES)) {
    return bodyTooLargeResponse();
  }

  let upstream: Response;
  try {
    upstream = await upstreamFetch("/api/v1/sources", {
      method: "POST",
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

  return NextResponse.json(body, { status: 201 });
}
