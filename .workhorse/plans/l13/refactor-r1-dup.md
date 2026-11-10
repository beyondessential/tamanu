# Refactor round 1: duplication, reuse, dead weight, comments

Scope: `git diff 0f623d2ce6...HEAD -- packages`. Read only; nothing edited.
Line numbers are at HEAD.

## Candidates

Ranked by value. "Saved" is net lines.

### Product code

**P1. Use `querySchema.parse` and drop the hand-rolled 400** (reuse)
- `packages/central-server/app/sync/changesPending.js:21-26`
- Replace with `const { since } = querySchema.parse(req.query);`, and drop the `InvalidParameterError` import and the comment.
  `Problem.fromError` already maps a `$ZodError` to a `ValidationError` (400). A `ZodError` from central's zod is `instanceof $ZodError`: I checked this with node in `packages/central-server`.
  Sibling routes in `buildSyncRoutes.js` (lines 166-167 and 395) already rely on this.
- Saved: about 6 lines.
- Risk: the status stays 400, but the problem type goes from `validation-parameter` to `validation`, and the detail becomes zod's message. No client reads either.
  Commit 769e11e720 says a bare ZodError came back as a 500. That doesn't match the error path today, so run the test to confirm before you rely on it.
- Tests: `changesPending.test.js:168` ("rejects a cursor that is not an integer") covers this.

**P2. Fold the shared tail of `runSyncSession`** (duplication)
- `packages/facility-server/app/sync/FacilitySyncManager.js:207-212` and `258-263`. Both paths run `provisionFromCentral()`, then `markSyncCompleted(startTime)`, then return `{ queued: false, ran: true }`.
- Replace `markSyncCompleted` (`266-271`) with `async completeSync(startTime)`. It provisions, sets `lastDurationMs` and `lastCompletedAt`, and returns the result object.
  The session path logs `completedSession` with `this.lastDurationMs` and returns.
  The no-session path becomes `log.info(...upToDate...); return this.completeSync(startTime);`.
- Saved: about 4 lines. It also drops the return value that `markSyncCompleted` only has to feed one log line.
- Risk: none. The ordering is the same: duration is measured after provisioning in both paths today.
- Tests: the changes-pending block (`FacilitySyncManager.test.js:447-475`, `563-573`) and "provisioning that needs central" cover it.

**P3. One "waking, so fall back" catch per platform** (duplication)
- Facility `CentralServerConnection.js:139-143` and `160-164`. Mobile `CentralServerConnection.ts:237-243` and `264-268`.
  Each is `.catch(error => { if (!waking(error)) throw error; return FALLBACK; })`.
- Replace with `const whenCentralWakes = fallback => error => { if (!isCentralWaking(error)) throw error; return fallback; };` and `.catch(whenCentralWakes({ changesToPull: true }))`. Keep the per-call reason comments, because the two fallbacks exist for different reasons.
  On mobile, the guard is `instanceof CentralWakingError`.
- Saved: about 2 lines per platform. This is mostly about stating the rule once per file.
- Risk: none.
- Tests: both connection test files cover both call sites.
- The facility and mobile versions can't share code: different HTTP clients, and mobile doesn't use `@tamanu/api-client`. Keep them apart.

**P4. Read `retry-after` by key on mobile** (dead weight)
- `packages/mobile/App/services/sync/CentralServerConnection.ts:47-51`, used at `56`.
- Replace with `const retryAfter = err.response?.headers?.['retry-after'];` and delete `readRetryAfterHeader`.
  Axios 1.18's XHR adapter builds `AxiosHeaders` from `parseHeaders`, which lower-cases keys and stores them as own properties. So bracket access works on both the plain-object and the `AxiosHeaders` shape.
- Saved: 5 lines.
- Risk: low. The tests only cover the plain-object shape; the `AxiosHeaders` path relies on axios internals.

**P5. Let the HTTP client drop an undefined `since`** (dead weight)
- Facility `CentralServerConnection.js:138` and mobile `CentralServerConnection.ts:236` both do `since === undefined ? {} : { since }`.
- Pass `{ since }` straight through: `qs.stringify` (api-client) and axios `params` both skip undefined values.
- Saved: 1 line each.
- Risk: none on the wire.
  The facility test (`CentralServerConnection.test.js:306`) still proves omission at the URL.
  The mobile test (`CentralServerConnection.test.ts:107`, `toHaveBeenCalledWith('sync/pending', {})`) still passes, because jest equality ignores undefined keys. It would then no longer prove omission.

