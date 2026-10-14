import { NextRequest, NextResponse } from "next/server";
import { isSameOrigin, forbiddenResponse, deleteTokenCookie } from "@/lib/api/proxy";
import { upstreamFetch } from "@/lib/api/server";
import { SESSION_COOKIE } from "@/lib/auth/config";
import { cookies } from "next/headers";

/**
 * Sign out: attempt a server-side revocation, then ALWAYS clear the
 * cookie. Logout is an explicit user intent to destroy the local
 * session, so a dead backend must not leave a live cookie behind; a
 * token the client forgot is harmless even if the revoke never landed.
 */
export async function POST(req: NextRequest) {
  if (!isSameOrigin(req)) {
    return forbiddenResponse();
  }

  const token = (await cookies()).get(SESSION_COOKIE)?.value;

  if (token) {
    try {
      await upstreamFetch("/api/v1/auth/logout", {
        method: "POST",
        headers: { Accept: "application/json", Authorization: `Bearer ${token}` },
      });
    } catch {
      // Revocation failed (timeout/unreachable/misconfigured) — the
      // cookie is still cleared below. Nothing sensitive is logged.
    }
  }

  await deleteTokenCookie(req);

  return new NextResponse(null, { status: 204 });
}
