# Fact sheet 02: clock, ticks, locks and isolation

Sources: ledgers `01` (CLK), `02` (LCK), `00` (cited as `00-M1`.. mechanisms, `00-F4`.. findings). No contradiction found between them on mechanisms. Code at `22d3edaa36`. `CSM` = `packages/central-server/app/sync/CentralSyncManager.js`. Items marked `inference` were not run.

## 1. The clock

- The sync clock is one row in `local_system_facts`, key `currentSyncTick` (`FACT_CURRENT_SYNC_TICK`, `packages/constants/src/facts.ts`). Facility and mobile hold their own row with the same key; it is only ever overwritten with a tick received from central. [CLK-01]
- `tickTockGlobalClock` (`CSM`) calls `LocalSystemFact.incrementValue(FACT_CURRENT_SYNC_TICK, 2)`, one `UPDATE local_system_facts SET value = value::integer + 2 ... RETURNING value`, and returns `{ tick: tock - 1, tock }`, where `tock` is the post-increment value. [CLK-02, 00-M1]
- The value is `TEXT` cast to 32-bit `integer` in the update, so ticks cannot exceed int4. The trigger and `updated_at_sync_tick` are `bigint`. [CLK-02, LCK-35]
- Start value: `1` (baseline seed in `000_baseline.sql`). The first tick-tock gives tick 2, tock 3. [CLK-01, CLK-05]
- Which half goes where: the `tick` (even) is handed to the client as the session's `startedAtTick`. The `tock` (odd) is what the row then holds, so central's own writes (stamped by the trigger from the stored value) carry odd ticks. [CLK-03, CLK-05]
- Parity edges: a node before its first sync holds the baseline `1`, the same value as central's earliest direct writes (`inference`); some tests seed the fact at 2, which flips parity; `bumpSyncTickForRepull` writes literal `1` and relies on the trigger to replace it. [CLK-05]
- Reason (code comment in `CSM`): tick-tock "so we guarantee the tick part to be unique to the requesting client, and any changes made directly on the central server will be recorded as updated at the tock, avoiding any direct changes (e.g. imports) being missed by a client that is at the same sync tick". [CLK-01]
- `incrementValue` throws if the fact row is absent. `LocalSystemFact.set` is deliberately non-atomic and carries a "spooky" do-not-change comment; clients write their tick through it. [CLK-02]
- Only central advances the clock. No production code outside `CSM` calls `tickTockGlobalClock` or writes the central row (except the importer lock, section 3). [CLK-10, CLK-11]
- Record-level conflict resolution is last push wins (`mergeRecord` returns the incoming record); ticks are compared only per field, and only `patient_additional_data` has `updatedAtByField`. [CLK-04, CLK-08, 00-F3]

## 2. Tick-tock call sites

All six calls are in `CSM`; five places. [CLK-10, CLK-29, LCK-42]

| # | Function | tick used for | tock used for | In a transaction? | Stated reason |
|---|---|---|---|---|---|
| 1 | `prepareSession` (session start) | `startedAtTick`, handed to the client | discarded (it is the value central then stamps with) | No, autocommit | `startSession` comment: no two sessions at the same global time, "no ambiguity when resolving conflicts". Not awaited: may block behind a persist, client polls `ready` |
| 2 | `updateLookupTable`, start | `currentTick`: waited on via `waitForPendingEdits`, later stored as the lookup up-to-tick (`FACT_LOOKUP_UP_TO_TICK`) | unused | No | Comment: tick of the tick-tock means any later change "will have a later updated_at_sync_tick" |
| 3 | `updateLookupTable`, in `afterCommit` of the repeatable read transaction, in a fresh `sequelize.transaction` | `lookupEndTick`: re-stamps rows flagged -2, recorded in `SyncLookupTick` | unused | Yes, own new transaction; holds the clock row lock until it commits | Comment: "any writes to currentSyncTick will have to wait until this transaction is committed" (00-F1: correct, this is what stops a pull missing the stamped rows) |
| 4 | `setupSnapshotForPull` | `pullUntil`, and the tick `waitForPendingEdits` waits below; returned to client as its next cursor | unused | No | Same wording as #2 |
| 5 | `persistIncomingChanges`, first | unused | `savedAtSyncTick` of incoming snapshot rows and `sync_device_ticks.persisted_at_sync_tick` | Yes, the persist transaction | Comment: "purely for saving with a unique tick". PR #7772: edits on central during a persist could share its tick, and the lookup build would attribute them to the pushing device so they would never sync down |
| 6 | `persistIncomingChanges`, last | unused | unused | Yes, same transaction | Comment: so records modified afterwards (e.g. by `adjustDataPostSyncPush`) do not share the incoming tick, are pulled in the same session and not removed by `removeEchoedChanges`. Added in #7772 |

