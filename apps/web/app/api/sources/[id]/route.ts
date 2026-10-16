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
 * Session-scoped single-source proxy (read/replace/remove one owned
 * registry entry). Backend 403/404/409/422 bodies pass through
 * untouched so the UI can map them onto the drawer and dialogs.
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

function upstreamId(req: NextRequest): string {
  return req.nextUrl.pathname.split("/").pop() ?? "";
}

export async function PUT(req: NextRequest) {
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
    upstream = await upstreamFetch(`/api/v1/sources/${upstreamId(req)}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Accept: "application/json", Authorization: `Bearer ${session}` },
      body: JSON.stringify(payload),
    });
  } catch {
    return unreachableResponse();
  }

  const body = await readJsonBody(upstream);

  if (!upstream.ok) {
    if (upstream.status === 401 || upstream.status === 403) {
      return unauthenticated();
    }
    return NextResponse.json(
      body ?? { error: { code: "UPSTREAM_INVALID", message: copy.common.unexpectedError } },
      { status: upstream.status }
    );
  }

  return NextResponse.json(body, { status: 200 });
}

export async function DELETE(req: NextRequest) {
  if (!isSameOrigin(req)) {
    return forbiddenResponse();
  }

  const session = await token();
  if (!session) {
    return unauthenticated();
  }

  let upstream: Response;
  try {
    upstream = await upstreamFetch(`/api/v1/sources/${upstreamId(req)}`, {
      method: "DELETE",
      headers: { Accept: "application/json", Authorization: `Bearer ${session}` },
    });
  } catch {
    return unreachableResponse();
  }

  if (!upstream.ok) {
    if (upstream.status === 401 || upstream.status === 403) {
      return unauthenticated();
    }
    const body = await readJsonBody(upstream);
    return NextResponse.json(
      body ?? { error: { code: "UPSTREAM_INVALID", message: copy.common.unexpectedError } },
      { status: upstream.status }
    );
  }

  return new NextResponse(null, { status: 204 });
}