**P6. Remove the unused `index.js` re-export** (dead weight)
- `packages/facility-server/app/sync/index.js:4` (`export * from './hasUnpushedChanges'`). Nothing imports `hasUnpushedChanges` through the index: `FacilitySyncManager` and the test import the file directly.
- Saved: 1 line. Risk: none.

**P7. Trim defensive chaining in `isCentralWaking`** (dead weight, nit)
- `packages/facility-server/app/sync/CentralServerConnection.js:16-17`.
  `error?.` can't be nullish: it is always a thrown Error.
  `headers?.get?.` can't miss either: a Problem's `response` is a fetch `Response`, which always has `Headers`.
  Only `response?.` is needed, because network errors carry no response.
- Becomes `error.response?.status === 503 && Boolean(error.response.headers.get('retry-after')?.trim())`.
- Saved: 0 lines.
- Risk: none. The test fakes provide `headers.get`.

**P8. Name the `tablesForFullResync` fact once** (duplication)
- `packages/mobile/App/services/sync/MobileSyncManager.ts:326` adds a third copy of the literal. The others are at `437` and `598`, which predate this branch.
- Add `TABLES_FOR_FULL_RESYNC` to `sync/constants.ts` beside `LAST_SUCCESSFUL_PULL`, and use it in all three places and in the test (`MobileSyncManager.test.ts:316`, `320`).
- Saved: 0 lines. Risk: none.

Considered and not worth doing:
- Replacing the raw SQL in `getHighestRealChangeTick` with `SyncLookup.max('updatedAtSyncTick', { where })`. Postgres would plan it the same way, and Sequelize's `rawSelect` parseInts a BIGINT. But the explicit `ORDER BY … LIMIT 1` is what the spec's "no table scan" rests on, and nothing else in the repo uses `Model.max`.
- Sharing one cursor reader for the `|| -1` read. It now appears in `hasUnpushedChanges.js:15` as well as three places on main. The new copy has to match push's read exactly, and a helper would touch untouched code for 0 lines saved.
- Making mobile's `hasLocalWorkToSync` (`MobileSyncManager.ts:330-332`) and facility's `hasUnpushedChanges` match. Each repeats the two lines its own push uses to find the cursor and the models. They already have the same shape, so a merge saves nothing.
- The same job has different names per platform: `checkChangesPending` vs `checkForChangesToPull`, and `hasUnpushedChanges` vs `hasOutgoingChanges`. Renaming would align them but isn't a saving.

### Tests

**T1. Table the GET answers as `it.each`** (duplication)
- `packages/central-server/__tests__/sync/changesPending.test.js:123-150`: six cases across five `it`s, each one "seed rows, check with `since`, expect the flag".
- Replace with `it.each([[ 'never pulled', [5], undefined, true ], ['never pulled, empty', [], undefined, true], ['above the cursor', [50], 49, true], ['cursor reached', [50], 50, false], ['cursor past', [50], 80, false], ['empty', [], 0, false]])`, plus one `toHaveSucceeded`.
- Saved: about 15 lines.

**T2. Drop the route-level flags-and-stubs test** (duplication)
- `changesPending.test.js:152-158` seeds the same pending-update and stub fixtures as the unit test at `84-95`, and asserts the same filter through HTTP. The route's comparison is already covered by T1's "cursor reached" case.
- Saved: 7 lines. You lose an end-to-end check of the filter, but none of its logic.

**T3. Remove the unused facility in the central test** (dead weight)
- `changesPending.test.js:12` and `66`. `FACILITY_ID` is created and never used: the check takes no facility, and logging in a sync device doesn't need one.
- Saved: 2 lines. Run the test to confirm.

**T4. Share one `makeSyncManager` between "sync run history" and "changes-pending check"** (duplication)
- `packages/facility-server/__tests__/sync/FacilitySyncManager.test.js:221-240` and `398-420` are the same stub except for `checkChangesPending`, `user`, `startedAtTick` and `hasBootstrapped`.
  `latestSyncRun` (`243`, `422`) and the `SyncFacilityRun.destroy` beforeEach (`246`, `437`) are also duplicated.
- Hoist one factory to the outer describe, with `checkChangesPending: vi.fn(async () => true)` as the default. The changes-pending block's `beforeEach` overrides the default to `false`.
- Saved: about 22 lines.
- This also fixes a hidden dependency. The run-history tests trigger `{ type: 'scheduled' }` with no `checkChangesPending` stub. They only pass because the restored push cursor leaves `hasUnpushedChanges` true against the seeded DB.

