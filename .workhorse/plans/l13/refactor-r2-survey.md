# Refactor survey (round 2, fresh eyes)

Scope: `git diff 0f623d2ce6...HEAD -- packages` — the changes-pending check across central, facility
and mobile, product and tests. Read-only survey; nothing edited.

Overall the branch is in good shape. The two extractions it makes (`outgoingChangesQuery` in both
`snapshotOutgoingChanges` modules) are exactly the right ones, the new test blocks are better
factored than the files around them, and most of the added comments earn their place. The candidates
below are small; I have ranked them and said where an area is already minimal rather than padding.

---

## 1. `provisionFromCentral` is a pass-through layer

`packages/facility-server/app/sync/FacilitySyncManager.js:262-292`

`completeSync` (2 callers) does nothing but call `provisionFromCentral` (1 caller, this one) and then
set the two timing fields. Fold the body of `provisionFromCentral` into `completeSync` and merge the
two comment blocks into one — both halves of the "why" (runs after every successful sync, with or
without a session; moves the sync time and deliberately not the pull cursor) still need saying, and
the inner "Provisioning that needs a live central, ordered: …" comment stays put.

- **Net lines**: about −5.
- **Risk**: very low. No caller outside the file (`grep provisionFromCentral` → one definition, one
  call), no test calls it directly.
- **Coverage**: `FacilitySyncManager.test.js` — the `provisioning that needs central` block and the
  new `still pulls the settings PSK when there is nothing to pull` case both run through it.

## 2. Mobile test: a spy captured only to be restored

`packages/mobile/App/services/sync/MobileSyncManager.test.ts:255-282`

`endSessionSpy` is declared, assigned over three lines and restored, and never asserted on — replace
it with a bare `jest.spyOn(centralServerConnection, 'endSyncSession').mockResolvedValue(undefined);`.
Then the whole `afterEach` (three `mockRestore()` calls) becomes
`afterEach(() => jest.restoreAllMocks());`. The spies have to be restored, because
`centralServerConnection` is built once for the whole file and `jest.clearAllMocks()` in the outer
`beforeEach` clears calls but not implementations; `restoreAllMocks` covers that and the
`mobileSyncManager` spies too (harmless — that object is rebuilt per test).

- **Net lines**: about −7.
- **Risk**: low. `restoreAllMocks` touches only `jest.spyOn` spies, not the `jest.mock('./utils')`
  factory the file depends on.
- **Coverage**: the block's own 9 cases; a leak would show as failures in the describes that follow.

## 3. `changesPending.js` duplicates imports the route file already has

`packages/central-server/app/sync/changesPending.js:1-37`, registered at
`packages/central-server/app/sync/buildSyncRoutes.js:55-57`

Every import in the new module — `asyncHandler`, `z`, `InvalidParameterError`, `CentralSyncManager` —
is already imported by `buildSyncRoutes.js`, which holds every other sync handler inline. Moving the
handler body into the `.get('/pending', …)` registration drops that eight-line header; only
`getHighestRealChangeTick` has to be imported in its place (`getHighestRealChangeTick.js` stays its
own module either way, as it gains callers later).

- **Net lines**: about −8.
- **Risk**: low. Nothing imports `changesPendingHandler` but `buildSyncRoutes`, and the test drives
  the route over HTTP (`baseApp.get('/api/sync/pending')`), not the exported handler.
- **Counter-argument, honestly**: `buildSyncRoutes.js` is already 413 lines and this adds ~25. If the
  intent is to start peeling handlers out of that file, leaving it split is defensible — but then it
  is the first of a pattern, not a one-off.
- **Coverage**: `packages/central-server/__tests__/sync/changesPending.test.js`, `GET /api/sync/pending`
  block (7 cases).

## 4. Central test: hand-written SQL insert where the model will do

`packages/central-server/__tests__/sync/changesPending.test.js:40-55`

