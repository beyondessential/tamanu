# Refactor survey r1: altitude and structure

Scope: `git diff 0f623d2ce6...HEAD -- packages`. Product +299 −25 across 13 files; tests +745 −1 across 6 files. Spec: `specs/sync/changes-pending-check.md` (SYNCHK). Read-only survey; nothing edited.

Line counts below are the diff's added lines for the area, comments included. "From scratch" is what someone who knew SYNCHK and the surrounding code would write for the same behaviour, in the same files.

## Summary

The product code is close to its floor. The three areas are shaped by the spec rather than by the order they were written in; the earlier slimming removed the pluggable source, the extra run status and the per-sync reason object, and what is left maps one-to-one onto SYNCHK's bullets. The seams chosen in the surrounding code (the two extracted methods on the facility manager, the `.catch` mappings on both connections, the 503 detection inside mobile's `diagnoseProblem`) are each at the right altitude, and for a reason that differs between runtimes (see Lens B).

What is worth doing, in order of value:

| # | Candidate | Files | Net lines | Risk | Tests |
| --- | --- | --- | --- | --- | --- |
| 1 | Mobile: read `Retry-After` through `AxiosHeaders.get` only; drop the plain-object branch | mobile `CentralServerConnection.ts`, its test | −6 product, 0 test | none at runtime | covered |
| 2 | `FacilitySyncManager.test.js`: mock `hasUnpushedChanges` in the new block instead of driving it through the test database | facility `FacilitySyncManager.test.js` | −20 test | none to product | moves coverage, does not lose it |
| 3 | `changesPending.test.js`: drop the two route-level cases that repeat the function-level filtering cases | central `changesPending.test.js` | −15 test | none | n/a |
| 4 | Central: `SyncLookup.max()` in place of the raw query | central `getHighestRealChangeTick.js` | −8 product | low, but needs `EXPLAIN` re-run | result covered, plan not |
| 5 | Facility: trim `isCentralWaking` to `error.status` and a plain `headers.get` | facility `CentralServerConnection.js` | −1 product | none | covered |

Total if all taken: about −15 product, −35 test. Nothing larger is there to take without changing the wire contract (see "Not recommended" at the end).

---

## Lens A: altitude, per area

### Central route (+72: `changesPending.js` 38, `getHighestRealChangeTick.js` 28, `buildSyncRoutes.js` 6)

From scratch: ~55 lines in the same two files. The gap is the raw SQL block and its planning comment (candidate 4), and about 8 lines of comment that restate the code (`// bigint columns come back as strings` earns its place; `// Read per request, so a config override applies` does not, as the test is what needs it and the test shows it).

Two files for 66 lines looks fine-grained, but `getHighestRealChangeTick` is the value the supervisor holds at sleep (`specs/platform/supervisor/serving-while-asleep.md#changes-pending-check`), so it will have a second caller in phase 5. Keep the split.

`safeParse` + `InvalidParameterError` (6 lines) rather than `.parse` (1 line): commit `769e11e720` records that a bare `.parse` came back as a 500 through the central error handler, so the longer form is load-bearing. Not a candidate.

`highestRealChangeTick !== null &&` is load-bearing too: the schema accepts a negative `since`, and `null > -1` is `true` in JS.

Reading `CentralSyncManager.config` rather than `config` directly: the test config turns the lookup table off, so the handler has to read through the one override point the sync tests already use. Right as is.

### Facility flow (+92 net: `FacilitySyncManager.js` +37, `CentralServerConnection.js` +26, `hasUnpushedChanges.js` 20, `snapshotOutgoingChanges.js` +4, `index.js` +1, `convergeSyncUser.js` +4 comment)

From scratch: ~85. The 14-line check block sits exactly where SYNCHK puts it (after bootstrap, before session start, scheduled-only, skipped when there is anything to push), and the two exits both need provisioning and the completed-time bump, which is what the two extracted methods give. I tried the alternative seam of provisioning in `runSync` keyed on `result.ran` (with `this.currentStartTime` already on the instance, `markSyncCompleted` needs no argument): it saves one line and moves provisioning further from the session it belongs to. Not worth it.

