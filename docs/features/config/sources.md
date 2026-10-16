# Sources — registry entries (domain layer only)

> Status: Domain + persistence + HTTP implemented and verified live.
> Next: YAML import/export endpoints, then the SPA screen.

## Purpose

Own the user's job-source registry (SPECS FR-38/FR-39, Stitch
"Sources — Edit entry"): one row per source with name, URL, type,
priority, country scope, and an enabled flag. Search
runs consume enabled rows read-only, ordered by priority.

## Approved schema deltas

- No `section` column (removed per approval; only the source itself).
- `country_code` is NOT NULL text holding `GLOBAL` or an ISO alpha-2
  code. Omitted input becomes `GLOBAL`, so queries avoid NULL logic.
- Uniqueness per user on both `(user_id, name)` and
  `(user_id, url)`.
- Telemetry (success rate, last run, status) is derived from future
  search runs, never stored on the row (FR-40: runs never mutate
  config). The UI shows `—` until Discovery lands.
- First build: CRUD + filtered list. YAML import/export follows.

## Business rules & invariants

- One registry per user realized as the SET of `sources` rows.
- Name 1..120 chars, trimmed; unique per user.
- URL required, https only, ≤ 2048 chars, valid host. The SSRF guard
  (no private/link-local IPs, capped redirects/size/timeout) lives in
  the infrastructure fetcher, which can resolve DNS. The Domain only
  checks shape and never touches the network.
- Type is closed: `search_engine, board, ats, career_page`.
- Priority is closed: `T1, T2, T3`. T1 queried first, wins dedup ties
  (`SourcePriority::rank()`, `winsTieOver()`).
- Country is `GLOBAL` or `/^[A-Z]{2}$/` (stored uppercase).
- `is_enabled` defaults true; disabled rows are skipped by runs.
  Only an explicit user edit flips it — telemetry never does.
- Identity (`id`, `userId`) never changes; edits use `replace()` or
  single-field methods on the immutable aggregate.

## Files

- `src/Config/Domain/Entities/Source.php`
- `src/Config/Domain/Enums/{SourceType,SourcePriority}.php`
- `src/Config/Domain/ValueObjects/{SourceName,SourceUrl,CountryCode}.php`
- `src/Config/Domain/Exceptions/InvalidSource.php`
- `src/Config/Domain/Repositories/SourceRepository.php`
- `src/Shared/Domain/Enums/ErrorCode.php` (+ `InvalidSourceValue`)
- `tests/Unit/Config/{SourceTest,SourceValueObjectsTest}.php`

## Next phases (not started)

1. YAML import/export endpoints with per-field schema errors.
2. SPA Sources screen (table + edit drawer) from the Stitch mockup.

## Endpoints

- `GET /api/v1/sources` (auth, throttled): owner-scoped paginated
  list (`?type=`, `?is_enabled=`, `?search=` over name+URL,
  `?per_page=` 1–100). Run order: priority, name, id.
- `POST /api/v1/sources` → 201: full document, per-user name/URL
  collisions answer 409 (`SOURCE_TAKEN`).
- `GET /api/v1/sources/{source}` → 200 / 404 (`SOURCE_NOT_FOUND`).
- `PUT /api/v1/sources/{source}` → 200: full replacement, self
  ignored in collision checks.
- `DELETE /api/v1/sources/{source}` → 204, hard delete.
- Auth: foreign ids answer 403 via `SourcePolicy` (consistent with
  the Profile endpoints); missing or malformed ids answer 404.
  Shape violations answer 422 with `error.details` per field.

## Validation pipeline (single source)

- `shared/validation/sources.json` is canonical (synced to
  `apps/web/shared/validation/` like the other specs). Laravel reads
  it through `ValidationSpec`; the SPA will build yup schemas from
  the same file when its screen lands.
- `boolean` was added to the shared DSL (PHP loader + TS builder)
  for `is_enabled`; no existing spec used it, so nothing changed.
- Three shape rules the DSL cannot express are merged in
  `SourceBodyRules` and re-enforced by the Domain: https-only URL,
  `GLOBAL`-or-ISO country.

## Files (HTTP layer)

- `src/Config/Application/{Commands,Queries}/` (create, update,
  delete, get, list; single-write handlers stay transaction-free
  like the Identity handlers, keeping them unit-testable)
- `src/Config/Infrastructure/Persistence/Eloquent/SourceMapper.php`
  (shared by the repository and the list read projection)
- `src/Config/Presentation/{Policies,Http/{Requests,Resources,Controllers}}`
- `shared/validation/sources.json`, `lang/{en,fr}/config.php`
- `routes/api.php` (`v1/sources` group), `app/OpenApi/Spec.php`
  (`SourceObject`, `SourceResponse`, `SourceListResponse`)