`addLookupRow` writes a raw `INSERT INTO sync_lookup (…six columns…)`. The comment says this is
"because the lookup table's own id column is a serial" — the serial is real, but it only means the
id must be supplied, not that the model can't be used:
`packages/database/__tests__/sync/syncLookupSelfHeal.test.ts:10-18` does exactly this with a module
level `nextSyncLookupId++` counter and `models.SyncLookup.create({ id, … })`. Same here gets the
helper down to a `create` call with `recordId`, `recordType: 'patients'`, `data`,
`updatedAtSyncTick`, `isLabRequest: false`, `isDeleted: false`, and drops a column list that has to
be kept in step with the schema by hand.

- **Net lines**: about −6, and one fewer hand-maintained SQL statement.
- **Risk**: low-medium. Both paths hit the same database triggers (triggers are not ORM-level), but
  the suite asserts exact ticks (`toBe(50)`), so this one wants the test actually run, not reasoned
  about.
- **Coverage**: the file's own 9 cases all go through this helper.

## 5. Mobile: the `tablesForFullResync` fact is now read in two places

`packages/mobile/App/services/sync/MobileSyncManager.ts:325-328` and `:434-437`

`hasLocalWorkToSync` adds a third bare `'tablesForFullResync'` string literal to this file and a
second copy of the same `LocalSystemFact.findOne({ where: { key: … } })`. A small
`getTablesForFullResync(): Promise<string[] | undefined>` method serves both — the new caller wants
truthiness, the pull caller wants the split value, and `fact?.value.split(',')` is truthy exactly
when the record exists.

- **Net lines**: about −3, one fewer copy of the magic string.
- **Risk**: low.
- **Coverage**: `MobileSyncManager.test.ts` asserts the call shape
  (`expect(findFact).toBeCalledWith({ where: { key: 'tablesForFullResync' } })`), which the helper
  preserves; the pull side is covered by `MobileSyncManager.pull.test.ts`.

## 6. Comments to cut

I read every comment the diff adds or edits. These four say what the next line or two already says:

- `buildSyncRoutes.js:56` — `// lets a device with nothing to pull skip opening a session`. The spec
  tag above it and `changesPendingHandler` beside it carry this. (−1)
- `facility-server/app/sync/CentralServerConnection.js:15` — "Returns a catch handler answering
  `fallback` while central wakes". The five lines below are exactly that; the line above it (bare
  503 vs 503-with-Retry-After) is the part worth keeping. (−1)
- `getHighestRealChangeTick.js:4` — `// The highest settled sync tick in the lookup table, or null
  when it holds none.` The name plus `return row ? … : null` say it, and the next comment explains
  what "settled" rules out. Borderline; the rest of that block is load-bearing. (−1)
- `changesPending.js:29` — `const hasNeverPulled = since === undefined;` is used once on the very
  next line; inline it into the condition. (−1, it's code not comment, but it's the same kind of
  restatement.)

Everything else I'd keep, having checked it:

- The `convergeSyncUser.js` retirement note is **accurate** — `convergeSyncUser` first shipped on
  `release/2.62` (added 2026-07-28 in `9412a4f897`, present on 2.62 and every branch after), so
  "Added in v2.62. Retire it once every facility server has synced on v2.62 or later" is correct.
- `// answer with the schema's one message, which the device records, rather than zod's issue list`,
  `// Read per request, so a config override applies`, `// bigint columns come back as strings`,
  `// a query builder update, so the sync tick bookkeeping that saving a model does is skipped`,
  `// the automock would stub the real header class…`, `// axios drops an undefined param…`, both
  `// Shared with has{Unpushed,Outgoing}Changes…` notes, and the two "waking central cannot …" lines
  all give a reason that is not divinable from the code. Keep.
- All `spec:` tags keep, including the second one inside the facility check block.

## 7. Small shrinks in the check handler

`packages/central-server/app/sync/changesPending.js:9-16`

The `z.object({ since: … })` wrapper exists to parse one field. `const sinceSchema = z.string()
.regex(…).transform(Number).optional()` with `sinceSchema.safeParse(req.query.since)` is two lines
shorter and behaves identically in every case, including an array `?since=1&since=2` (still a
`z.string()` type failure with the same message).