**T5. Hoist the connection setup in the facility connection test** (duplication)
- `packages/facility-server/__tests__/sync/CentralServerConnection.test.js:278-288` repeats the `fetch` spy, the connection, the `fetchImplementation` and the reset/restore from `145-153`.
- Move both to the outer describe: its `beforeEach` at `80` already runs first, so `authSuccess` is set in time. Keep only `mockReturnValueOnce(authSuccess).mockReturnValueOnce(meSuccess)` in the new block.
- Saved: about 8 lines.

**T6. Drop the subsumed "nothing changed" case in `hasUnpushedChanges.test.js`** (duplication)
- `46-51` ("is false when nothing has changed") is strictly weaker than `70-76` ("is false … once the push cursor has caught up"), which does the same arrangement after also writing a row.
- Saved: 6 lines.
- The remaining tests repeat `const tick = await startNewTick(); await set(PUSH, String(tick - n))` four times. A `setPushCursorBehindClock(n)` helper would save about 4 more.

**T7. Table the first two connection-check tests** (duplication, optional)
- Mobile `CentralServerConnection.test.ts:92-108`: `[42, false, { since: 42 }]` and `[undefined, true, {}]`.
- Facility `CentralServerConnection.test.js:291-307` is similar, but only its first case asserts the pathname, so the table is less clean there.
- Saved: about 6 lines on mobile.
- The paired waking tests (mobile `133-147`, facility `316-330`) could also be tabled over `[call, expected]`, but passing a lambda in a table reads worse. Leave them.

**T8. Mobile test reuse** (reuse)
- `MobileSyncManager.test.ts:336`: import `setSyncTick` from `./utils` with the others at the top, instead of `jest.requireMock`.
- Lines `344`, `356-357` and `370-371` use string literals. Use `LAST_SUCCESSFUL_PULL` and `SYNC_EVENT_ACTIONS.SYNC_SUCCESS`/`SYNC_ERROR` instead; `'syncRecordError'` in particular reads like a different event.
- `353-382`: a `listenForOutcome()` helper returning `{ onSuccess, onError }` would remove the duplicated four lines.
- Saved: about 4 lines.

**T9. Nits**
- `FacilitySyncManager.test.js:389`: `SYNC_EMAIL` is used once (`407`), so inline it.
- `changesPending.test.js:25-33`: `login` is called once. It's fine as a helper; leave it.

Leave apart, even though they look alike:
- The facility tests "records the run as succeeded" (`448`), "moves the last successful sync time…" (`465`) and "still pulls the settings PSK…" (`563`) run the same scenario. Each asserts a different spec bullet, so they change for different reasons.
- Facility `markSyncCompleted` / mobile `recordSyncWithNothingToPull` and the session paths' own time updates. The session paths move the time through the pull's save. The no-session paths have to move it by hand, without touching the cursor.

## Comment verdicts

Product code:

