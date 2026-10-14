import { NextRequest, NextResponse } from "next/server";
import { isSameOrigin, forbiddenResponse, unreachableResponse, setTokenCookie } from "@/lib/api/proxy";
import { readJsonBody, upstreamFetch } from "@/lib/api/server";
import { parseSessionUser } from "@/lib/auth/user";
import { copy } from "@/copy";

/**
 * Completes the OAuth handshake started in the browser: takes the token
 * from the callback URL fragment, proves it against the backend, and only
 * then stores it in an httpOnly cookie. An unverifiable token is never
 * cookie-ed — the proxy refuses to launder credentials. The user payload
 * is runtime-validated and minimized before it reaches the client.
 */
export async function POST(req: NextRequest) {
  if (!isSameOrigin(req)) {
    return forbiddenResponse();
  }

  const payload: { token?: unknown } = await req.json().catch(() => ({}));

  if (typeof payload.token !== "string" || payload.token === "") {
    return NextResponse.json(
      { error: { code: "INVALID_TOKEN", message: copy.auth.oauthInvalid } },
      { status: 400 }
    );
  }

  let verification: Response;
  try {
    verification = await upstreamFetch("/api/user", {
      headers: { Accept: "application/json", Authorization: `Bearer ${payload.token}` },
    });
  } catch {
    // Verification impossible: report the outage, do not cookie anything.
    return unreachableResponse();
  }

  if (verification.status === 401 || verification.status === 403) {
    return NextResponse.json(
      { error: { code: "INVALID_TOKEN", message: copy.auth.oauthInvalid } },
      { status: 401 }
    );
  }

  if (!verification.ok) {
    return unreachableResponse();
  }

  const user = parseSessionUser(await readJsonBody(verification));
  if (user === null) {
    return unreachableResponse();
  }

  await setTokenCookie(req, payload.token);

  return NextResponse.json({ data: { user } });
}