- Persist's two tick-tocks are load-bearing for `pushed_by_device_id`: the first makes the unique tick, the second stops later writes reusing it. `adjustDataPostSyncPush` and `bumpSyncTickForRepull` run after the transaction so their writes get a later tick. [00-F6]
- #4 `pullUntil` is the same tick that was waited on, and is stored before the repeatable read transaction is entered. No snapshot query has an upper bound, so a client can receive rows stamped above `pullUntil` and gets them again next session. [CLK-12, LCK-30]
- The tick-tock in #3 must stay inside the same transaction as the stamping update. [00-F1]

## 3. Who holds the clock row lock, and for how long

The lock is a side effect of an `UPDATE` of the clock row inside an open transaction: Sequelize CLS (`Sequelize.useCLS`, `packages/database/src/services/database.js`) fills in the transaction for `incrementValue`'s `sequelize.query`. No explicit lock in `tickTockGlobalClock`. [CLK-14, 00-M1]

| Holder | Where | Held for |
|---|---|---|
| Persist (every central push) | `persistIncomingChanges` | The whole persist transaction: `incomingSyncHook`, `saveIncomingChanges`, `updateSnapshotRecords`, `SyncDeviceTick.create`. Scales with push size, seconds to many minutes. No timeout. Persists therefore serialise end to end |
| Admin reference-data importer | `importerEndpoint.js` | Explicit `SELECT ... FOR UPDATE` on the `currentSyncTick` row, first statement of a `SERIALIZABLE` transaction, held for the whole import, including dry runs (rolled back at the end). Comment: every imported change gets one tick and "no sync pull snapshot can start while this import is still in progress" |
| Lookup build, post-commit step | `updateLookupTable` (call #3) | Tick-tock, `updateSyncLookupPendingRecords`, `SyncLookupTick.create`: time to re-stamp the pending rows |
| Any other tick-tocker (#1, #2, #4) | | Negligible, but queues behind the above |

- Blocked behind a holder: session prepare (session is not ready, client polls), pull snapshot setup, new lookup build, another persist. Not blocked: ordinary central writes (the trigger only reads), `SyncSession.create`, pushing into the snapshot table, reading an already-built snapshot, `connectToSession`, all facility and mobile work. A blocked session still counts against capacity. [CLK-14, LCK-07, LCK-31]
- Admin panel edits, patient merge and other central writes do not lock the clock; they rely on the trigger alone. [LCK-05]
- Importer sharp edge (`inference`, untested): if a persist commits while the importer's `FOR UPDATE` waits, the `SERIALIZABLE` snapshot may make the lock query raise a serialisation failure; nothing retries. [LCK Q3]

## 4. The flag values

`SYNC_TICK_FLAGS` in `packages/database/src/sync/constants.ts`. [CLK-22]

| Value | Name | Written by | Trigger does |
|---|---|---|---|
| `-1` | `INCOMING_FROM_CENTRAL_SERVER` | Facility pull (`pullIncomingChanges.js`) and bootstrap (`facilityBootstrap.js`), so facility never pushes pulled rows back | Stores `-999`; no clock read, no lock |
| `-999` | `LAST_UPDATED_ELSEWHERE` | Only the trigger (from `-1`); column default for a new column on a facility | If it arrives on an `UPDATE` that did not touch the column, it is overwritten with the current tick like any other value |
| `-2` | `LOOKUP_PENDING_UPDATE` | `updateLookupTable` on `sync_lookup` rows during an incremental build; later replaced with a real tick (`updateSyncLookupPendingRecords`) | None: `sync_lookup` has no trigger. Pulls read `> since` with `since >= -1`, so -2 rows are invisible until stamped [00-M4] |
| `0` | `OVERWRITE_WITH_CURRENT_TICK` | Column default for a new column on central only (back-fills existing rows); constant unused outside tests | No special case: any write stamps the current tick. Nothing re-queues a `0` row by itself |
| positive | a real tick | The trigger; `bumpSyncTickForRepull` writes `1` and the trigger replaces it | Overwritten with the current tick on the next write |

- Wrong or incomplete in `llm/docs/initial-overview.md`: `-2` is missing; the `0` row ("re-queues the record", "central rows default to this") is misleading as above; it does not mention the shared advisory lock. The `-1` and `-999` rows and the "writing 1 gets stamped" prose are right. [CLK-22, CLK Q7]
- `SYNC_LOOKUP_PENDING_UPDATE_FLAG = -1` is a stale unused constant; a comment in `CSM` still names it. [CLK-22]
- Mobile has no trigger: the TypeORM hook `assignUpdatedAtSyncTick` (`BaseModelWithoutId.ts`) does the same two-way logic, default `-999`. Its pull marks incoming rows with snake-case `updated_at_sync_tick: -1`, which looks to be dropped by `buildFromSyncRecord`; effect (`inference`, unverified): new rows get `-999`, updated rows keep their local tick. [CLK-22, CLK-26]

## 5. The trigger

`set_updated_at_sync_tick`, `BEFORE INSERT OR UPDATE ... FOR EACH ROW`, installed on every table not in `GLOBAL_EXCLUDE_TABLES` or `NON_SYNCING_TABLES` by `postMigrationHooks`. Excluded: `local_system_facts`, `sync_lookup`, `sync_sessions`, `sync_device_ticks`, `sync_lookup_ticks`. [CLK-17, CLK-21]

1. Disabled branch: if `local_system_facts` `syncTrigger = 'disabled'`, return NEW untouched (a `-1` stays `-1`; no stamp, no lock).
2. NEW tick is `-1`: store `-999`. No clock read, no lock.
3. Anything else (`0`, `-999`, `-2`, a tick, omitted column): read `currentSyncTick` with a plain `SELECT`, then `PERFORM pg_try_advisory_xact_lock_shared(tick)`, then assign the tick. Shared, transaction scoped, key is the tick, never waits, result discarded.

- Current definition: `1793235590139-moveSyncLookupFlaggingToAfterTrigger.ts`. Earlier: baseline, `1744340076240-fixRaceConditionInSettingUpdateSyncTick`, `1784602019354` (had a `TG_ARGV[0]` branch that flagged lookup rows for rebuild when disabled; removed). The current body has the same logic as `1744340076240`. [CLK-19, CLK-20]
- Reason for `1793235590139` (migration comment): a BEFORE ROW trigger sees `NULL` for stored generated columns, so lookup flagging moved to a separate `AFTER` trigger `flag_sync_lookup_for_rebuild_when_sync_trigger_disabled()` on lookup-tracked central tables. [CLK-19]
- Because the clock is read before the lock and the lock is a discarded `try`, a writer can read tick `t`, a waiter can pass `t`, and the writer then locks and stamps `t` after the waiter's snapshot (`inference`, read not reproduced). Also a writer silently gets no lock if an exclusive holder of that key exists. [00-F7, CLK-21, LCK-37]
- `set_updated_at_by_field` (only on `patient_additional_data`) also reads the tick, without taking the lock. [CLK-08]
- Disabled by: the `syncTrigger` fact. (a) Pre-migration hook sets `'disabled'` once before a whole `up`/`down` batch, post-migration hook sets `'enabled'` after; it is not transaction scoped and stays disabled if the batch throws. Reason (comment): migrations are deterministic, updating ticks would cause large needless syncs. (b) `disableSyncTrigger` in `packages/database/src/dataMigrations/index.js`: no production caller. Nothing else writes the fact. [CLK-16, CLK-25]
- While disabled, a facility refuses to start (`integrity.js`) and central stops initialising (`ApplicationContext.js`). [CLK-25]

## 6. A client's own tick

- Facility `pushChanges` (`FacilitySyncManager.js`): reads the current tick, sets the local clock to the new `startedAtTick`, waits on the old tick with `waitForPendingEditsUsingSyncTick`, then takes the push snapshot. The old tick is stored as `lastSuccessfulSyncPush`. Mobile does the same without the wait (`MobileSyncManager.ts`, `setSyncTick`). Nothing else on either client writes the row. [CLK-24, LCK Q2]
- The swap is at the start of the push phase, not session start or end; a session failing earlier keeps the old tick. [CLK-24]
- Effect: every local write between two syncs carries one tick, so within a client ordering is "last synced", not per edit. Edits made during a session carry the new tick and go in the next push. Reason (comment): records changed mid-sync "will be captured in the next push". [CLK-06, CLK-24]
- The facility checks after pull that no pulled record changed locally after the push snapshot (`assertIfPulledRecordsUpdatedAfterPushSnapshot`, against `lastSuccessfulSyncPush`); this relies on the above. [CLK-24]
- Mobile `getSyncTick` returns `-1` if the fact is absent. [CLK-24]

## 7. Pending edits

1. Trigger takes shared lock on the tick it stamps, held to the writer's commit (section 5).
2. `getSyncTicksOfPendingEdits` (`packages/database/src/sync/`): `SELECT objid FROM pg_locks WHERE locktype = 'advisory' AND mode = 'ShareLock'`. Reason (comment): advisory locks are global, shared mode isolates the trigger's from other exclusive users. `objid` holds the low 32 bits; no dedupe, no database filter. [CLK-15, LCK-21]
3. `waitForPendingEditsUsingSyncTick`: bare `SELECT pg_advisory_xact_lock(:tick)`, exclusive, returns once every shared holder has ended and releases at once. Run inside a transaction it would keep the lock and make the trigger's `try` fail for all writers (`inference`). [LCK-23]
4. Central `waitForPendingEdits(tick)` keeps ticks `< tick` (no lower bound) and waits on each with `Promise.all`, uncapped. [LCK-22, LCK-23]

| Call site | Waits below |
|---|---|
| `setupSnapshotForPull` (`CSM`) | The pull's own `tick` (`< tick`). Still needed: pull reads `patient_facilities` by raw tick to find newly marked patients [00-F4, LCK-26] |
| `updateLookupTable` (`CSM`) | The build's `currentTick` (`< currentTick`) |
| Facility `pushChanges` | One tick, the old local tick, after setting the new one |
| Mobile | None (single writer) |

- Why: a client persists the cursor as `pullUntil`; a row stamped below it committing later would never be pulled. Pinned by `CentralSyncManager.setupSnapshotForPull.test.js`. [LCK-25]
- Facility clock set is a plain `UPDATE` with no lock coordination. [LCK Q2]

## 8. Advisory lock inventory

All transaction scoped (`_xact_`); no session locks, no unlocks. Ticks are int4; `hashtext` keys are int4 so half sit in the tick domain; 48-bit keys have a 2^-17 share in it; reporting literals are above 2^32. No registry or written rule reserves integers for ticks. [LCK Q1, LCK-35, LCK-38]

| # | Where | Key | Mode | Scope | Purpose | Sync? |
|---|---|---|---|---|---|---|
| 1 | Trigger `set_updated_at_sync_tick` | Current tick | Shared, try, result ignored | Writer's transaction | Mark tick as in use | Yes |
| 2 | `waitForPendingEditsUsingSyncTick` (central, facility push) | A held tick | Exclusive, blocking | One statement | Wait out in-flight edits | Yes |
| 3 | `takeCreateSessionLock` (`CSM`), from `buildSyncRoutes.js` | `stringToStableInteger('createSessionAdvisoryLock')` | Exclusive, try, own unmanaged transaction | Route handler until `finally` (covers `startSession`, not `prepareSession`) | One session creation at a time; loser gets `activeSync`. PR #9181 | Yes |
| 4 | `markSessionAsProcessing` (`CSM`) | `uuidToFairlyUniqueInteger(sessionId)` (48 bits) | Exclusive, blocking; probe `NOT(try)` in `checkSessionIsProcessing` | Own unmanaged transaction for prepare, pull snapshot or persist | Cross-process "session is working" flag; crash releases it | Yes |
| 5 | `Device.ts` registration | `'deviceRegistrationAdvisoryLock:' + userId` | Exclusive, blocking | `SERIALIZABLE` transaction | No double device or quota overrun | No |
| 6 | `Invoice.ts` item upsert | invoice + model + item | Exclusive, blocking | Upsert transaction | Emulate upsert on deferrable constraint | No |
| 7 | `reporting.js` | `7829301043` | Exclusive, blocking | Transaction | One reporting secret across processes | No |
| 8 | `reporting.js` | `7829301042` | Exclusive, blocking | Transaction | Avoid catalog "tuple concurrently updated" | No |
| 9 | `admin/syncCredentials.js` | `hashtext('tamanu:sync-credentials:' \|\| deviceId)` | Exclusive, blocking | Provisioning transaction | No double provisioning | Sync-adjacent, not the engine |
| 10 | `createDocumentMetadata.js` | `hashtext(owner, name, date)` | Exclusive, blocking | Transaction | Dedupe submissions | No |
| 11 | `setup.js` (facility) | `hashtext('tamanu:facility-setup')` | Exclusive, blocking | Transaction | Check-then-write race | No |

- #4 detail: takers are `startSession`, `initiatePull`, `completePush`; probers are the readiness and completion polls plus the `initiatePull` guard. A free lock with no completion marker marks the session errored "likely because the central server restarted". Each held lock pins a pooled connection. [LCK Q4]
- `reporting.js` comment is the only range reasoning in the repo. Collision of a blocking key with a live tick key causes extra waiting, and can leave a trigger edit unregistered (`inference`). [LCK-37]

## 9. Isolation levels

Default is read committed. Sync non-default: [LCK Q6]

| Where | Level | Why |
|---|---|---|
| Central pull snapshot (`CSM` via `repeatableReadTransaction`, `transactions.ts`) | Repeatable read | Comment: changes made mid-snapshot must not be included, or a child could arrive without its parent. `SELECT 1` first pins the snapshot early. Whole snapshot goes to a snapshot table so the transaction need not stay open while pages are pulled [LCK-27] |
| Central lookup build (`updateLookupTable`) | Repeatable read, writes inside, with `FOR KEY SHARE OF <table>` | Initial and incremental builds alike. A source row hard-deleted by a transaction committed after the snapshot raises `40001` instead of resurrecting stale data; not retried, next scheduled run redoes it [LCK-14] |
| Facility push snapshot (`snapshotOutgoingChanges.js`) | Repeatable read | Same child-without-parent reason; reads only |
| Bootstrap (`buildFacilityBootstrap.js`) | Repeatable read | One snapshot |
| `incomingSyncHook.ts` | Read-only transaction | Read only |

- Kept outside the pull repeatable read transaction: all writes to `sync_sessions` (`snapshotCompletedAt`, `addDebugInfo`, `pullSince/pullUntil`, error marking, polls updating `lastConnectionTime`). Reason: a repeatable read transaction updating a row changed and committed after its snapshot gets `40001`. [LCK-32]
- `40001` is raised at the conflicting statement, not at commit. No retries anywhere in sync. [LCK-33]
- Optional timeout: `sync.snapshotTransactionTimeoutMs` (config, default null) throws inside a `setTimeout`, which likely crashes the process rather than failing the session (`inference`). [LCK-28]
- Not sync: `SERIALIZABLE` in importer, device registration, report versioning. Mobile: none.

## 10. Other row locks that matter

- `FOR KEY SHARE OF <table>` on lookup source rows (`updateLookupTable.js`): conflicts only with deletes and key-changing updates; a delete waits for the build, ordinary updates do not. [LCK Q7]
- `sync_sessions`: updated on every readiness poll (`connectToSession`), completion and errors. `setParameters` is a plain `UPDATE`. PR #7691 moved debug writes to `addDebugInfo`, intended not to lock via `skipLocked: true`; whether it works is unverified (`findOne` without a `lock` option may emit no `SKIP LOCKED`), and it read-modify-writes the whole `debugInfo` object. [LCK Q7]
- Capacity `UPDATE ... WHERE id` in `startSnapshotWhenCapacityAvailable.js`: plain update; count in a CTE under read committed, so two sessions can both claim the last slot (`inference`). Limits are config: `sync.maxConcurrentSessions` 4, `sync.numberConcurrentPullSnapshots` 4. [LCK-09]
- `local_system_facts` scheduled-task hold row (`ScheduledTaskState.ts`) uses `FOR SHARE/UPDATE` on a different row from the clock. [LCK Q7]
