import type { RegisteredUser } from "../api/auth";

/**
 * Runtime validation for the Laravel session user.
 *
 * TypeScript types vanish at runtime, so the JSON body of GET /api/user
 * (currently the raw Eloquent model, NOT UserResource) is parsed as
 * `unknown` and checked field by field. Only the five fields the UI
 * needs are returned — extra backend attributes (timestamps,
 * provider_id, …) are dropped so components cannot depend on or leak
 * them. Returns null for anything malformed; callers treat that as a
 * service failure (fail closed, keep the cookie) rather than proof the
 * session died.
 */

const EMAIL_SHAPE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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
  if (avatar_url !== null && typeof avatar_url !== "string") {
    return null;
  }

  return { id, display_name, email, provider, avatar_url };
}