`markSyncCompleted` returning `durationMs` for one log line is a small smell, but folding the log in would either emit `completedSession` for the no-session path too or need a parameter. Leave.

`hasUnpushedChanges` (20 lines) and the `outgoingChangesQuery` export it shares with the snapshot are at their floor. The `index.js` re-export is for the phase-5 supervisor, as noted.

The `convergeSyncUser.js` comment is unrelated to the card; it is a retirement note and fine.

### Mobile flow (+124 net: `CentralServerConnection.ts` +50, `MobileSyncManager.ts` +49, `utils/snapshotOutgoingChanges.ts` +25, `BackendManager.ts` 0)

From scratch: ~110. The gap is candidate 1 and doc comments. `hasLocalWorkToSync` (10 lines), `recordSyncWithNothingToPull` (6) and the 12-line check block are the mobile side of the same spec bullets and are as small as they go. `hasOutgoingChanges` mirrors the facility's `hasUnpushedChanges` one-for-one, which is right: TypeORM `findOne`/`select` against Sequelize `findOne`/`attributes`, and the two live in different runtimes.

`CentralWakingError` as a class (8 lines) where the facility has an inline predicate: not a mismatch to fix. Mobile needs an error that `callWithBackoff` will not retry, and `isRecoverable` says a non-`BaseError` is irrecoverable, so a plain `Error` subclass is the smallest thing that stops the retry. The facility's backoff loop only retries transport failures (`fetchOrThrowIfUnavailable` returns a 503 as a response), so its predicate can sit outside the loop.

### Tests

| File | Added | From scratch | Gap |
| --- | --- | --- | --- |
| central `changesPending.test.js` | 174 | ~155 | candidate 3; the `login` helper repeats the one in `facilityBootstrap.test.js` and `syncFacilityAccess.test.js`, which is the local convention, so not a candidate |
| facility `FacilitySyncManager.test.js` | +190 | ~165 | candidate 2 |
| facility `hasUnpushedChanges.test.js` | 84 | ~80 | at its floor; the clock save/restore is what makes it safe to run beside the other DB tests |
| facility `CentralServerConnection.test.js` | +87 | ~85 | at its floor |
| mobile `CentralServerConnection.test.ts` | +72 | ~70 | `wakingResponse` changes shape with candidate 1, same length |
| mobile `MobileSyncManager.test.ts` | +139 | ~135 | at its floor; the 25-line `beforeEach` is what the nine cases share |

---

## Lens B: structure

**Layers that only pass values through.** `triggerSync(options)` → `runSync(options)` on mobile was already a pass-through; the branch only widened the type. Both connections' `checkChangesPending`/`checkForChangesToPull` are thin by design: they own the wire shape (`since` present or absent) and the one answer check, which SYNCHK makes the client's job ("cannot read its answer, treats it as a failed sync"). Nothing to remove.

**State held in two places.** Mobile's "last synced" time lives both in `lastSuccessfulSyncTime` (memory) and `LAST_SUCCESSFUL_PULL.updatedAt` (database, read by `PatientSyncStatus`). That duality predates the card: the session path sets the memory field and the pull path's `save` bumps `updatedAt`. `recordSyncWithNothingToPull` writes both, as it must. Not the card's to fix.

**Options, params and branches nothing uses.** None found. `scheduled` has one producer (`BackendManager`) and one consumer. `markSyncCompleted`'s return value has one reader. The plain-object branch in mobile's `readRetryAfterHeader` is the one branch with no runtime caller (candidate 1).

