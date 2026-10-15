# P10 — Explicit path-param templates for the Tamanu API client

Refactor the web / patient-portal API client so path parameters arrive as a
template plus a params object, instead of being interpolated into the path
string at the call site. The template stays a literal with `:param` placeholders
all the way to `TamanuApi.fetch`, so browser telemetry (card M9) can group spans
by route pattern and record the resolved params separately, without the
character-class heuristic guessing.

No spec — this is a refactor, not a product behaviour change. This plan is the
working record.

## Interface decision

Path params ride on **argument 1**, bundled with the template, via a `route()`
descriptor helper. Arg 1 is the only argument shared in the same position across
every verb (arg 2 is `query` for `get`/`delete`/`download` but `body` for
`post`/`put`/`patch`), so this is the only placement that is uniform across the
whole API surface and keeps the params next to the template that names them.

```js
api.get(route('patient/:patientId/allergies', { patientId }), query)
api.post(route('patient/:patientId/vaccine', { patientId }), body)
api.put(route('encounter/:encounterId', { encounterId }), body)
api.delete(route('notes/:noteId', { noteId }))
```

- `route(template, params)` returns a small **branded** descriptor (class
  instance or unique-symbol-tagged object) so `fetch` can detect it reliably
  rather than sniffing for a `template` key.
- Exported from `@tamanu/api-client`; call sites import `{ route }`.
- Name chosen as `route` because it is literally the telemetry grouping key, and
  `path` collides with a local `const path` inside `fetch`.

### Why not the alternatives

- **3rd-arg config bag** (`api.get(ep, query, { path })`, the card's original
  sketch) — strands the params in arg 3 while `post`'s body sits in arg 2; reads
  disjointed.
- **Tagged template** (`` api.get(route`patient/${id}/allergies`) ``) —
  interpolates the value into a concrete string at the call site, so `fetch`
  never sees the pattern. Defeats the whole purpose.

## Backwards compatibility (the key property)

`fetch` branches on the **type** of arg 1:

- `string` → today's exact path (raw path + heuristic fallback for telemetry).
- `RouteDescriptor` → expand `:name` tokens, central `encodeURIComponent`,
  explicit telemetry.

The verb signatures widen `endpoint: string` → `endpoint: string | RouteDescriptor`,
a superset. So:

- Any other branch that passes a plain string keeps working and keeps
  type-checking, before and after it merges. No big-bang cutover; migration is
  genuinely file-by-file.
- A string containing `:` is never reinterpreted — expansion only runs for the
  descriptor object.
- The only cross-branch friction is ordinary textual merge conflicts if the
  codemod rewrites a file another branch is also editing. A git problem, not a
  runtime one.

## M9 dependency / sequencing

M9's telemetry sink is **not in this worktree** — this branch has the
pre-telemetry `TamanuApi`. Split the work accordingly:

- **Independent of M9** (can land now): the `route()` helper, expansion +
  central encoding in `fetch`, the codemod, and the ESLint guard. These already
  pay off (central encoding, cleaner call sites, no regression path).
- **Needs M9's sink** (do once the branches meet — rebase P10 onto merged M9, or
  add in M9 after it absorbs the descriptor): add optional `route?` and
  `pathParams?` to `TelemetryRequestStart`, emit them from `fetch` for descriptor
  calls, and have M9's collector prefer them over `genericiseApiPath` when
  present.

Flag to Rohan: consider marking P10 `dependsOn` M9, or at least landing the
telemetry-wiring step after M9 is in main.

## Work breakdown

### api-client — core (independent of M9)

- [x] `RouteDescriptor` + `route(template, params)` in
      `packages/api-client/src/route.ts`; branded via `Symbol.for` (survives a
      duplicated module copy in a bundle, unlike instanceof).
- [x] TypeScript: `params` typed from the template via template-literal types —
      a missing/extra/misnamed `:token` is a compile error, and a param-less
      template takes no params arg. Trailing query string in a template is
      stripped before extraction.
- [x] Export `route`/`expandRoute`/`isRouteDescriptor` + types from `src/index.ts`.
- [x] `TamanuApi.fetch` resolves `endpoint` (descriptor → `expandRoute`, central
      `encodeURIComponent`, strict throw on token/param mismatch) before building
      the query string. Verb signatures widened `string` → `Endpoint`.
- [x] All verbs flow through unchanged — only `fetch` knows about the descriptor.
- [x] Unit tests (9) pass: expansion, encoding (incl. a `/`-containing value),
      numeric values, no-placeholder passthrough, missing/extra param throws,
      descriptor detection vs plain object/string. Added `vitest.config.ts` so
      api-client joins the vitest project list.

### Codemod (ts-morph)

- [x] `scripts/codemods/migrate-route-params.mts` (tsx). Dry-run by default,
      `--write` to apply; accepts globs, defaults to web + patient-portal.
- [x] Unwraps `encodeURIComponent(x)` → `:x`; derives `patient.id` → `patientId`
      so `.id` params are named and collisions mostly avoided.
- [x] Flags (does not touch): partial-segment interpolation, non-identifier
      expressions, duplicate derived names, query string in template.
- [x] Applied: **268 rewrites across 200 files**; 4 flagged, all migrated by hand
      (query moved to the query arg for get/delete; the one PUT keeps its static
      flag in the template, as PUT has no query channel).

### ESLint guard

- [x] `no-restricted-syntax` entry scoped to `BROWSER_PACKAGES` forbidding a
      template literal with expressions as the first arg of `api.<verb>(...)`.
      The base `vi.mock` selector is repeated in the same block (flat config
      overrides rather than merges `no-restricted-syntax` per file).

### Verify

- [x] ESLint clean on changed files (0 errors; 8 pre-existing warnings untouched).
- [x] `@tamanu/api-client` unit tests pass (9/9).
- [x] Type enforcement confirmed in isolation (valid calls pass; missing/extra/
      no-arg cases are real compile errors).
- [x] web + patient-portal build clean (both dist rebuilt, exit 0).
- [ ] Spot-check a migrated area end-to-end against the running app (optional).

### Follow-ups / when M9 lands

- [ ] Add optional `route?`/`pathParams?` to `TelemetryRequestStart` and emit
      them from `fetch` for descriptor calls; collector prefers them over
      `genericiseApiPath`. (Needs M9's sink — do on rebase.)
- [ ] The one PUT with a baked `?skipConflictCheck=true` query won't group as
      cleanly in telemetry (query is in the route). Acceptable (static flag); or
      give post/put a query channel later.
