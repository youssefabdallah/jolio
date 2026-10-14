import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE } from "@/lib/auth/config";
import { clearSessionCookie } from "@/lib/auth/cookies";
import { decideAuth } from "@/lib/auth/decision";
import { verifySession } from "@/lib/auth/session";
import { UNAVAILABLE_PATH, dashboardUrl, isPublicRoute, loginUrl, normalizePath } from "@/lib/auth/routes";

/**
 * Auth gate (Next 16 `proxy` entry point; `middleware.ts` is deprecated).
 * Runs on Node.js runtime before routes render.
 *
 * - Public routes (/unavailable) pass through with NO backend call, so
 *   the outage page can never redirect-loop.
 * - Missing cookie: auth pages pass, protected pages go to sign-in with
 *   a validated ?next= for post-login return.
 * - Verified sessions bounce off auth pages to /dashboard.
 * - Explicitly invalid sessions (401/403) are cleared, then treated as
 *   guests — the cleared cookie is what prevents redirect loops.
 * - Unverifiable sessions (timeout/5xx/429/network/malformed) NEVER
 *   clear the cookie and NEVER grant access: auth pages still render
 *   (their forms will surface the outage honestly), protected pages
 *   rewrite to /unavailable with the URL preserved.
 *
 * This is a UX gate only — backend authorization stays authoritative
 * for every protected resource and mutation.
 */
export const config = {
  // Intentional bypass list (statically analyzable literal, as required):
  // - api/        : route handlers authorize themselves (Origin check +
  //                 per-endpoint token logic). Boundary-anchored so that
  //                 /apiary and similar page paths stay gated.
  // - _next/static, _next/image: framework assets; gating them would
  //                 break CSS/JS/images for guests (incl. the sign-in
  //                 page itself). Note _next/data still invokes the proxy
  //                 by framework design — harmless, decisions stay gated.
  // - favicon.ico, icon.svg: implicitly requested public assets,
  //                 boundary-anchored so /favicon.ico.evil stays gated.
  matcher: ["/((?!api(?:$|/)|_next/static/|_next/image/|favicon\\.ico(?:$|/)|icon\\.svg(?:$|/)).*)"],
};

export async function proxy(req: NextRequest): Promise<NextResponse> {
  const pathname = normalizePath(req.nextUrl.pathname);
  const token = req.cookies.get(SESSION_COOKIE)?.value ?? null;

  // Public routes skip verification entirely: no latency, no backend
  // load, and no failure mode that could loop.
  const result = token !== null && token !== "" && !isPublicRoute(pathname) ? await verifySession(token) : null;

  const decision = decideAuth(pathname, token, result);

  switch (decision.kind) {
    case "pass": {
      const res = NextResponse.next();
      if (decision.clearCookie) {
        clearSessionCookie(req, res);
      }
      return res;
    }
    case "redirect-dashboard":
      return NextResponse.redirect(dashboardUrl(req));
    case "redirect-login": {
      const res = NextResponse.redirect(loginUrl(req, decision.next));
      if (decision.clearCookie) {
        clearSessionCookie(req, res);
      }
      return res;
    }
    case "rewrite-unavailable":
      return NextResponse.rewrite(new URL(UNAVAILABLE_PATH, req.url));
  }
}
