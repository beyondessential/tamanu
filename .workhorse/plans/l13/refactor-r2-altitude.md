# Refactor round 2: altitude survey

Scope: `git diff 0f623d2ce6...HEAD -- packages`. Read-only survey; nothing edited.
Constraint throughout: behaviour, error messages and response bodies stay as they are.

Method: for each area, estimate what a from-scratch implementation by someone who knew the whole
behaviour and the surrounding code would take, compare with what is there, and name what the gap is.

## Summary

Product code (~250 net lines) is at or within a few lines of its floor in all three runtimes. The
tests (~670 net lines) are where the gap is, and it is modest: about 70 lines across two files,
all from tests that pin one outcome in two or three places. Nothing here changes a seam in the
surrounding code; two seams are noted as out-of-branch options.

| Area | Lines now | Floor estimate | Gap | Verdict |
| --- | --- | --- | --- | --- |
| Central route (`changesPending.js`, `getHighestRealChangeTick.js`, route) | 67 | ~60 | ~7 | at floor |
| Central test (`changesPending.test.js`) | 149 | ~130 | ~15-20 | near floor; one helper swap |
| Facility flow (connection, manager, `hasUnpushedChanges`, snapshot query) | ~95 added | ~85 | ~8 | at floor; one optional fold |
| Facility `FacilitySyncManager.test.js` check block | 143 | ~100 | ~35-40 | candidate |
| Facility `hasUnpushedChanges.test.js` | 77 | ~70 | ~5 | at floor |
| Facility `CentralServerConnection.test.js` new block | 76 | ~65 | ~10 | near floor |
| Mobile flow (connection, manager, `hasOutgoingChanges`) | ~120 added | ~110 | ~10 | at floor |
| Mobile `CentralServerConnection.test.ts` new blocks | 79 | ~70 | ~7 | near floor |
| Mobile `MobileSyncManager.test.ts` check block | 142 | ~110 | ~25-30 | candidate |

---

## Central route

**Files:** `packages/central-server/app/sync/changesPending.js` (37),
`packages/central-server/app/sync/getHighestRealChangeTick.js` (25),
`packages/central-server/app/sync/buildSyncRoutes.js` (+5).

**From-scratch:** a zod query schema and a 12-line handler, plus a 10-line query function. That is
what is there. The handler's `safeParse` + `InvalidParameterError(issues[0].message)` path is 4
lines longer than the `.parse(req.body)` the sibling routes use, but swapping it would change the
error body (the branch deliberately kept the schema's own message), so it stays.
`getHighestRealChangeTick` is 12 lines of code under 13 of comment; it is a separate module because
it gains a caller in a later phase. Inlining the handler into `buildSyncRoutes.js` beside the other
routes would save the module header (~6 lines) at the cost of growing an already long file; not
worth it.

**Verdict: at floor.**

## Central test: `__tests__/sync/changesPending.test.js` (149)

What it pins: the tick function's three facts (empty, flag/stub filtering, moves only on a real
change), and the route's table of six cursor/tick answers, lookup-table-off, no token, non-integer
cursor. All of that is spec text; none is padding. The `it.each` table and the integration case
through `updateLookupTable`/`tickTockGlobalClock` are the right shape.

Two places above floor:

1. **`addLookupRow` is a 14-line raw `INSERT`** because the lookup table's id is a serial. The
   sibling `snapshotOutgoingChanges.syncLookup.test.js` solves the same problem with
   `models.SyncLookup.bulkCreate([fake(models.SyncLookup, { id: 1, ... })])`, passing integer ids.
   A `create({ id: nextId++, recordId, recordType: 'patients', data, updatedAtSyncTick, isLabRequest: false, isDeleted: false })`
   helper is ~7 lines. **Saves ~7. Risk: none (the sibling already does it). Coverage: unchanged.**