| Where | Comment | Verdict |
| --- | --- | --- |
| `central-server/app/sync/buildSyncRoutes.js:55` | `// spec: SYNCHK#the-check` | keep |
| `buildSyncRoutes.js:56-57` | "ask whether anything has changed since the device's last pull, so it can skip opening a session. Defined before the /:sessionId routes, which would otherwise capture it." | **shorten** to `// lets a device with nothing to pull skip opening a session`. The second sentence is **wrong**: the router has no single-segment GET `/:sessionId` (every GET is `/:sessionId/<more>`; only DELETE is bare), so nothing could capture `/pending`. |
| `changesPending.js:9` | "The pull cursor is an integer tick; leaving it out means the device has never pulled." | keep: the meaning of an absent cursor isn't readable from the schema |
| `changesPending.js:18` | `// spec: SYNCHK#the-check` | keep |
| `changesPending.js:19` | "Answers whether anything that syncs to devices has changed since the device's last pull." | cut: the handler's name and the route comment already say it |
| `changesPending.js:21` | "a cursor we cannot read is the caller's mistake, so answer as one rather than erroring" | cut with P1. Without P1, its premise is doubtful: a plain `parse` already answers 400. |
| `changesPending.js:28` | "Without the lookup table there is no tick to compare against, so a session must decide." | keep: gives the reason |
| `changesPending.js:29` | "Read per request, so a config override applies." | cut: reading config in the handler is the default, and `CentralSyncManager.config` already signals the override |
| `getHighestRealChangeTick.js:3` | `// spec: SYNCHK#highest-real-change-tick` | keep |
| `getHighestRealChangeTick.js:5` | "The highest settled sync tick in the lookup table, or null when it holds none." | keep |
| `getHighestRealChangeTick.js:7-9` | "Ticks of zero or below are never real: … The data check is a second guard for stubs." | **shorten** to `// Ticks of 0 or below are stubs or SYNC_TICK_FLAGS, never real changes; a null data column marks a stub whatever its tick.` The current text says stubs carry tick 0 and the data check is a "second guard". The test (`changesPending.test.js:92`) has a stub with tick 9999, so the data check is a primary guard, not a second one. |
| `getHighestRealChangeTick.js:11-13` | "Planned as a single backward step through the index … not stepped over unless the table holds nothing real." | **shorten** to `// A backward walk of the updated_at_sync_tick index, so it does not scan the table.` "Stubs … sort below every real tick" is false for a high-tick stub, which the walk steps over. |
| `getHighestRealChangeTick.js:26` | "bigint columns come back as strings" | keep: it's the reason for `Number()` |
| `facility-server/app/sync/CentralServerConnection.js:13-15` | spec tag, then "A waking central answers 503 with a Retry-After. A 503 without one … is an ordinary failure." | keep, can shorten to `// Only a 503 with a Retry-After is a waking central; a bare 503 (overloaded central, empty proxy) is an ordinary failure.` |
| `CentralServerConnection.js:134-136` | spec tag, then "Asks central whether anything that syncs has changed since the tick our last pull reached. Leave `since` undefined when we have never pulled." | **shorten** to the spec tag plus `// since: the tick our last pull reached, or undefined if we have never pulled`. The first sentence restates the method name. |
| `CentralServerConnection.js:140` | "a waking central cannot say, so leave it to the session start, which waits in line" | keep: gives the reason |
| `CentralServerConnection.js:161` | "a waking central cannot start a session yet, so wait in line as a queued sync does" | keep: explains why a status with no `sessionId` is returned |
| `FacilitySyncManager.js:198-200` | spec tag, then "Only a scheduled sync asks central first, and only when there is nothing to push, which a session is needed for whatever central answers." | **shorten**, as the grammar is tangled: `// Only a scheduled sync with nothing to push asks first: a push needs a session whatever central answers.` |
| `FacilitySyncManager.js:202` | `// spec: SYNCHK#the-check` | keep |
| `FacilitySyncManager.js:266-267` | "Moves the facility's last successful sync time, which monitoring and the sync status read. Deliberately not the pull cursor: that moves only when a session pulls." | **shorten** to `// The last successful sync time the sync status reports; deliberately not the pull cursor, which only a session's pull moves.` With P2, move it to `completeSync`. |
| `FacilitySyncManager.js:274-275` | "Runs after every sync that reached central, whether or not it needed a session, so a facility whose syncs keep finding nothing to pull still converges." | **shorten/fix**: a queued sync also reaches central and doesn't provision. Use `// Runs after every successful sync, with or without a session, so a facility whose syncs find nothing to pull still converges.` |
| `convergeSyncUser.js:17-20` | "Added in v2.62. Retire this once no deployment has a facility server older than that, or one that has not synced since upgrading past it: until then such a facility would never be served the settings PSK." | keep. It's accurate (9412a4f897 is first in `release/2.62`) and it's a reason. It can shorten to `// Added in v2.62. Retire it once every facility server has synced on v2.62 or later; until then one that has not is never served the settings PSK.` |
| `snapshotOutgoingChanges.js:8-9` (facility) | "The rows a push sends: every row of a model changed since the last successful push, deleted ones included. Shared with `hasUnpushedChanges`, which must select the same rows." | **shorten** to `// Shared with hasUnpushedChanges, which must select exactly the rows a push sends (deleted ones included).` The first clause restates the object. |
| `hasUnpushedChanges.js:6-12` | JSDoc: "Whether the facility has any local change that the next sync would push: … It selects with the same query as `snapshotOutgoingChanges`, but stops at the first hit rather than reading them all. spec: SYNCHK#facility-servers" | **shorten** to `/** Whether the next sync would push anything; reads only until the first row. spec: SYNCHK#facility-servers */`. The "same query" point is already made where the query is defined. |
| `mobile/App/services/sync/MobileSyncManager.ts:49-52` | `scheduled` JSDoc: "The periodic background sync, the only one that asks central … (spec: SYNCHK#mobile-devices)" | keep |
| `MobileSyncManager.ts:256` | `// spec: SYNCHK#mobile-devices` | keep |
| `MobileSyncManager.ts:257` | "a failed check throws, which fails the sync just as a failed session start does" | keep. It records a decision that flipped during review (a2d2939380, then 259df4ffa6), so it guards against bringing back a fallback. Can shorten to `// a failed check fails the sync, as a failed session start does` |
| `MobileSyncManager.ts:320-323` | `hasLocalWorkToSync` JSDoc: "… records to push, or tables that a pull must fully resync after an app upgrade. The check cannot see either." | keep: the last sentence is the reason |
| `MobileSyncManager.ts:335-340` | `recordSyncWithNothingToPull` JSDoc, four lines | **shorten** to `/** Moves the "last synced" time, in memory and on the pull cursor's fact (which patient sync info shows), without changing the cursor's value. */` |
| `MobileSyncManager.ts:343` | "a query builder update, so the sync tick bookkeeping that saving a model does is skipped" | keep: it's accurate (`BaseModelWithoutId`'s `@BeforeUpdate`) and it's a reason |
| `CentralServerConnection.ts:35-39` (mobile) | `CentralWakingError` JSDoc: "Central answered 503 with a Retry-After header, as it does while it is waking from sleep. The sync waits in line as a queued one does, and tries again next time. spec: …" | **shorten**: cut the second sentence, which describes the callers' catch, and the catch comments already say it |
| `CentralServerConnection.ts:49` | "axios gives either a plain object (lower-cased keys) or an AxiosHeaders instance" | cut with P4; otherwise keep |
| `CentralServerConnection.ts:54-55` | "Only a Retry-After marks central as waking. A bare 503 … falls through and fails the sync as any error would." | keep, can shorten to `// a bare 503 (overloaded central, empty proxy) falls through as an ordinary failure` |
| `CentralServerConnection.ts:230-234` | `checkForChangesToPull` JSDoc: "Ask central whether anything that syncs has changed since the device's last pull. @param since … spec: …" | **shorten**: keep the `@param` and the spec tag, cut the first line, which restates the name |
| `CentralServerConnection.ts:239`, `265` | the two waking-catch comments | keep, as for the facility |
| `utils/snapshotOutgoingChanges.ts:21-23` (mobile) | "The rows a push sends: … Shared by `snapshotOutgoingChanges` and `hasOutgoingChanges`, which must select the same rows." | **shorten**, as for the facility |
| `utils/snapshotOutgoingChanges.ts:62-66` | `hasOutgoingChanges` JSDoc: "Whether any record has been updated since the last successful push, without building the snapshot … same query … reads only each row's id and stops at the first one it finds." | **shorten** to `/** Whether any of these models has a row a push from \`since\` would send; reads only ids, up to the first. */` |

