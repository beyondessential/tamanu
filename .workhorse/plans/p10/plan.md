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

- [ ] Add `RouteDescriptor` + `route(template, params)` in a new
      `packages/api-client/src/route.ts`; brand it (class or unique symbol).
- [ ] TypeScript: type `params` from the template via template-literal types so a
      missing/extra `:token` is a compile error. Fall back to
      `Record<string, string | number>` if the recursive type proves too gnarly.
- [ ] Export `route` and `RouteDescriptor` from `src/index.ts`.
- [ ] In `TamanuApi.fetch`, before building the query string: if `endpoint` is a
      `RouteDescriptor`, expand `:name` tokens against `params`,
      `encodeURIComponent` each value, and produce the concrete path. Throw in
      dev on a token with no matching param, or a param with no token (strict —
      catches typos at source).
- [ ] Confirm all verbs flow through unchanged: `get`/`delete`/`download` pass
      arg 1 straight to `fetch`; `post`/`put`/`patch`/`postWithFileUpload` too.
      Only `fetch` needs to know about the descriptor.
- [ ] Unit tests: expansion, encoding (incl. the `referenceData/village-Nasaga`
      case), missing/extra param throws, plain-string passthrough unchanged,
      query + path params together.

### Codemod (ts-morph)

- [ ] Script under `packages/scripts` to rewrite `api.<verb>` call sites in
      `packages/web` and `packages/patient-portal` from interpolated template
      literals to `route(...)`, and add the `route` import.
- [ ] Unwrap existing `encodeURIComponent(x)` in a segment → `:x` + `{ x }`
      (central encoding replaces it).
- [ ] Flag for manual review, do not auto-rewrite: partial-segment interpolation
      (`village-${x}`), non-identifier expressions (`${foo.bar}`,
      `${a + b}`), duplicate derived param names, and templates that already
      contain a query string.
- [ ] Run in batches by area (encounters, labs, medications, vaccines, …),
      leaning on the integration/e2e tests between batches.

### ESLint guard

- [ ] Add a `no-restricted-syntax` entry (alongside the existing one) scoped to
      `BROWSER_PACKAGES`, forbidding a `TemplateLiteral` with expressions as the
      first argument of an `api.<verb>(...)` call, so new code can't regress to
      interpolation. Best-effort on the `api` receiver (won't catch every alias);
      message points at `route()`.

### Verify

- [ ] `npx eslint` clean on changed files.
- [ ] `@tamanu/api-client` unit tests pass.
- [ ] web + patient-portal build clean.
- [ ] Spot-check a migrated area end-to-end against the running app.