2. **`login` helper (8 lines)** is the same inline sync-client login that `facilityBootstrap`,
   `syncFacilityAccess`, `SyncQueuedDevice`, `gzippedPush` and `syncCredentials` each carry. A
   `baseApp.asSyncClient(user, deviceId)` in `__tests__/utilities` would cut ~8 lines from each.
   **Out-of-branch seam**; worth doing only as its own tidy across those six files, not on this card.

Coverage note (not a refactor): the spec says the check needs a device registered with the sync
client scope; the test pins "no token" but not "token without the sync-client scope". The router
middleware enforces it for every sync route and no existing sync test pins that either, so this is
a gap of the router's, not this route's.

**Verdict: near floor; candidate 1 is a small, safe swap.**

---

## Facility flow

**Files:** `CentralServerConnection.js` (+28), `FacilitySyncManager.js` (+43/−9),
`hasUnpushedChanges.js` (16), `snapshotOutgoingChanges.js` (+8/−6), `convergeSyncUser.js` (+3 comment).

**From-scratch:**
- Connection: one `whenCentralWakes(fallback)` catch-handler used by the check and the session
  start, and a 10-line `checkChangesPending`. That is what is there. Mapping the 503+Retry-After to
  an error class inside the `fetch()` override (as mobile does in `diagnoseProblem`) would be the
  same line count, so no gain.
- Manager: a 12-line guarded block before the session start, and one shared tail. The
  `Number(pullSince) === -1 ? undefined : ...` dance exists because `pullSince` is a string from
  `LocalSystemFact.get` or the number `-1`; moving the mapping into `checkChangesPending` just
  moves two lines. Normalising `pullSince` to a number at the read would also change what
  `startSyncSession` sends as `lastSyncedTick` (string → number), so it is out of bounds here.
- `completeSync` / `provisionFromCentral` are two methods where one would do: the split names the
  old tail of the session path. Folding the two try/catch blocks into `completeSync` is ~6 lines
  shorter and reads the same. **Optional. Risk: none. Coverage: "still pulls the settings PSK when
  there is nothing to pull" and the provisioning block cover both paths.**
- `hasUnpushedChanges` + the exported `outgoingChangesQuery`: net +5 lines over inlining the where
  clause twice, bought for the guarantee that the probe selects exactly what the push selects. A
  from-scratch author would buy the same.

**Verdict: at floor, with one optional 6-line fold.**

## Facility test: `__tests__/sync/FacilitySyncManager.test.js`, changes-pending block (143)