Note for anyone tempted to go further: the house style for an integer query param elsewhere is
`z.coerce.number().int().optional()` (`admin/locationAssignments.js:40`), and it must **not** be used
here — `Number('') === 0`, so `?since=` would be accepted where the test requires rejection, and the
error message would become zod's default instead of `since must be an integer sync tick`. The regex
form is the right one.

- **Net lines**: about −2 (−3 with the `hasNeverPulled` inline from §6).
- **Risk**: none.
- **Coverage**: `rejects a cursor that is not an integer` (`'soon'`, `''`, `'1.5'`).

---

## Already as small as it should be

Saying so plainly rather than inventing work:

- **`hasUnpushedChanges.js`** (16 lines) — a cursor read, a loop, a first-row-only query reusing
  `outgoingChangesQuery`. Nothing to take out. Its own module is justified (future callers, and the
  manager test mocks it by module path).
- **`getHighestRealChangeTick.js`** — the raw `sequelize.query` matches how `updateLookupTable.js`
  reads this table. A Sequelize `findOne` with `Op.gt`/`Op.ne` ordering would be ~4 lines shorter but
  makes the index walk less legible and risks a different plan on the largest table in the
  deployment. Leave it. The `!== null` guard is not defensive-against-the-impossible either:
  `null > since` is `true` for a negative `since`, which the schema allows.
- **The `outgoingChangesQuery` extractions** (facility and mobile) — these are the duplication fix,
  each one function and a comment saying why it is shared. Correct as they stand.
- **`facility-server/__tests__/sync/CentralServerConnection.test.js`** — hoisting the
  `fetch`/`centralServer` `beforeEach` to the top-level describe removed real duplication, the new
  block reuses the file's existing `fakeSuccess`/`fakeFailure` helpers, and the Retry-After pair is
  already an `it.each`.
- **`hasUnpushedChanges.test.js`** — four cases, no repeated setup worth tabling; the row cleanup in
  `afterEach` is needed because the local clock is reset.
- **The central `it.each` answer table** — six situations in one table, which is what that shape is
  for.
- **Cross-package duplication of the waking-central helper and the `changesToPull` guard** (facility
  `CentralServerConnection.js:14-21,138-148` vs mobile `CentralServerConnection.ts:36-60,230-241`) —
  I looked for a home for a shared predicate. There isn't a good one: facility goes through
  `TamanuApi`/fetch `Headers`, mobile through axios and its own `diagnoseProblem` translator, and the
  only package both depend on is `@tamanu/constants`/`@tamanu/errors`, where a three-line predicate
  would be worse than the copy. Leave both. Two notes if anyone touches them: the error message
  string is identical by design and must stay so, and the two methods are named differently for the
  same operation (`checkChangesPending` vs `checkForChangesToPull`) — worth settling on one name if
  anything else in these files moves.
- **The repeated `{ type: 'scheduled' }` / `'userRequested'` literals** — pre-existing across
  `SyncTask.js`, `routes/apiv1/sync.js`, `subCommands/sync.js`; the diff adds one reader of the same
  convention. Making a constants enum is a separate, wider change, not this branch's debt.
- **Pre-existing spy boilerplate in `MobileSyncManager.test.ts`** (the `runSync()` describe above the
  new one repeats five-line spy setups per test) — real duplication, but untouched by this diff and
  out of scope.

## One structural observation, not a refactor

Mobile detects the waking central inside `diagnoseProblem`, so every mobile request — including
login — now turns a `503` with `Retry-After` into `CentralWakingError`, whereas the facility's
`whenCentralWakes` only applies at the two call sites that opt in. That placement is what makes the
axios path work at all, so it isn't something to "fix"; just worth knowing the blast radius differs
between the two clients.

## Coverage note

Mobile's `hasOutgoingChanges` (`utils/snapshotOutgoingChanges.ts:65-75`) has no direct test — it is
mocked at every use. Its facility twin `hasUnpushedChanges` got a real-database test on this branch.
`utils/snapshotOutgoingChanges.spec.ts` already runs against real models and would take one case
(a changed row, and a soft-deleted one, since `withDeleted` is the whole point of the shared query).
Flagging because candidate §5 and the shared `outgoingChangesQuery` both lean on behaviour nothing
currently asserts.
