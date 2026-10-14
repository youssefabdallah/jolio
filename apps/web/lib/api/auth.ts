import { ApiError, getJson, postJson, postVoid } from "./client";

const API_PUBLIC_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export interface RegisterInput {
  displayName: string;
  email: string;
  password: string;
  passwordConfirmation: string;
}

export interface RegisteredUser {
  id: string;
  display_name: string;
  email: string;
  provider: string;
  avatar_url: string | null;
}

/**
 * Register via the same-origin proxy (camelCase in, snake_case wire
 * mapping lives here, at the boundary). The token stays in an
 * httpOnly cookie — this resolves user-only data.
 */
export function register(input: RegisterInput): Promise<{ user: RegisteredUser }> {
  return postJson("/api/auth/register", {
    display_name: input.displayName,
    email: input.email,
    password: input.password,
    password_confirmation: input.passwordConfirmation,
  });
}

/**
 * Browser URL that starts the provider handshake (top-level navigation,
 * never fetch — OAuth requires it). Only providers the backend serves.
 */
export function googleRedirectUrl(): string {
  return `${API_PUBLIC_BASE}/api/v1/auth/google/redirect`;
}

/**
 * Complete the OAuth handshake with the token from the callback URL
 * fragment. The proxy verifies it before cookie-ing; the token itself
 * never lands in browser storage.
 */
export function exchangeOAuthToken(token: string): Promise<{ user: RegisteredUser }> {
  return postJson("/api/auth/oauth/exchange", { token });
}

/**
 * Sign in via the same-origin proxy. Resolves user-only data; the token
 * stays in an httpOnly cookie. A 200 here creates nothing server-side.
 */
export function login(input: { email: string; password: string }): Promise<{ user: RegisteredUser }> {
  return postJson("/api/auth/login", {
    email: input.email,
    password: input.password,
  });
}

/**
 * Current session user via the httpOnly cookie. Null when signed out —
 * never throws for the 401 case, so shells can branch on it directly.
 */
export async function me(): Promise<{ user: RegisteredUser } | null> {
  try {
    return await getJson("/api/auth/me");
  } catch (thrown) {
    if (thrown instanceof ApiError && thrown.status === 401) {
      return null;
    }
    throw thrown;
  }
}

/**
 * Revoke the session server-side and clear the cookie.
 */
export function logout(): Promise<void> {
  return postVoid("/api/auth/logout");
}
