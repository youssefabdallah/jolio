import type { AuthResult } from "./result";
import { isAuthPage, isPublicRoute } from "./routes";

/**
 * Pure gate decision: given the request path, whether a session cookie
 * is present, and (when checked) the verification outcome, decide what
 * the proxy must do. No I/O, no Next.js imports — fully unit-testable.
 *
 * Truth table (rows: verification state, columns: page kind):
 *
 * - no cookie:            auth page -> pass | protected -> login (keep cookie n/a)
 * - authenticated:        auth page -> dashboard | protected -> pass
 * - unauthenticated:      auth page -> pass + clear | protected -> login + clear
 * - unavailable:          auth page -> pass (keep) | protected -> rewrite /unavailable (keep)
 * - public route (any):   pass without verification (no backend call)
 *
 * Invariants: unavailable never clears the cookie and never grants
 * access; unauthenticated always clears; redirects never carry attacker
 * destinations (see isSafeNextPath).
 */
export type AuthDecision =
  | { kind: "pass"; clearCookie: boolean }
  | { kind: "redirect-login"; clearCookie: boolean; next: string | null }
  | { kind: "redirect-dashboard" }
  | { kind: "rewrite-unavailable" };

export function decideAuth(
  pathname: string,
  token: string | null,
  result: AuthResult | null,
): AuthDecision {
  if (isPublicRoute(pathname)) {
    return { kind: "pass", clearCookie: false };
  }

  const authPage = isAuthPage(pathname);

  if (token === null || token === "") {
    if (authPage) {
      return { kind: "pass", clearCookie: false };
    }
    return { kind: "redirect-login", clearCookie: false, next: pathname };
  }

  // A present cookie that was never verified is a programming error at
  // the call site — fail closed rather than guessing.
  if (result === null) {
    return authPage
      ? { kind: "pass", clearCookie: false }
      : { kind: "rewrite-unavailable" };
  }

  switch (result.status) {
    case "authenticated":
      return authPage ? { kind: "redirect-dashboard" } : { kind: "pass", clearCookie: false };
    case "unauthenticated":
      return authPage
        ? { kind: "pass", clearCookie: true }
        : { kind: "redirect-login", clearCookie: true, next: pathname };
    case "unavailable":
      return authPage
        ? { kind: "pass", clearCookie: false }
        : { kind: "rewrite-unavailable" };
  }
}