Pre-existing blocks: the hoisted `makeSyncManager` now defaults to `hasUnpushedChanges → false`
and `checkChangesPending → true`, so every "sync run history" test already runs *through* the
check and opens a session. That matters below: "a scheduled sync with changes to pull opens a
session and records it" is already pinned by `records a successful run with its session and
trigger`.

Above floor:

1. **`records the run as succeeded, with no session` + `moves the last successful sync time but
   not the pull cursor`** share one arrangement (check → false, scheduled) and assert on one run.
   One test with both assertion groups. **Saves ~8.**
2. **`sends the pull cursor with the check, and opens a session`** asserts (a) the cursor is passed
   as `50`, (b) a session opens, (c) the run records the session. (b) and (c) are the history
   block's first test. (a) belongs in the `it.each` beside it, which already has the `null` and
   `'-1'` rows: add `['has a pull cursor', '50', 50]` and drop the standalone test. **Saves ~10.**
3. **`pskSpy` in `beforeEach`/`afterEach`** (5 lines) serves one test (`still pulls the settings
   PSK`), which needs `get → null`. Every other test in the block tolerates the real
   `LocalSystemSecret.get` the way the history block already does (`fetch → {}` → warn). Move the
   spy into that one test. **Saves ~4.** (Keep a spy rather than relying on DB state: a stored
   secret would need the key file to decrypt.)
4. `expect(syncRun.completedAt).toBeInstanceOf(Date)` in the nothing-to-pull and failed-check
   tests re-pins what `SyncFacilityRun.complete` does, already covered in the history block.
   **Saves ~2.**

Everything else — the four-reason `it.each`, `expectSessionWithoutCheck`, the failed-check test
with no session and `lastCompletedAt` unmoved — is one behaviour each and the right size.

**Candidate: ~25 lines saved, no coverage lost. Risk: low; vitest only.**

## Facility test: `__tests__/sync/hasUnpushedChanges.test.js` (77)

Four DB-backed tests; the ~20 lines of save/restore (push cursor, sync tick, created rows) are the
cost of running against the shared test database without a transaction wrapper, and the comment
on why rows are removed is earned. `reads a missing push cursor as -1` is the first test with
`null` for the cursor; an `it.each` over the two cursors would save ~5 lines but hides the
arrangement order that the second and third tests depend on. **At floor.**

## Facility test: `__tests__/sync/CentralServerConnection.test.js`, new block (76)

The hoist of `fetch`/`centralServer` to the describe level is right and costs +2. The block's
`waking(retryAfter)` and `requestCalls()` helpers are the minimum. Two tests could go into one
`it.each` (`asks central for changes since the pull cursor` / `leaves the cursor out`), saving ~4.
`does not treat other failures as waking` (500) pins that a non-503 rethrows; the 503-without-header
rows already pin the rethrow path through the same `.catch`, so this adds a status, not a branch.
Dropping it saves ~6 but the 500-through-Problem path is cheap to keep. **Near floor; leave.**

---

## Mobile flow

**Files:** `CentralServerConnection.ts` (+45), `MobileSyncManager.ts` (+51),
`utils/snapshotOutgoingChanges.ts` (+28/−5), `BackendManager.ts` (1).

**From-scratch:**
- Connection: `diagnoseProblem` is the one place axios errors become domain errors, so the
  503+Retry-After → `CentralWakingError` mapping belongs there, and `whenCentralWakes` is then a
  5-line instanceof check. The class is 8 lines because it is exported and named for a test's
  `not.toBeInstanceOf`. `checkForChangesToPull` is the 10-line twin of the facility's. Floor.
- Manager: the check block, `hasLocalWorkToSync` (12) and `recordSyncWithNothingToPull` (9).
  The second exists because mobile's "last synced" is two things — the in-memory
  `lastSuccessfulSyncTime` the sync screen reads and the `LAST_SUCCESSFUL_PULL` fact's `updatedAt`
  that `PatientSyncStatus` reads — and the query-builder `update` is the only way to touch the
  second without the model's sync-tick bookkeeping. Both are earned.
  `pushOutgoingChanges` repeats `getSyncTick(LAST_SUCCESSFUL_PUSH)` + `getModelsForDirection`
  (2 lines) and `pullIncomingChanges` repeats the `tablesForFullResync` `findOne` (4 lines);
  helpers for either would be net zero.
- `hasOutgoingChanges` + `outgoingChangesQuery`: same trade as the facility, same answer.

Do not merge the two runtimes' `whenCentralWakes`/check methods: different HTTP clients, different
error shapes, different reasons to change.

**Verdict: at floor.**

## Mobile test: `CentralServerConnection.test.ts`, new blocks (79)

The URI `it.each` with `actualAxios.getUri` pins what central receives in two rows, which is the
right altitude. `fails when central cannot be reached` (7 lines) pins that a non-waking rejection
passes through the `.catch`; the `does not treat a 503 … as central waking` rows pin the same path.
Dropping it saves ~7 but it is the only test of the check against a plain network failure, which
is what the spec's "cannot reach central" sentence is about. **Near floor; leave.**

## Mobile test: `MobileSyncManager.test.ts`, changes-pending block (142)

The 25-line `beforeEach` (stub models, four spies) is the price of a manager that reaches into
`this.models` and the connection; fine.

Above floor:

1. **Three tests pin one outcome, "a scheduled sync with nothing to pull":**
   `checks with the pull cursor, and opens no session` (assert check arg, no session, no keep-awake),
   `moves the displayed last synced time … but not the pull cursor` (assert in-memory time, fact
   update, no setSyncTick, no pull), and `emits success for a sync with nothing to pull` (assert
   emitter, `isSyncing` reset). Same arrangement in all three (the `beforeEach` default of
   check → false). One test driven through `triggerSync`, with the three assertion groups, says
   the same. **Saves ~15.**
2. **`opens a session without checking when there are outgoing changes` /
   `… when tables are waiting for a full resync`** are one behaviour with two triggers; an
   `it.each` over `[['outgoing changes', () => hasOutgoingChanges.mockResolvedValue(true)], ['tables waiting for a full resync', () => findFact.mockResolvedValue({...})]]`
   keeps the `findFact` call assertion in the second row. **Saves ~5.**
3. `opens a session when there are changes to pull` asserts `startSyncSession` called with the
   cursor and `pullIncomingChanges` once; the existing `runSync()` block pins session → push → pull
   ordering for an unscheduled sync. Keep — it is the only test that a *scheduled* sync with
   changes still opens a session — but drop the `pullIncomingChanges` count (−1).

**Candidate: ~20 lines saved, no coverage lost. Risk: low; jest only.**

Coverage note (not a refactor, adds lines): mobile's `hasOutgoingChanges` has no DB-backed test —
the manager test mocks it — while the facility's `hasUnpushedChanges` has four. A soft-delete row
case in `utils/snapshotOutgoingChanges.spec.ts` (which already runs against the real database)
would be ~10 lines and is the one that matters, since `withDeleted: true` is what the shared query
is there to guarantee.

---

## Seams in the surrounding code

Neither of these is for this card; both are noted because they would make this code smaller if
they moved.

- **Facility `pullSince` is string-or-`-1`.** `LocalSystemFact.get` returns a string and the
  manager ORs in a number; every consumer (`startSyncSession`, the check, `hasUnpushedChanges`'
  twin `pushSince`) copes. Reading the cursor as a number once would drop the `Number()` and the
  `=== -1` mapping, but changes the `lastSyncedTick` wire value from a string to a number, so it
  is a behaviour change by the brief's rule.
- **Central test sync-client login.** Six test files each hand-roll the login with
  `scopes: [DEVICE_SCOPES.SYNC_CLIENT]`; a utilities helper would cut ~8 lines from each,
  including this branch's.

## Code shaped by the order it was written

Little. `completeSync`/`provisionFromCentral` is the one visible seam: the session path's
`completedSession` log sits after `completeSync` rather than inside it because the no-session
path logs `upToDate` instead, which is deliberate, but the two-method split is the old tail
keeping its name. The `pskSpy` in the facility test's `beforeEach` reads as added for the one
test that needed it and then left on for all.

## Candidates, ranked

| # | Files | Replacement | Saves | Risk | Coverage |
| --- | --- | --- | --- | --- | --- |
| 1 | `facility-server/__tests__/sync/FacilitySyncManager.test.js` | Merge the two nothing-to-pull tests; move the `'50' → 50` row into the cursor `it.each` and drop the standalone test; per-test PSK spy; drop two `completedAt` re-assertions | ~25 | low | unchanged |
| 2 | `mobile/App/services/sync/MobileSyncManager.test.ts` | One nothing-to-pull test through `triggerSync` with the three assertion groups; `it.each` over the two local-work triggers | ~20 | low | unchanged |
| 3 | `central-server/__tests__/sync/changesPending.test.js` | `SyncLookup.create` with an integer id in place of the raw `INSERT` helper | ~7 | none | unchanged |
| 4 | `facility-server/app/sync/FacilitySyncManager.js` | Fold `provisionFromCentral` into `completeSync` | ~6 | none | unchanged |

Everything else surveyed is at its floor under the no-behaviour-change constraint.
