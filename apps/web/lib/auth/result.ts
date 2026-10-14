import type { RegisteredUser } from "../api/auth";

/**
 * Three-state outcome of proving a session against Laravel.
 *
 * - authenticated:   backend confirmed the session AND the user payload
 *                    passed runtime validation.
 * - unauthenticated: backend explicitly rejected the credentials
 *                    (HTTP 401/403 on GET /api/user: revoked, expired, or
 *                    otherwise invalid token).
 * - unavailable:     verification was impossible — timeout, network
 *                    failure, 429, 5xx, redirect, wrong content type, or a
 *                    malformed payload. The session MIGHT still be valid,
 *                    so callers must never delete the cookie nor grant
 *                    access on this state.
 *
 * A discriminated union (not `User | null`) forces every caller to handle
 * the failure mode explicitly.
 */
export type AuthResult =
  | { status: "authenticated"; user: RegisteredUser }
  | { status: "unauthenticated" }
  | { status: "unavailable" };