**Defensive handling of impossible states.**
- Mobile `readRetryAfterHeader`'s `headers['retry-after']` branch: axios 1.x normalises `response.headers` through `AxiosHeaders.from` in `dispatchRequest` on both the success and the rejection path, so a plain object never reaches `diagnoseProblem`. The branch exists for the test's hand-built rejection. Candidate 1.
- Facility `isCentralWaking`'s `headers?.get?.(…)`: `Problem.response` is always a `Response` when set. Candidate 5.
- `typeof answer?.changesToPull !== 'boolean'` on both sides: a system boundary and a spec bullet. Keep.

**Modules split too finely or merged too broadly.** Central's two files and the facility's `hasUnpushedChanges.js` each have a second caller coming in phase 5. Mobile keeps everything in the existing files, which is right for a runtime with no planned second caller.

**Do the surrounding-code seams sit at the right altitude?**
- `provisionFromCentral` / `markSyncCompleted` extraction: yes. Both exits of `runSyncSession` need both, and the alternative (do it in `runSync`) saves one line and loses locality.
- `.catch` mappings in both connections: yes. They turn a waking central into the queued path the managers already have (`{ status }` with no `sessionId` → `{ queued: true, ran: false }` / `SYNC_IN_QUEUE`), so the managers needed no new branch. The plan defers a shared `TamanuApi.whileServerWakes` to phase 5; when that lands, the facility's `isCentralWaking` moves into it and the two `.catch`es shrink to one option. Nothing to do now.
- 503 detection inside mobile `diagnoseProblem`: yes, and forced. It has to run inside `callWithBackoff`'s callback so the thrown error is the irrecoverable kind; outside it, a `Problem` with status 503 is "recoverable" and would be retried up to 15 times with waits up to 10 s before the `.catch` saw it. The different seam from the facility is a consequence of the different retry loop, not drift.

---

## Candidates in detail

### 1. Mobile: read `Retry-After` through `AxiosHeaders.get` only

Files: `packages/mobile/App/services/sync/CentralServerConnection.ts`, `packages/mobile/App/services/sync/CentralServerConnection.test.ts`.

Replace `readRetryAfterHeader` (5 lines) and the two-line condition with one predicate matching the facility's:

```ts
const isCentralWaking = (err: AxiosError) =>
  err.response?.status === 503 && Boolean(err.response.headers?.get('retry-after')?.trim());
```

and `if (isCentralWaking(err)) return new CentralWakingError();` in `diagnoseProblem`. `AxiosHeaders.get` returns the raw string for an unparsed header, so the `typeof === 'string'` check goes too.

Test: `wakingResponse` builds `headers: { get: () => retryAfter }` (or `new AxiosHeaders(...)`, but the file auto-mocks `axios`, so a function is simpler). Same length.

Net: −6 product, 0 test. Risk: none; `dispatchRequest.js` lines 62 and 82 normalise headers on both paths in the pinned axios. Covered by the "waking central" describe.

### 2. `FacilitySyncManager.test.js`: mock `hasUnpushedChanges`

File: `packages/facility-server/__tests__/sync/FacilitySyncManager.test.js`.

The new block drives `hasUnpushedChanges` through the real database: `markEverythingPushed` in `beforeEach`, three facts saved and restored around every test, and a `fakeReferenceData` row with a `try/finally` to make one case say "there are changes to push". `hasUnpushedChanges.test.js` already covers that function against the database. A `vi.mock('../../app/sync/hasUnpushedChanges')` with `mockResolvedValue(false)` by default and `true` in the one case drops `markEverythingPushed`, the push-cursor and clock save/restore, and the row-plus-finally (about 25 lines) for 5 lines of mock setup.

It also surfaces a coupling the current file hides: the "sync run history" block calls `triggerSync({ type: 'scheduled' })` with a fake `centralServer` that has no `checkChangesPending`, and passes only because the test database holds pushable rows above an unset push cursor. With the mock in place, that block's `beforeEach` says `hasUnpushedChanges.mockResolvedValue(true)` (or its factory gains `checkChangesPending: async () => true`) and the dependence is written down.

