# Profile — candidate truth (full vertical slice)

> Status: Shipped end to end. Laravel domain + HTTP and the SPA
> wizard below; tailoring workers consume the stored document read-only.

## Purpose

Own the candidate's structured truth (SPECS FR-4/FR-5): contact,
headline, summary, grouped skills, work history, education, and
language levels. Every tailored document must trace back to facts
stored here — never to invented experience.

## Actors

- Account owner (single profile per user; multi-profile out of MVP).
- Future tailoring workers (read-only consumers).

## Business rules & invariants

- One profile per user (`profiles.user_id` unique).
- Headline ≤ 140 chars, summary ≤ 2000 chars.
- Skills: non-blank group/name; level is a closed 4-step enum
  (beginner/intermediate/advanced/expert).
- Experience dates are `YYYY-MM`; a null end means present; end must
  not precede start; bullets capped (20 × 500 chars).
- Education years are integers within 1950..(current+5); end must not
  precede start.
- Languages use CEFR (a1..c2) plus native.
- Contact email validated locally; website must be http(s).
- Collections are bounded (skills 100, experience 30, education 20,
  languages 20) so a single PUT can never smuggle a dump.
- Updates are full-document replacements (`Profile::replace()`)
  matching PUT semantics; identity (id, userId) never changes.

## State & storage

- No lifecycle states. `profiles` table: ULID id, unique `user_id`,
  JSON columns per section, timestamps.

## Endpoints

- `PUT /api/profile` (auth:sanctum, throttled, owner-only via
  `ProfilePolicy`): step-scoped partial upsert. The payload's
  `current_step` selects which section is validated; sent sections
  merge with the stored document, the rest stays untouched. Without
  a step the whole document is validated (backward compatible).
  Returns the public `ProfileResource` shape with 200, including
  server-computed `completion_percent`.
- `GET /api/profile` returns the stored document plus `current_step`
  and `completion_percent` (null document when never saved).

## Wizard & completion

- Steps, in order: contact, headline, skills, experience,
  education, languages, review (`ProfileStep::order()`).
- `ProfileCompletion::for()` scores filled sections out of 100
  (contact 20, headline 10, summary 5, skills 15, experience 25,
  education 10, languages 15). A section counts only with real
  content; client-sent scores are ignored — the aggregate
  recomputes on every save and on read.

## Error codes

- `INVALID_PROFILE_VALUE` (422) with `profile.errors.*` translation
  keys (EN + FR present).

## Web wizard (`/profile`)

- Seven steps with one icon each (user, article, sliders, briefcase,
  graduation cap, globe, check): contact, headline, skills,
  experience, education, languages, review. The editor reopens at the
  stored `current_step`; free jumping between steps unlocks at 100%
  completion.
- Save semantics: non-review steps show Next plus a plain Save that
  persists the current slice, stays on the step, and is the only
  action that shows the "Profile saved" banner. Advancing steps saves
  silently with no banner. The review step alone shows
  Save-and-go-to-dashboard, which validates the whole document and
  routes to `/dashboard`.
- Completion bar mirrors the server score; the step pills and the
  step content animate (fade-and-rise), all disabled under
  `prefers-reduced-motion`.

## Skills taxonomy + shared Autocomplete

- `features/profile/data/skills-taxonomy.json`: 12 IT groups with
  ~140 skills. Suggest-only — picking from the list is encouraged
  but custom text still saves, so existing documents never break.
  The skill pool narrows to the picked group, otherwise every skill
  shows with its group as context.
- `components/ui/inputs/Autocomplete.tsx`: one reusable picker fed
  entirely by props (options pool, strict vs suggest, empty/invalid
  copy). Field variant (inline input) serves country, skill group,
  and skill; menu variant (button trigger, search inside) serves the
  phone country code. Country stays strict (unknown text reverts);
  groups/skills stay suggestive.

## Validation pipeline (single source)

- `shared/validation/profile.json` (+ `auth.json`) is the canonical
  spec. Laravel reads it through `ValidationSpec`
  (`src/Shared/Application/Validation/`); the SPA builds yup schemas
  from the same files (`lib/validation/` via `builder.ts`).
- The web app syncs the specs into gitignored `apps/web/shared/`
  on install/dev/build (`sync:validation`); Docker images
  `COPY shared/validation` from the repo-root build context.
- Spec message values are translation keys: `copy.ts` (profile
  namespace) on the web side, `lang/{en,fr}/profile.php` on the API
  side — both sides report identical text.

## Wiring notes

- SPA proxy `app/api/profile/route.ts` forwards GET/PUT with the
  session Bearer token; the token never reaches the browser.
  `lib/api/profile.ts` is the only client of that proxy.
- Sidebar links `/profile` with active state via
  `DashboardShell(active="profile")`; all wizard/user copy lives in
  `copy.profile`, all wizard styling in `app/globals.css`.
