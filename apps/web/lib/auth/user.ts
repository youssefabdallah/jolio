import type { RegisteredUser } from "../api/auth";

/**
 * Runtime validation for the Laravel session user (GET /api/user serves
 * the public UserResource schema: id, display name, email, provider,
 * avatar — never the raw model).
 *
 * TypeScript types vanish at runtime, so the JSON body is parsed as
 * `unknown` and checked field by field. Only the five fields the UI
 * needs are returned — extra backend attributes (timestamps,
 * provider_id, …) are dropped so components cannot depend on or leak
 * them. Returns null for anything malformed; callers treat that as a
 * service failure (fail closed, keep the cookie) rather than proof the
 * session died.
 */

const EMAIL_SHAPE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Provider avatars are remote images: http(s) only, bounded length. */
const MAX_AVATAR_URL_CHARS = 2048;

function isSafeAvatarUrl(value: unknown): value is string | null {
  if (value === null) {
    return true;
  }
  if (typeof value !== "string" || value === "" || value.length > MAX_AVATAR_URL_CHARS) {
    return false;
  }
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function nonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.length > 0;
}

export function parseSessionUser(input: unknown): RegisteredUser | null {
  if (!isRecord(input)) {
    return null;
  }

  const { id, display_name, email, provider, avatar_url } = input;

  if (!nonEmptyString(id)) {
    return null;
  }
  if (!nonEmptyString(display_name)) {
    return null;
  }
  if (!nonEmptyString(email) || !EMAIL_SHAPE.test(email)) {
    return null;
  }
  if (!nonEmptyString(provider)) {
    return null;
  }
  if (!isSafeAvatarUrl(avatar_url)) {
    return null;
  }

  return { id, display_name, email, provider, avatar_url };
}