Check first: the "pushChanges" block further down uses `vi.resetModules()`, so confirm the module mock survives it (a top-level `vi.mock` is hoisted and persists across `resetModules`; a `vi.doMock` would not).

Net: about −20 test. Risk: none to product. Coverage of `hasUnpushedChanges` stays in its own file; the manager tests then test only what the manager does with the answer.

### 3. `changesPending.test.js`: drop two repeated route cases

File: `packages/central-server/__tests__/sync/changesPending.test.js`.

"answers that there is nothing to pull when the lookup table is empty" and "does not count pending-update flags and stubs as changes" at the route level restate the function-level cases "is null when the lookup table holds nothing" and "is the highest settled tick, ignoring pending-update flags and stubs", with the only route-specific fact (`null` tick → `false`) already exercised by the comparison tests. Keep the function-level ones.

The `beforeEach` `overrideConfig(withLookupTable(true))` looks defensive but is required: `config/test.json5` turns the lookup table off.

Net: −15 test. Risk: none.

### 4. Central: `SyncLookup.max()` in place of the raw query

File: `packages/central-server/app/sync/getHighestRealChangeTick.js`.

```js
export const getHighestRealChangeTick = models =>
  models.SyncLookup.max('updatedAtSyncTick', {
    where: { updatedAtSyncTick: { [Op.gt]: 0 }, data: { [Op.ne]: null } },
  });
```

Sequelize's `rawSelect` parses a `BIGINT` aggregate with `parseInt`, so the `Number(row.tick)` and the `// bigint columns come back as strings` note go, as does the `QueryTypes` import. Postgres rewrites a bare `max()` over an indexed column to the same backward index step with the `WHERE` as quals, so the plan should match, but the plan ledger says the current form was confirmed with `EXPLAIN`, and this one would need the same before it is taken; the planning comment should stay in either form.

Net: −8 product. Risk: low, gated on the `EXPLAIN`. The result is covered by three tests; the plan is not covered by any.

### 5. Facility: trim `isCentralWaking`

File: `packages/facility-server/app/sync/CentralServerConnection.js`.

```js
const isCentralWaking = error =>
  error?.status === 503 && Boolean(error.response?.headers.get('retry-after')?.trim());
```

`Problem.status` is the response status, and `Problem.response` is a `Response`. Net: −1, and the predicate then reads the same as mobile's after candidate 1. Covered by the "waking central" describe.

---

## Already at its floor

- `packages/central-server/app/sync/changesPending.js` and the route registration.
- `packages/facility-server/app/sync/FacilitySyncManager.js` check block and both extracted methods.
- `packages/facility-server/app/sync/hasUnpushedChanges.js` and the `outgoingChangesQuery` share.
- Both connections' `.catch` mappings and the check methods.
- `packages/mobile/App/services/sync/MobileSyncManager.ts`: `hasLocalWorkToSync`, `recordSyncWithNothingToPull`, the check block, the `scheduled` option.
- `packages/mobile/App/services/sync/utils/snapshotOutgoingChanges.ts`: `outgoingChangesQuery` and `hasOutgoingChanges`.
- `hasUnpushedChanges.test.js`, both `CentralServerConnection` tests, `MobileSyncManager.test.ts`.

## Not recommended: the never-pulled marker

The same "never pulled" fact is expressed four times: `pullCursor === -1 ? undefined : pullCursor` on the facility, `this.isInitialSync ? undefined : pullSince` on mobile, `since === undefined ? {} : { since }` in both connections, and `hasNeverPulled` on central, with a test for each. Sending `-1` on the wire as the marker (SYNCHK says "a marker that it has never pulled" without fixing its form; `startSyncSession` already sends `lastSyncedTick: -1`) and having central read `since < 0` as never pulled would remove all of them, about −8 product and −30 test. It is a wire-contract change that the phase-5 supervisor would then mirror, so it is a design call for the card's owner, not a behaviour-preserving refactor, and this survey does not propose it.
