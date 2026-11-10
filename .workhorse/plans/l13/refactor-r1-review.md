# Refactor review — changes-pending check (`be856ee121..HEAD`)

Adversarial read of the 17 commits claimed as pure refactor + comment trim + test
restructuring, against the spec at `specs/sync/changes-pending-check.md`.

**No behaviour regression found.** Every externally visible behaviour I could trace —
HTTP status, request URL, log lines, return values, side-effect ordering — is preserved.
One response *body/type* changes (finding 1). The rest are readability and
future-proofing points.

Verified by running, all green:

- `packages/mobile` jest: `CentralServerConnection.test.ts`, `MobileSyncManager.test.ts` (50 tests)
- `packages/facility-server` vitest: `FacilitySyncManager`, `hasUnpushedChanges`, `CentralServerConnection` (58 tests)
- `packages/central-server` vitest: `changesPending.test.js` (12 tests)
- `eslint` over every changed file: clean

---

## 1. Malformed `since` still answers 4xx, but with a different problem type and message

`packages/central-server/app/sync/changesPending.js:18`

`querySchema.safeParse` + `InvalidParameterError` became a bare `querySchema.parse`.

**Status is safe.** `Problem.fromError` (`packages/errors/src/Problem.ts:45`) maps
`$ZodError` to `ValidationError`, and `ValidationError`, `InvalidParameterError` both
extend `BaseValidationError` → **422** either way. I confirmed this by running the
schema through `Problem.fromError` directly (`status: 422 type: validation`), and the
route test `rejects a cursor that is not an integer` passes — `toHaveRequestError()`
(`__tests__/configureEnvironment.js:49`) only passes on `400 <= status < 500`.

**On commit 769e11e720:** its message says a bare ZodError "came back as a 500". That
does not hold on this tree, and as far as I can tell did not hold then either — the
`$ZodError` branch in `Problem.ts` has been there since the errors package was created
(`c5997efbf8`), long before `769e11e720`. The 500 that commit actually fixed was the
bare `Error` thrown by `device.ensureHasScope`, which this diff does not touch
(`buildSyncRoutes.js:43`). So reverting the `safeParse` half is safe on status.

**What does change** is the problem document and the message:

| | before | after |
| --- | --- | --- |
| `type` | `/problems/validation-parameter` | `/problems/validation` |
| `title` | `Invalid parameter` | `Validation` |
| `detail` / `error.message` | `since must be an integer sync tick` | the pretty-printed JSON array of zod issues (multi-line, ~10 lines) |

Failure scenario: a device (or a probe) sends `GET /api/sync/pending?since=abc`. The
facility treats it as a failed sync and writes `error.message` into
`SyncFacilityRun.error` (`FacilitySyncManager.js:152`), which now stores a multi-line
JSON blob instead of the one-line reason; the same blob goes to central's
`log.info` line in `errorHandlerProblem`. Anything matching on
`type === 'validation-parameter'` stops matching.

No client sends a malformed `since` today (both clients send a `Number` or omit the
key), so this is only visible when something is already wrong — but it is a real
response change inside a commit presented as a refactor.

**Severity: suggestion.**

---

## 2. Mobile reads Retry-After through `AxiosHeaders.get` only — safe today, on an axios internal

`packages/mobile/App/services/sync/CentralServerConnection.ts:56`

```ts
const retryAfter = (err.response?.headers as AxiosHeaders | undefined)?.get('retry-after');
```

replaces a branch that handled both a plain object and an `AxiosHeaders` instance.

**I traced this and it is correct in production.** axios 1.18's `dispatchRequest`
(`node_modules/axios/lib/core/dispatchRequest.js:79`) does
`reason.response.headers = AxiosHeaders.from(reason.response.headers)` for *every*
non-cancel rejection that carries a response, and the xhr adapter React Native uses
already builds `AxiosHeaders.from(...)` itself (`lib/adapters/xhr.js:47`). The one
rejection that skips that normalisation, `CanceledError`, has no `.response`, so the
optional chain covers it. There are no response interceptors registered anywhere in
`packages/mobile`.

**The concern is that nothing at the call site says so.** `diagnoseProblem` runs inside
the `catch` of `this.client.request(...)` (`CentralServerConnection.ts:147-149`), so
an error whose `response.headers` is a plain object throws
`TypeError: headers.get is not a function` **in place of** the original error — the 503
is lost and the sync reports a type error instead. The diff itself demonstrates this:
the test fixtures had to be rewritten to construct a real `AxiosHeaders`
(`CentralServerConnection.test.ts:28,133-136`) precisely because the old plain-object
fixtures now crash. And the `as AxiosHeaders` cast silences the one check that would
catch a future gap (mobile has `strict: false`, so it would be silent regardless).

Failure scenario: someone registers a response interceptor, changes adapter, or writes
a new test with `{ response: { status: 503, headers: { 'retry-after': '7' } } }` — the
sync fails with a TypeError about `headers.get` rather than reporting the 503.

