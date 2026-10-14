# Identity — User

## Purpose

Owns the account identity for Jolio (SPECS §6 User, FR-1–FR-3): one human,
authenticating with a local email/password credential or via OAuth. Every
other bounded context will scope its data to this aggregate.

## Actors

- Account owner (single user in v1).
- Future registration/login handlers (not built yet — this slice is the
  aggregate + persistence only, no endpoints).

## Business rules & invariants (enforced in `Src\Identity\Domain\Entities\User`)

- Display name is never blank.
- `AuthProvider::Local` users always carry a non-blank password hash (FR-3).
- OAuth users always carry a non-blank `provider_id`, never a local password
  hash, and never use the `local` provider.
- Email is unique per user; `(provider, provider_id)` is unique per OAuth
  identity (DB constraints mirror these rules).
- Primary keys are ULIDs (non-sequential public identifiers, backend skill §10).

## State transitions

None — creation-only in this slice. Password changes, email verification,
and provider linking arrive with their own use cases.

## Persistence

- `users` table: `id` ULID PK, `display_name`, unique `email`,
  nullable `password`, `provider` (default `local`, indexed),
  nullable `provider_id`, unique `(provider, provider_id)`, nullable
  `avatar_url`, `remember_token`, timestamps.
- `personal_access_tokens` (Sanctum) uses string `tokenable_id` for ULID
  owners instead of the default `morphs()` bigint.
- `sessions.user_id` is a string for the same reason.

## Endpoints

| Method | Path | Purpose |
| ------ | ---- | ------- |
| POST | `/api/v1/auth/register` | Email/password registration, returns `{user, token}` (201) |
| POST | `/api/v1/auth/login` | Email/password sign-in, returns `{user, token}` (200, `throttle:5,1`) |
| POST | `/api/v1/auth/logout` | Revoke the current token (204, `auth:sanctum`) |
| GET | `/api/v1/auth/{provider}/redirect` | 302 to the provider (Google only) |
| GET | `/api/v1/auth/{provider}/callback` | Code exchange, find-or-create, 302 to the SPA with `#token=` fragment |

- Throttled: 60/min across auth endpoints (`auth-v1`), 10/min register
  (`auth-register`), 5/min login (`auth-login`). Named prefixes keep each
  budget in its own bucket — register attempts never eat login attempts.
  Lockouts render in the error envelope (`TOO_MANY_ATTEMPTS`, translated,
  with `Retry-After`).
- Success envelope: `{ data: { user, token } }`; errors render centrally as
  `{ error: { code, message, details? } }` (see `bootstrap/app.php`).

## Registration flows

- **Credentials:** `RegisterRequest` (required display name, valid unique
  email, password ≥ 8 confirmed) → `RegisterWithCredentialsHandler`
  (fast-path 409 `EMAIL_TAKEN`; DB constraint wins races) → bcrypt hash →
  Sanctum token for the request device.
- **OAuth (server code flow, stateless):** SPA opens the redirect URL →
  Google calls back with a code → `HandleOAuthCallbackHandler` resolves the
  verified account via Socialite, finds by `(provider, provider_id)`,
  creates on first sight, refuses 409 when the email belongs to another
  account, then redirects to `{FRONTEND_URL}/auth/callback#token=…`.
  Fragments never reach servers or logs, so the token travels without
  touching access logs. Unconfigured provider credentials fail closed
  (503 `OAUTH_NOT_CONFIGURED`).
- **Callback failures return to the SPA, never raw JSON:** the callback
  controller catches `DomainException` (the redirect twin of the central
  JSON renderer) and redirects to `/auth/callback#error=CODE` — code only,
  no sensitive data. The SPA maps `EMAIL_TAKEN` to its friendly
  "account exists, try logging in" message, anything else to the generic
  invalid-link message.
- **Documented trade-off:** stateless mode skips Socialite's session
  `state` check (API routes carry no session store). The authorization
  code is single-use and short-lived, and the account is verified by the
  provider itself.

## Error codes

`EMAIL_TAKEN` 409 · `OAUTH_NOT_CONFIGURED` 503 · `OAUTH_FAILED` 502 ·
`VALIDATION_FAILED` 422 (details per field) · shape violations 422.

## Domain events

None in this slice.

## Error codes

`InvalidUser` carries machine codes (`INVALID_EMAIL`,
`BLANK_DISPLAY_NAME`, `LOCAL_WITHOUT_PASSWORD`,
`OAUTH_WITHOUT_PROVIDER_ID`, `OAUTH_WITH_PASSWORD`,
`OAUTH_WITH_LOCAL_PROVIDER`) plus `identity.errors.*` translation keys.
Central HTTP rendering and the `ErrorCode` enum arrive with the first
endpoint (no HTTP mapping exists without one).

## Edge cases

- Multiple local users share `provider_id = NULL` — allowed, since
  Postgres/SQLite treat NULLs as distinct in unique constraints.
- `lang/` files are intentionally absent: this slice produces no
  user-facing strings (endpoints + validation messages come later).
- OpenAPI: nothing to document yet (no endpoints in this slice).