Tests:

| Where | Comment | Verdict |
| --- | --- | --- |
| `changesPending.test.js:42` | "inserted directly, because the lookup table's own id column is a serial" | keep: it's accurate, since `SyncLookup`'s `id` is the generic `primaryKey`. Other lookup tests work around this with explicit numeric ids. |
| `changesPending.test.js:90` | "a stub is flagged for rebuild with no data, and carries a placeholder tick" | **shorten/fix**: `addLookupRow` never sets `needs_rebuild`. Use `// a stub has no data, and a placeholder tick` |
| `changesPending.test.js:105` | "sync sessions and builds advance the clock without any record changing" | keep: explains the `tickTock` calls |
| facility `CentralServerConnection.test.js:276` | "Calls made after the login and the user lookup that precede the first request" | keep: explains `slice(2)` |
| `CentralServerConnection.test.js:290`, `315` | spec tags | keep |
| `CentralServerConnection.test.js:332-333` | "Only a Retry-After says the server is waking. An ordinary 503 … fails the sync." | cut: it repeats the product comment, and the `it.each` titles say it |
| `FacilitySyncManager.test.js:387` | `// spec: SYNCHK#facility-servers` | keep |
| `FacilitySyncManager.test.js:424` | "Moves the local clock on and marks everything so far as pushed, so there is nothing to push" | cut: `markEverythingPushed` says it |
| `FacilitySyncManager.test.js:547` | "the local clock is reset after each test, which must not leave a row ahead of it" | keep: gives the reason for the `finally` |
| `hasUnpushedChanges.test.js:27-28` | "Rows are removed again because the local clock is reset after each test, which must not leave a row ahead of it" | keep |
| `hasUnpushedChanges.test.js:43` | "Moves the local clock on, so that rows written after this have a tick above the returned one" | **fix**: `incrementValue` returns the new tick, and rows written afterwards carry that tick, not a higher one. Use `// Moves the local clock on: rows written after carry the returned tick, rows written before a lower one` |
| mobile `CentralServerConnection.test.ts:127` | `// spec: SYNCHK#while-central-wakes` | keep |
| `MobileSyncManager.test.ts:347-348` | "only the time moves: the cursor's value is never written, whether by the update above (which sets only the time) or by a pull" | **shorten** to `// neither the update above nor a pull writes the cursor's value` |