The deleted comment ("axios gives either a plain object (lower-cased keys) or an
`AxiosHeaders` instance") was the record of why the branch existed. If the branch is
going, the invariant that replaces it — axios normalises rejection headers — should be
written down at line 56.

**Severity: suggestion.**

---

## 3. Facility `whenCentralWakes` dropped two optional guards

`packages/facility-server/app/sync/CentralServerConnection.js:17-18`

`error?.response?.status` → `error.response?.status`, and
`error.response.headers?.get?.('retry-after')` → `error.response.headers.get('retry-after')`.

Traced and safe on every path I can reach: `extractErrorFromFetchResponse` sets
`problem.response = response` to the real fetch `Response`
(`packages/errors/src/extractErrorFromFetchResponse.ts:191`), whose `.headers` is a real
`Headers` with `.get`. Network failures and `faithFetch` errors have no `.response`, and
the `throwResponse` path throws the `Response` itself (also no `.response`), so the
`status === 503` check short-circuits first.

Residual, both of which replace the original error with a TypeError inside a catch:

- a rejection with `null`/`undefined` now throws `Cannot read properties of null
  (reading 'response')` instead of rethrowing the falsy value;
- a 503 whose `.response` has no `headers` (or headers without `.get`) now throws
  `Cannot read properties of undefined (reading 'get')` instead of rethrowing the 503
  as an ordinary failure, which is what the spec asks for.

Note the facility's own test fixtures build `headers` as a plain object that happens to
carry `get`/`has` (`__tests__/sync/CentralServerConnection.test.js:28-35`), so the tests
would not catch a regression here either.

**Severity: nit.**

---

## 4. `completeSync`'s comment describes a value, not the method

`packages/facility-server/app/sync/FacilitySyncManager.js:263-264`

```js
// The last successful sync time the sync status reports; deliberately not the pull cursor,
// which only a session's pull moves.
async completeSync(startTime) {
  await this.provisionFromCentral();
  ...
```

The ordering is right — I diffed it against `be856ee121`: provision → measure duration →
stamp `lastCompletedAt`, then log `completedSession` with that duration, for the session
path; and for the up-to-date path, `log.info('upToDate')` first, then the same sequence
with no `completedSession` line. Identical to before.

The readability loss is in the comment. It is a sentence fragment carried over verbatim
from `markSyncCompleted`, which only recorded the time. `completeSync` now *also* does
`provisionFromCentral()` — a round trip to central that can run the sync-user swap and
the PSK read. The comment says nothing about that, so a reader of

```js
if (!changesToPull) {
  log.info('FacilitySyncManager.upToDate', { pullSince });
  return this.completeSync(startTime);
}
```

has no hint that this branch talks to central again — which is a spec requirement
("A sync that the check answers with nothing to pull still does the provisioning a
facility does after a session"). The old call site spelled it out in two lines.

Either rename to something that admits both halves, or lead the comment with
"Provisions, then records the sync as completed: …".

**Severity: suggestion.**

---

## 5. Dropped note made a load-bearing read look arbitrary

`packages/central-server/app/sync/changesPending.js:20-22`

The trim removed `// Read per request, so a config override applies.` from above
`CentralSyncManager.config.sync.lookupTable.enabled`. That read is deliberately inside
the handler: `overrideConfig` / `restoreConfig` only take effect because of it, and the
test `always answers that there are changes when the lookup table is turned off`
depends on it. With the note gone, hoisting it to module scope reads as a free
improvement and would silently break that test and any runtime config reload.

The surviving comment ("Without the lookup table there is no tick to compare against, so
a session must decide.") now sits directly above `const hasNeverPulled = …`, where it
explains the wrong half of the condition it precedes.

**Severity: suggestion.**

---

## 6. The `outgoingChangesQuery` comments no longer define the query

`packages/facility-server/app/sync/snapshotOutgoingChanges.js:8-9`
`packages/mobile/App/services/sync/utils/snapshotOutgoingChanges.ts:21-22`
`packages/facility-server/app/sync/hasUnpushedChanges.js:7`

Before, the comment on `outgoingChangesQuery` said what it selects ("every row of a model
changed since the last successful push, deleted ones included") and then that the other
caller must match. After, only the second half survives:

```js
// Shared with hasUnpushedChanges, which must select exactly the rows a push sends (deleted ones
// included).
export const outgoingChangesQuery = since => ({ ... });
```

So the comment on the definition now describes a *caller's* obligation and never says
what the thing it sits on returns; "(deleted ones included)" dangles off "a push sends"
rather than off the query. The reader has to reconstruct the meaning from `Op.gt` plus
`paranoid: false`. Same shape in the mobile copy. `hasUnpushedChanges`'s jsdoc lost the
definition of what counts as an unpushed change (tick above the last successful push
cursor, models that push to central) for "Whether the next sync would push anything".

Short is good; these went one step past the point where the sentence still carries the
fact.

**Severity: nit.**

---

## 7. Route-ordering note removed (the note was wrong, so this is fine — recorded for completeness)

`packages/central-server/app/sync/buildSyncRoutes.js:55-57`

The deleted half-sentence claimed `/pending` is "defined before the `/:sessionId` routes,
which would otherwise capture it". That was not true: there is no bare `GET /:sessionId`
in this router — only `/:sessionId/ready`, `/:sessionId/metadata`, `/:sessionId/pull…`,
`/:sessionId/push…` (and `DELETE /:sessionId`), none of which can match `/pending`. So
route order is not load-bearing today and the removal is correct. Worth knowing that if
a `GET /:sessionId` is ever added, the ordering becomes load-bearing with nothing saying so.

**Severity: nit.**

---

## Tests — what I checked and what I found

### Not weakened, not vacuous

- **`FacilitySyncManager.test.js` — `vi.mock` of `hasUnpushedChanges`.** The run-history
  tests still exercise what their titles claim. They assert on `SyncFacilityRun` rows
  (status, `sessionId`, `triggerType`, `urgent`, `error`, `completedAt`) and on
  `markSessionErrored`; none of that is stubbed. The shared `makeSyncManager` additionally
  supplies `checkChangesPending: async () => true`, `user`, `hasBootstrapped = true` and
  `startedAtTick` (was `tick`), which means scheduled-trigger run-history tests now go
  *through* the check before opening a session. Previously they cannot have reached the
  check — the old run-history helper had no `checkChangesPending` at all, so a `false`
  from the real `hasUnpushedChanges` would have thrown. So this block exercises more than
  before, not less.
- **`hasUnpushedChanges.test.js` — dropped `is false when nothing has changed since the
  last successful push`.** Genuinely subsumed. The surviving `is false for a row once the
  push cursor has caught up with it` creates a real row, moves the clock past it, and
  still asserts `false` — strictly stronger than the empty case it replaces.
- **`changesPending.test.js` — dropped `does not count pending-update flags and stubs as
  changes`.** Covered by the unit test `is the highest settled tick, ignoring
  pending-update flags and stubs`, which inserts the same set including
  `stub-with-high-placeholder` (tick 9999, null data) and asserts `50`. The
  handler→query composition is covered by the `it.each` rows. No loss.
- **`changesPending.test.js` — removed `FACILITY_ID` facility.** Unused; `login()` asserts
  success, so a missing prerequisite would fail loudly. Suite passes.
- **`CentralServerConnection.test.js` (facility) — hoisted fetch spy.** The two blocks had
  identical setup; the waking block's extra `mockReturnValueOnce(authSuccess)…` stays in
  its own `beforeEach`, which runs after the outer one. Correct and verified green.
- **Mobile `checkForChangesToPull` tests got stronger.** They now drive the real `fetch` /
  `callWithBackoff` path and assert the URL axios would actually build, instead of
  asserting the arguments handed to a spied `get`.

### Query-string behaviour with `since === undefined` — both clients unchanged

The explicit `since === undefined ? {} : { since }` was replaced with `{ since }` on both
sides. Both drop the key:

- facility: `qs.stringify({ since: undefined })` → `''` (verified by running `qs`), so no
  query string at all; asserted by `leaves the cursor out when the device has never pulled`.
- mobile: `axios.getUri({ url, params: { since: undefined } })` →
  `http://x/api/sync/pending` (verified by running axios), asserted by the new `it.each`
  row.

So the spec's "a marker that it has never pulled" still reaches central as an absent
`since`, which the handler reads as `hasNeverPulled` → `changesToPull: true`.

### One coverage link now untested

`FacilitySyncManager.test.js:511-515` — `when the facility has local changes to push` used
to create a real `ReferenceData` row above the push cursor and prove the manager skipped
the check; it now sets `hasUnpushedChanges.mockResolvedValue(true)`. Both halves are
still covered separately (the query against the database in `hasUnpushedChanges.test.js`,
the branch against the stub here), and the title still describes what the test asserts,
so I would accept this — but nothing now proves the two are wired together, and the
module-level `vi.mock` means a rename or signature change on `hasUnpushedChanges` would
not be caught by this file.

**Severity: nit.**

---

## Minor

- `whenCentralWakes` now names two different contracts in two packages: in facility it
  inspects a raw error for `503` + `Retry-After`; in mobile it is
  `instanceof CentralWakingError`. Not a bug, but the shared name invites the assumption
  that they are the same helper.
- `getHighestRealChangeTick.js:36-39` — the trimmed comment is accurate (the
  `data IS NOT NULL` guard does catch a stub at any tick, as
  `stub-with-high-placeholder` in the test shows), and dropping the old claim that
  "stubs and flagged rows sort below every real tick" is an improvement, because that
  row contradicts it.
- `convergeSyncUser.js:18-19`, `MobileSyncManager.ts:328-331`,
  `FacilitySyncManager.js:272-273` ("Runs after every successful sync…" — more accurate
  than the old "every sync that reached central", which was wrong for a queued sync):
  all rewrites check out against the code.
