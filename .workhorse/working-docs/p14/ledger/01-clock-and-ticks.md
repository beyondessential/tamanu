# Logical clock, sync ticks, tick flags and the `set_updated_at_sync_tick` trigger

Ledger prefix `CLK`. Transcript ranges: Part 1 00:08:07 to 00:18:02 and 01:18:24 to 01:27:00; Part 2 00:00:01 to 00:16:55 and 00:35:21 to 00:37:48; Part 3 01:38:24 to 01:40:18. (Part 1 01:18:24 to 01:27:00 is about the push side and is not about the clock; claims from it that touch the clock are folded into CLK-27. Part 3 timestamps are the second-format ones at 1409-1425 of the cleaned file.)

Code checked is the worktree HEAD (`61e7060846`, which is a little past the `22d3edaa36` named in the brief). None of the files cited here was touched between the two, as far as the log shows. Line numbers are as of the worktree.

## Drift

- CLK-04 "highest tick wins" is wrong for record-level conflicts. Central takes the incoming record as-is (last pushed wins); only per-field merge compares ticks, and only `patient_additional_data` opts in.
- CLK-03 "every action a client takes triggers a tick tock" is loose: a client gets exactly one tick per session (from session start). Central tick-tocks several more times per session, none of them handed to the client.
- CLK-05 "no two nodes ever think it is the same time" holds for sessions (unique even ticks), but the parity claim needs spelling out: central direct writes are odd, client ticks are even, from a baseline that starts at 1.
- CLK-12 Part 2 00:35:21: "pull until is set when we enter the repeatable-read transaction, not the tick we waited on" is wrong. `pullUntil` is stored before the transaction and is the same tick that was waited on. The data returned is nevertheless unbounded above (no upper bound in any snapshot query), so the conclusion that the client may receive newer data than `pullUntil` is right.
- CLK-13 "persist takes a lock on tick tocking": right in effect, but the mechanism is an ordinary row lock taken by the `UPDATE` of the clock row inside the persist transaction (via CLS). It is not an explicit lock. Persist is not the only holder: the admin importer and the lookup-table post-commit transaction also hold it.
- CLK-16 "disabling sync within a transaction (which we do in migrations)": migrations disable the trigger with a plain statement before the batch and re-enable after it. It is not transaction-scoped, and it stays disabled if the batch fails midway.
- CLK-19 The "argument I haven't seen before" (`TG_ARGV[0]`) existed only in the version from `1784602019354`. The current function (`1793235590139`) takes no argument.
- CLK-21 "-999 versus -1" description is right after the correction, but the code comment (and the transcript's reading of it) is misleading: when an `UPDATE` does not touch the tick, NEW carries -999, and -999 is treated like any other non-`-1` value and gets overwritten with the current tick. There is no special case for -999, 0 or -2 in the trigger.
- CLK-29 Part 3 "places we tick-tock": there are six call sites in five places; the lookup-table update tick-tocks twice, and the "set what the lookup table is up to" value is the first of those, not the one after commit.
- Overview doc table (`llm/docs/initial-overview.md`): row `0` is misleading and `-2` is missing. See "Open questions answered", item 7.

## Claims

### CLK-01 The clock is a distributed logical clock controlled by central
Source: Part 1 00:08:07, 00:09:38
Verdict: confirmed
Evidence: The clock is one row in `local_system_facts` with key `currentSyncTick` (`packages/constants/src/facts.ts:11`). Only central advances it (`packages/central-server/app/sync/CentralSyncManager.js:127-134`). Facility and mobile each hold their own `currentSyncTick` row, but it is only ever overwritten with a tick received from central (`packages/facility-server/app/sync/FacilitySyncManager.js:292`, `packages/mobile/App/services/sync/MobileSyncManager.ts:331`).
Why: comment at `CentralSyncManager.js:128-131`, "rather than just incrementing by one tick, we tick, tock the clock so we guarantee the tick part to be unique to the requesting client, and any changes made directly on the central server will be recorded as updated at the tock, avoiding any direct changes (e.g. imports) being missed by a client that is at the same sync tick".
Notes: Same row, same key name on all three platforms (`packages/mobile/App/services/sync/constants.ts:9`). The row is seeded with value `'1'` by the baseline (`packages/database/src/migrations/000_baseline.sql:4739`).

### CLK-02 A tick tock increments the clock by two
Source: Part 1 00:09:38
Verdict: confirmed
Evidence: `tickTockGlobalClock` is one call, `LocalSystemFact.incrementValue(FACT_CURRENT_SYNC_TICK, 2)` (`CentralSyncManager.js:132`). That is a single `UPDATE local_system_facts SET value = value::integer + :amount, updated_at = NOW() WHERE key = :key RETURNING value` (`packages/database/src/models/LocalSystemFact.ts:83-103`). It returns `{ tick: tock - 1, tock }` where `tock` is the post-increment value (`CentralSyncManager.js:133`).
Why: see CLK-01. The single-statement form matters: concurrent tick tocks serialise on the row lock and each sees a distinct post-increment value.
Notes: `value` is `TEXT`, cast to `integer` (32-bit) in the update; the `bigint` in the trigger and in `updated_at_sync_tick` is wider than what the increment can actually produce. This is an unlikely limit in practice, but it is a limit. `incrementValue` throws if the fact row is absent (`LocalSystemFact.ts:98-100`). The sibling `LocalSystemFact.set` is deliberately not atomic and carries a warning comment (`LocalSystemFact.ts:46-52`): "there's something spooky in the sync code that relies on this exact implementation. Increment this counter if you try and fail to change it: 2". The facility and mobile write their own tick through `set`/`setSyncTick`, which are find-then-write, not single statements.

### CLK-03 Central gives the tick to the client and keeps the tock; every client action tick-tocks
Source: Part 1 00:10:51
Verdict: partly
Evidence: At session start `prepareSession` calls `tickTockGlobalClock`, destructures only `tick`, and stores it as the session's `startedAtTick` (`CentralSyncManager.js:196-197`, `packages/database/src/models/SyncSession.ts:86-91`). The route returns `startedAtTick` to the client (`packages/central-server/app/sync/buildSyncRoutes.js:188-189`, `:213-214`) and the client treats it as its new tick (CLK-24). The tock is discarded at that call site: central's own writes use whatever the row holds, which after the increment is the tock.
Why: inference from the comment at `CentralSyncManager.js:128-131`; no comment states "client gets tick" in those words.
Notes: The transcript says every client action causes a tick tock. In the code a session triggers central tick tocks at: session start, pull snapshot, persist (twice), and the lookup-table build (twice, not session-driven). Only the session-start tick is given to a client. The `tock` is used in one other place: persist stores it as the `saved_at_sync_tick` of incoming snapshot rows and as `sync_device_ticks.persisted_at_sync_tick` (CLK-09).

### CLK-04 Highest tick wins as conflict control
Source: Part 1 00:10:51, 00:12:26, 00:13:45, 00:05:43 (earlier, context)
Verdict: wrong (for record-level); confirmed (for field-level)
Evidence: For a table without field-level data, `mergeRecord` simply returns the incoming record (`packages/database/src/sync/mergeRecord.ts:48-52`). `saveIncomingChanges` compares no ticks before overwriting (`packages/database/src/sync/saveIncomingChanges.ts:56-126`); on central `saveUpdates` calls `mergeRecord` (`packages/database/src/sync/saveChanges.ts:46-60`); on a facility the central version is trusted outright (`saveChanges.ts:62`, "on the facility server, trust the resolved central server version"). Only when both versions carry `updatedAtByField` is `pickLatest` used, comparing per-field ticks (`mergeRecord.ts:4-37`).
Why: no comment explains the choice; the field-level strategy is described at `mergeRecord.ts:2` and `:48-49`.
Notes: The practical rule at record level is "last record to persist on central wins, then central wins everywhere". Because persists serialise through the clock row (CLK-13), later persist means higher tock, which is probably why the shorthand "highest tick wins" feels right; but the tick compared is never the facility's own tick. A counter-example: facility A (session tick 2) and facility B (session tick 4) both edit a record at the same real time; B pushes first, A pushes later. A's edit overwrites B's on central even though A's tick is lower. `inference` on how this plays out; the merge code is read, the scenario is not run. Worked example given at 00:12:26 happens to agree with either rule.

### CLK-05 No two nodes ever share a tick; central writes odd, clients even
Source: Part 1 00:09:38, 00:10:51
Verdict: partly
Evidence: The clock starts at 1 (`000_baseline.sql:4739`) and only ever moves by `+2` through `incrementValue(..., 2)` (`CentralSyncManager.js:132`; no other production code writes the central row, see CLK-10). So after any tick tock the stored value is odd, `tock` is odd and `tick = tock - 1` is even. Central writes (via the trigger) are stamped with the stored value, which is odd. Client sessions are given `tick`, which is even and unique per session because each tick tock moves the row on by 2. A client stamps its own edits with that even number (CLK-24).
Why: comment at `CentralSyncManager.js:128-131` (unique tick for the client, tock for central direct writes).
Notes: Exceptions, all edges: (a) before a node's first sync its `currentSyncTick` is the baseline `1`, the same value central stamps its earliest direct writes with (`inference`: a pre-first-sync facility write and a pre-first-tick central write would share tick 1); (b) the same node reuses its tick for every edit between syncs (this is intended, CLK-24); (c) some test setups seed the fact at 2 (e.g. `packages/central-server/__tests__/sync/CentralSyncManager.startSession.test.js:70-80` expects `2 + 2`), which flips the parity in tests; (d) `bumpSyncTickForRepull` writes the literal `1` into `updated_at_sync_tick` and relies on the trigger to replace it (CLK-22). The transcript's "no two nodes" is true of session ticks, not of every stored tick value.

### CLK-06 Between syncs, everything on a client happens "at the same time"; ordering is by last-synced time
Source: Part 1 00:10:51 to 00:13:45
Verdict: confirmed (as a description of ticks); see CLK-04 for why it does not decide conflicts
Evidence: A client's tick changes only at `pushChanges` (facility `FacilitySyncManager.js:292`, mobile `MobileSyncManager.ts:331`); the trigger stamps every local write with the stored value (CLK-21). So all writes between two syncs share one tick.
Why: comment at `FacilitySyncManager.js:289-291`: "use the new unique sync tick for any changes from now on so that any records that are created or updated even mid way through this sync, are marked using the new tick and will be captured in the next push".
Notes: The worked example (minute 1/5/11/15) is internally consistent; the speaker corrected 10 to 11 in the transcript.

### CLK-07 Conflicts are rare because patients and encounters live at one facility
Source: Part 1 00:13:45, 00:14:57
Verdict: unverifiable
Evidence: A product claim about usage, not about code.
Why: none in code.
Notes: What the code does do on conflict is in CLK-04.

### CLK-08 Field-level conflict resolution exists, opt-in, only for patient additional data
Source: Part 1 00:14:57, 00:16:01
Verdict: confirmed
Evidence: The only table with a `set_*_updated_at_by_field` trigger in the baseline is `patient_additional_data` (`000_baseline.sql:11454`). The model is the only one declaring `updatedAtByField` (`packages/database/src/models/PatientAdditionalData.ts`; `SyncLookup.ts` also mentions it as a pass-through). The trigger function stamps each changed column with the current sync tick (`000_baseline.sql:1113-1165`, reading `currentSyncTick` at `:1129` and `:1154`) unless the caller passes an explicit `updated_at_by_field`, which is what a sync merge does (`:1121-1126`, `:1141-1146`). On central, `lastWriteWinsPerField` merges field by field and takes the max `updatedAtSyncTick` (`mergeRecord.ts:12-46`).
Why: comments inside the trigger function and `mergeRecord.ts:11-12`.
Notes: This is a second reader of the current tick besides `set_updated_at_sync_tick`. It does not take the advisory lock, so field-level ticks are not covered by `waitForPendingEdits` on their own; they are always written together with a row write, which does take the lock. Sub-field (JSON) merging does not exist: `lastWriteWinsPerField` treats each column value as opaque (`mergeRecord.ts:21-31`), confirming the exchange at 00:17:01 to 00:18:02.

### CLK-09 Persist uses the tock for saved-at, device ticks and uniqueness
Source: Part 3 01:38:24; Part 1 00:09:38
Verdict: confirmed
Evidence: In `persistIncomingChanges`, `tock` from the first tick tock is passed to `updateSnapshotRecords(... { savedAtSyncTick: tock })` and `SyncDeviceTick.create({ deviceId, persistedAtSyncTick: tock })` (`CentralSyncManager.js:763`, `:775-782`). Records saved in this transaction are stamped by the trigger with the stored value, which, inside this transaction, is that same tock (the transaction sees its own update).
Why: PR #7772 "SAV-983: Ensure records updated by a sync have a unique sync tick on the central-server". PR body: edits made on central while a sync was persisting could share an `updated_at_sync_tick` with that sync's records; the lookup build relies on `sync_device_ticks` to say which device pushed which records, so a stray record sharing the tick would be treated as pushed by that device and would not sync down. The join is at `packages/central-server/app/sync/updateLookupTable.js:84-85` (`ON persisted_at_sync_tick = <table>.updated_at_sync_tick`).
Notes: The comment at `CentralSyncManager.js:758-762` says the first tick tock is now "purely for saving with a unique tick" and that concurrency control moved to shared advisory locks taken with the current tick as id, waited on by an exclusive lock before a snapshot. That comment dates from the rename commit `455305890a` (#5099). Do not read it as "the tick tock is not needed": it is what gives the saved records a tick no other transaction can use, and `persisted_at_sync_tick` depends on that.

### CLK-10 Where the clock is advanced (call sites)
Source: Part 1 00:06:55 ("a place where we do a tick tock ... we don't need ... I just won't take it away"); Part 3 01:38:24 (list of places)
Verdict: confirmed, with detail below
Evidence: `tickTockGlobalClock` is called from `CentralSyncManager.js` at lines 196, 339, 363, 467, 763 and 787, and nowhere else in production code. Nothing else in `packages/*/app` or `packages/*/src` calls `incrementValue` on the clock or sets the central `currentSyncTick` row (searched for `FACT_CURRENT_SYNC_TICK`, `currentSyncTick`, `incrementValue`). Tests call `incrementValue` or `set` directly to position the clock.

| # | Line | Where | Inside a transaction? | Uses | What the code says |
|---|---|---|---|---|---|
| 1 | 196 | `prepareSession` (session start) | no, autocommit | `tick` becomes `startedAtTick`, handed to the client | `startSession` comment 150-152: "as a side effect of starting a new session, cause a tick on the global sync clock ... no two sync sessions will happen at the same global sync time, meaning there's no ambiguity when resolving conflicts". Also 166-168: not awaited because the tick tock "might get blocked and take a while if the central server is concurrently persisting records from another client. Client should poll." |
| 2 | 339 | `updateLookupTable`, start | no | `tick` is `currentTick`: waited on (`waitForPendingEdits`, 341) and later written as `lastSuccessfulLookupTableUpdate` (`LocalSystemFact.set(FACT_LOOKUP_UP_TO_TICK, currentTick)`) | comment 336-338: "get a sync tick that we can safely consider the snapshot to be up to (because we use the tick of the tick-tock, so we know any more changes on the server, even while the snapshot process is ongoing, will have a later updated_at_sync_tick)" |
| 3 | 363 | `updateLookupTable`, in `afterCommit` of the repeatable-read transaction, inside a fresh `sequelize.transaction` | yes (a new transaction) | `tick` is `lookupEndTick`: written to every `sync_lookup` row flagged pending (-2), and into `SyncLookupTick` | comment 360-361: "Wrap inside transaction so that any writes to currentSyncTick will have to wait until this transaction is committed". Comment 373-377: rows are first written with the pending flag so the final tick is assigned after commit, "avoiding sync sessions missing records while sync lookup is being refreshed" |
| 4 | 467 | `setupSnapshotForPull` | no | `tick` is `pullUntil` and the tick passed to `waitForPendingEdits` (CLK-12) | comment 463-465, same wording as #2 |
| 5 | 763 | `persistIncomingChanges`, first, inside the persist transaction | yes | `tock` is `savedAtSyncTick` and `persistedAtSyncTick` | comment 758-762 (CLK-09) |
| 6 | 787 | `persistIncomingChanges`, last, inside the same transaction | yes | result unused | comment 784-786: "Tick tock once more to ensure that no records that are subsequently modified will share the same sync tick as the incoming changes, notably so that if records are modified by adjustDataPostSyncPush(), they will be picked up for pulling in the same session (specifically won't be removed by removeEchoedChanges())". Added in #7772. |

Notes: The speaker's "I'm pretty sure we made changes so that we don't need the tick tock in that spot, but I just won't take it away" (00:06:55) is about call 5 (and by extension #4, per 00:36:32). What the code says about each: #5's comment says it is "purely for saving with a unique tick" (still load-bearing, CLK-09); #6 is explicitly load-bearing for `removeEchoedChanges`; #4's tick is both the pull cut and the wait tick, so it is not only for concurrency control either (CLK-12). No call site is documented as "concurrency control only". The persist tick tock (#5) is also, as a side effect, a serialiser of persists (CLK-13).

### CLK-11 Facility and mobile do not tick central
Source: Part 1 00:10:51
Verdict: confirmed
Evidence: No client code calls the central clock directly. The only client-side effect on the clock is assigning the received tick (CLK-24).

### CLK-12 Pull "until" differs from the tick pending edits were waited on
Source: Part 2 00:35:21, 00:36:32, 00:37:48
Verdict: partly (the premise is wrong, the conclusion about data beyond `until` is right)
Evidence: In `setupSnapshotForPull`: `const { tick } = await this.tickTockGlobalClock()` (`CentralSyncManager.js:467`), `waitForPendingEdits(tick)` (`:469`), then `SyncSession.update({ pullSince: since, pullUntil: tick })` (`:478`). That is the value returned to the client as `pullUntil` (`:709-710`; route `buildSyncRoutes.js:272-284`) and stored by the facility as `lastSuccessfulSyncPull` (`FacilitySyncManager.js:371`) and by mobile (`MobileSyncManager.ts:562`). Both are the same tick, and both are set before `repeatableReadTransaction` is entered (`:564`). None of the snapshot queries has an upper bound: they filter `updated_at_sync_tick > :since` only (`packages/central-server/app/sync/snapshotOutgoingChanges.js:94`, `:259`; `updateLookupTable.js:156-157`).
Why: comment at `CentralSyncManager.js:463-465` ("the tick of the tick-tock ... any more changes ... will have a later updated_at_sync_tick") explains why `tick` is a safe cursor: everything with a tick up to `tick` has committed once pending edits are waited on, and anything later is picked up next time.
Notes: So the client may well receive records stamped after `pullUntil` (they sit in the repeatable-read snapshot or in `sync_lookup`), and will receive them again next session. The speaker's reading that the cursor is "what we are confident of, not necessarily all we sent" is right. Whether `waitForPendingEdits` here is still needed now that pulls read `sync_lookup`: the lookup build waits for pending edits with its own tick (`:341`), so the pull-side wait is arguably redundant while `config.sync.lookupTable.enabled` is true (default `true`, `packages/central-server/config/default.json5:58-59`), but the switch exists, and the same session also records `useSyncLookup` from that config (`:485-490`). Left alone, as the speaker said at 00:15:46.

### CLK-13 Persist takes a lock that blocks tick tocking
Source: Part 2 00:36:32
Verdict: partly (see CLK-14 for the mechanism)
Evidence: see CLK-14.

### CLK-14 What can make `tickTockGlobalClock` block (and the mechanism)
Source: Part 2 00:36:32 (question: "is persist on central the only time we block tick tock?")
Verdict: answered; persist is not the only one
Evidence: `incrementValue` is an `UPDATE` of the one clock row. A Postgres row lock taken by an `UPDATE` is held until the transaction ends, so a second `UPDATE` of that row waits for the first transaction to commit or roll back. There is no `FOR UPDATE`, advisory lock or table lock involved in `tickTockGlobalClock` itself. The persist transaction is `sequelize.transaction(async () => { ... })` with the tick tock inside (`CentralSyncManager.js:752-788`). Sequelize CLS is on (`Sequelize.useCLS`, `packages/database/src/services/database.js:36-41`), and Sequelize's `query` fills in `options.transaction` from CLS when none is given (`node_modules/sequelize/lib/sequelize.js:301-302`, v6.37.3). `LocalSystemFact.incrementValue` calls `this.sequelize.query(...)` with no explicit transaction (`LocalSystemFact.ts:84`), so a `tickTockGlobalClock` inside `sequelize.transaction(...)` runs inside that transaction and holds the row lock until commit. Plain reads of the clock (the trigger's `SELECT`, `LocalSystemFact.get`) never block, as Postgres reads do not wait on row locks; they see the last committed value.

Transactions that update or lock the clock row, and how long they stay open:

| Holder | Where | Mechanism | Open for |
|---|---|---|---|
| Persist (every central push) | `CentralSyncManager.js:752-788` | first tick tock (`:763`) takes the row lock; a second one (`:787`) is a second update of the same row; held to commit | The whole transaction: `pauseAudit`, `incomingSyncHook`, `saveIncomingChanges` of everything pushed, `updateSnapshotRecords`, `SyncDeviceTick.create`. Scales with push size, from seconds to many minutes for a large initial push. No timeout in the code path |
| Admin reference-data importer | `packages/central-server/app/admin/importer/importerEndpoint.js:87-104` | explicit `SELECT ... FOR UPDATE` on the `currentSyncTick` row (`lock: transaction.LOCK.UPDATE`) in a `SERIALIZABLE` transaction, before running the import | The whole import. Comment 92-99: so every imported change gets the same `updated_at_sync_tick` and "no sync pull snapshot can start while this import is still in progress ... to avoid the snapshot missing records that get saved during this import, but aren't visible in the db to be snapshot until the transaction commits" |
| Lookup-table build, post-commit step | `CentralSyncManager.js:362-370` | tick tock (`:363`) inside a new `sequelize.transaction`, followed by `updateSyncLookupPendingRecords` and `SyncLookupTick.create` | The time to re-stamp all pending (-2) `sync_lookup` rows: proportional to rows changed in that lookup build. Comment 360-361 states the intent |
| Another `tickTockGlobalClock` caller | #1, #2, #4 | autocommit single statement | Negligible, but it queues behind any of the above |

What blocks behind a holder: session start (`prepareSession`, call #1), pull snapshot setup (#4), a new lookup build (#2), another persist (#5, which means central persists are serialised end to end by the clock row), and any importer. What does not block: ordinary central writes (the trigger only reads), facility writes, mobile writes, and the whole facility-side flow. Facilities and mobile do not touch the clock row, so only central can queue behind it.

Why: comments quoted in the table. `startSession` and `CentralServerConnection` comments explain the consequence for clients: `CentralSyncManager.js:166-168`, `packages/facility-server/app/sync/CentralServerConnection.js:159-160`, `packages/mobile/App/services/sync/CentralServerConnection.ts:250` ("POST /sync (especially the tickTockGlobalClock action) might get blocked and take a while if the central server is concurrently persisting records from another client"). Session start therefore returns before the tick tock completes and clients poll `ready`.
Notes: Whether the lookup-update transaction in #3 correctly sees CLS: the callback is invoked from `afterCommit` of the outer transaction, but `sequelize.transaction` always starts a fresh CLS context (`_clsRun` in Sequelize, `lib/sequelize.js:503`), and `migrations.js:34` comments that Sequelize does not auto-nest from CLS. So #3 uses its own new transaction, as the comment intends (`inference` from library behaviour; not run). The speaker called the persist behaviour intentional and in some places important (00:36:32); the code agrees for persist (CLK-09) and the importer (explicit comment), and for #3.

### CLK-15 The current tick is also the cursor for waiting on pending edits
Source: Part 2 00:08:20 to 00:14:49 (trigger takes a lock; waiters look at the locks table)
Verdict: confirmed
Evidence: `getSyncTicksOfPendingEdits` selects `objid` from `pg_locks` where `locktype = 'advisory'` and `mode = 'ShareLock'` (`packages/database/src/sync/getSyncTicksOfPendingEdits.ts:3-20`). `waitForPendingEditsUsingSyncTick` runs `SELECT pg_advisory_xact_lock(:syncTick)`, an exclusive lock that returns once all shared holders on that key have finished (`packages/database/src/sync/waitForPendingEditsUsingSyncTick.ts`). Central uses both in `waitForPendingEdits(tick)` (`CentralSyncManager.js:436-450`: it filters pending ticks to those `< tick`, then waits on each).
Why: comment in the trigger: "take an advisory lock on that sync tick value ... to record that an active transaction is using this sync tick, see waitForPendingEditsUsingSyncTick for more details".
Notes: Outside my area beyond what is needed here. Two limits worth a line: `pg_locks.objid` is a 32-bit `oid`, so for a `bigint` key it holds only the low 32 bits (the high 32 bits are in `classid`), meaning ticks above about 4.29 billion would be misread; at +2 per tick tock this is a long way off. The `ShareLock` filter is what keeps these from clashing with other advisory-lock users.

### CLK-16 Disabling the trigger within a transaction (migrations); could have used it for sync persist
Source: Part 2 00:03:52, 00:05:24
Verdict: partly
Evidence: Migrations disable the trigger by upserting `local_system_facts.syncTrigger = 'disabled'` in a pre-migration hook (`packages/database/src/services/migrations/hooks/preMigrationHooks.ts:5-20`), run once before the whole batch (`packages/database/src/services/migrations/migrations.js:378`, and `:514` for down). The post-migration hook sets it to `'enabled'` (`postMigrationHooks.ts:276-283`, run at `migrations.js:434`, `:543`). These are standalone statements, not inside any migration's transaction (each migration runs in its own transaction, `migrations.js:255`). See CLK-25 for all users.
Why: comment at `preMigrationHooks.ts:9-11`: "Migrations are deterministic, so updating the sync tick causes us to unnecessarily sync large amounts of data".
Notes: The suggestion that persist could set the fact inside its transaction instead of using -1/-999 is `inference` and untested: because other sessions only see committed data, a `disabled` set inside an uncommitted transaction would be invisible outside it (so effectively transaction-scoped), but it would also take a row lock on the `syncTrigger` row held to commit, serialising every transaction that did this. It would also not give the record a `-999`: when disabled the trigger returns NEW untouched, so a `-1` would be stored as `-1`, not `-999` (see CLK-19 branch 1). The facility needs `-999` because the facility pull save is not the only writer.

### CLK-17 The trigger sets the tick and takes a lock "so anyone doing a sync knows we're using it"
Source: Part 2 00:06:59, 00:08:20
Verdict: confirmed
Evidence: see the function in CLK-19. A `BEFORE INSERT OR UPDATE ... FOR EACH ROW` trigger is attached to every non-excluded table by the post-migration hook (`postMigrationHooks.ts:80-96`, `addOrReplaceUpdatedAtSyncTickTrigger`, which drops and recreates `set_<table>_updated_at_sync_tick` on every table not in `GLOBAL_EXCLUDE_TABLES` or `NON_SYNCING_TABLES`).
Why: code comments inside the function.
Notes: Tables excluded include `local_system_facts`, `sync_lookup`, `sync_sessions`, `sync_device_ticks` and `sync_lookup_ticks` (`packages/database/src/services/migrations/constants.ts:15-30`), so writes to the clock row and to lookup rows are never stamped. The same row-by-row stamping applies to `import`, as the speaker described.

### CLK-18 Flags in `updated_at_sync_tick`: -1, -999, positive, central positive
Source: Part 2 00:02:28, 00:03:52, 00:05:24
Verdict: confirmed after the speaker's correction; the central "all positive" claim is partly right
Evidence: See Open questions, item 5 for the full table. `-999` is stored for a row not updated on this client; `-1` is the transient value written by sync apply code so that the trigger turns it into `-999`. Facility pull writes `updatedAtSyncTick: SYNC_TICK_FLAGS.INCOMING_FROM_CENTRAL_SERVER` (`packages/facility-server/app/sync/pullIncomingChanges.js:56`, `:96`; `facilityBootstrap.js:29`). The explanatory comment is at `packages/database/src/sync/saveChanges.ts:1-13`: records pulled from central carry -1, "which the set_updated_at_sync_tick trigger stores as -999 so the facility never pushes them back"; "On central, incoming records carry no tick, so the trigger stamps the current one as usual".
Why: comment above, plus the same text in the function body.
Notes: On central a row can legitimately be `0`: the post-migration hook adds the column with `DEFAULT 0` on central (and `-999` on a facility) so existing rows are caught by an initial sync (`postMigrationHooks.ts:49-60`). The speaker's "everything on central should have a positive integer" is therefore "non-negative". The reason for two flags is confirmed: one value ("-1") means "explicitly not updated, from sync" and the other ("-999") is the stored form, so a plain update that does not touch the column (NEW = OLD = -999) is distinguishable... see CLK-21 for why that distinction does not in fact matter to the current function.

### CLK-19 The "argument I haven't seen before"
Source: Part 2 00:00:27
Verdict: outdated (already removed from the current function)
Evidence: The argument was `TG_ARGV[0]` in the version created by `packages/database/src/migrations/1784602019354-flagSyncLookupForRebuildOnDisabledTrigger.ts:46-81`: when the trigger was disabled and `TG_NARGS > 0 AND TG_ARGV[0]::boolean`, the function called `flag_for_rebuild_in_sync_lookup(TG_TABLE_NAME, NEW.id::text)` before returning. Header comment (`:7-9`) explains: a literal baked in at trigger install time told the function, per table, whether it feeds the lookup table and runs on central; only then did the disabled branch flag the lookup row for rebuild. It was removed by `packages/database/src/migrations/1793235590139-moveSyncLookupFlaggingToAfterTrigger.ts`, which moves the flagging into a separate `AFTER INSERT OR UPDATE` trigger function `flag_sync_lookup_for_rebuild_when_sync_trigger_disabled()` (lines 24-35 of that migration) installed per lookup-tracked table on central by `addOrReplaceSyncLookupDisabledFlagTrigger` (`postMigrationHooks.ts:109-160`).
Why: header comment of `1793235590139` (lines 6-19): a BEFORE ROW trigger sees `NULL` for stored generated columns, so tables whose `id` is generated (`translated_strings`, `user_preferences`, `patient_facilities`, ...) were flagged with a `NULL` record id, failing any migration that wrote to them on central. The AFTER trigger sees the populated `id`. It sorts just before `1793235590140-migrateInsurancePlanPaymentTranslations`, the first migration to write to `translated_strings`; an instance that already applied it under an earlier timestamp (`1794455924699`) re-runs it harmlessly (rename in #11662, commit `6901810219`).
Notes: The speaker's guess ("presumably force a lookup rebuild for this record") was right for the older version. The later observation in Part 3 (outside my ranges, about 00:40:49: the most recent migration versus the one before shows no difference) is also explained: the current function body (`1793235590139`) is byte-for-byte the same logic as `1744340076240`; `1784602019354` had added the argument branch and `1793235590139` takes it out again. It is `CREATE OR REPLACE`, restating the function so the intermediate definition is replaced.

### CLK-20 The latest version of the function is found by reading the migrations
Source: Part 2 00:00:27
Verdict: confirmed
Evidence: Definitions, in order: baseline (`000_baseline.sql:1171-1195`); `1744340076240-fixRaceConditionInSettingUpdateSyncTick.ts` (copied from `1692710205000-allowDisablingSyncTrigger`, reordered so the tick is read, then locked, then assigned, per its first comment); `1784602019354` (adds `TG_ARGV` branch, CLK-19); `1793235590139` (current). No migration after `1793235590139` redefines the function (the later migrations that mention it, `1787531146415` and `postMigrationHooks.ts`, only create triggers that execute it).
Why: `1744340076240` first comment: "copied from 1692710205000-allowDisablingSyncTrigger with the order of operations fixed to first get the sync tick, then lock it, then use it".
Notes: Reading the database (`\sf set_updated_at_sync_tick`) is the better check, as the speaker said. As far as I can tell the baseline version did the same reads in the same order (select into NEW, then lock on `NEW.updated_at_sync_tick`), so the practical effect of `1744340076240` is not obvious from the diff; it uses a local `current_tick`. Left as unresolved.

### CLK-21 The current definition of `set_updated_at_sync_tick`, branch by branch
Source: Part 2 00:00:27 to 00:08:20
Verdict: confirmed; branches explained below
Evidence: From `packages/database/src/migrations/1793235590139-moveSyncLookupFlaggingToAfterTrigger.ts:36-70`, in full:

```sql
CREATE OR REPLACE FUNCTION set_updated_at_sync_tick()
  RETURNS trigger
  LANGUAGE plpgsql AS
  $func$
  DECLARE
    current_tick bigint;
  BEGIN
    IF ((SELECT value FROM local_system_facts WHERE key = 'syncTrigger') = 'disabled') THEN
      RETURN NEW;
    END IF;
    -- If setting to "-1" representing "not marked as updated on this client", we actually use
    -- a different number, "-999", to represent that in the db, so that we can identify the
    -- difference between explicitly setting it to not marked as updated (when NEW contains -1),
    -- and having other fields updated without the updated_at_sync_tick being altered (in which
    -- case NEW will contain -999, easily distinguished from -1)
    IF NEW.updated_at_sync_tick = -1 THEN
      NEW.updated_at_sync_tick := -999;
    ELSE
      -- First get the current sync tick
      SELECT value FROM local_system_facts WHERE key = 'currentSyncTick' INTO current_tick;

      -- Then take an advisory lock on that sync tick value (if one doesn't already exist), to
      -- record that an active transaction is using this sync tick
      -- see waitForPendingEditsUsingSyncTick for more details
      PERFORM pg_try_advisory_xact_lock_shared(current_tick);

      -- Finally assign the locked sync tick to the record
      NEW.updated_at_sync_tick := current_tick;
    END IF;
    RETURN NEW;
  END
  $func$;
```

Branches:
1. **Disabled** (`syncTrigger = 'disabled'`): return NEW unchanged. No stamping, no lock. NEW keeps whatever the statement supplied (so a `-1` would be stored as `-1` here, and an omitted column keeps OLD or the column default).
2. **`NEW.updated_at_sync_tick = -1`**: replace with `-999` ("last updated elsewhere"). No lock, no read of the clock. This is how sync apply code says "do not treat this as a local edit".
3. **Anything else** (including `0`, `-999`, `-2`, `1`, a positive tick, or an omitted column that keeps its OLD value or default): read the current tick, take a shared advisory lock on it, and overwrite the column with it. So any local write not marked `-1` is a local edit at the current tick, regardless of the value in NEW. In particular NEW carrying `-999` because an `UPDATE` did not mention the column is treated as an ordinary edit and re-stamped; the code comment's "easily distinguished from -1" is accurate but misleading, since the function only distinguishes `-1` and everything else.

The advisory lock: the statement is `PERFORM pg_try_advisory_xact_lock_shared(current_tick)`. It is **shared**, **transaction-scoped** (`_xact_`, released at commit or rollback), uses the **single `bigint` key form with the current tick value as the key**, and is the `try` variant, so it never waits; the boolean result is discarded by `PERFORM`. Postgres counts repeated shared acquisitions in one session, so one lock per row stamped inside a transaction is harmless (all released together at the end). Shared locks never conflict with each other, so ordinary writers do not queue; they conflict only with the exclusive `pg_advisory_xact_lock(tick)` in `waitForPendingEditsUsingSyncTick`.
Why: code comments in the function; reasons for the ordering in `1744340076240`'s first comment.
Notes: Two things the transcript did not raise. (a) Because the lock is the `try` variant with the result ignored, if a waiter holds the exclusive lock on that exact tick at that instant, the writer silently gets no lock but still stamps that tick. The exclusive hold is momentary when the waiter runs in autocommit, which both central waiters do, so this window is tiny; I did not find a test pinning it. `inference`. (b) The tick is read and the lock taken as two separate steps, so a tick tock plus a waiter can in principle slip between them. The ordering in the comment minimises but does not close that window. `inference`.

### CLK-22 Flag values: what writes each, what the trigger does
Source: Part 2 00:02:28 to 00:05:24
Verdict: see table
Evidence: `SYNC_TICK_FLAGS` is at `packages/database/src/sync/constants.ts:15-20`. `SYNC_LOOKUP_PENDING_UPDATE_FLAG = -1` (line 13) is an older, unused constant (no code reference; only the comment at `CentralSyncManager.js:375` still uses the name).

| Value | Name | Written by | Trigger action |
|---|---|---|---|
| `-1` | `INCOMING_FROM_CENTRAL_SERVER` | facility pull (`pullIncomingChanges.js:56`, `:96`), facility bootstrap (`facilityBootstrap.js:29`). Mobile's incoming rows are marked `updated_at_sync_tick: -1` in `packages/mobile/App/services/sync/utils/pullRecordsInBatches.ts:42` but see CLK-26 | branch 2: becomes `-999` |
| `-999` | `LAST_UPDATED_ELSEWHERE` | stored form of -1; also the column default for a new column on a facility (`postMigrationHooks.ts:54`) | branch 3 if written in an `UPDATE` (re-stamped with the current tick) |
| `0` | `OVERWRITE_WITH_CURRENT_TICK` | column default for a new column on central (`postMigrationHooks.ts:54`, literal `0`); the constant itself has no non-test reference | branch 3: stamped with the current tick on any write. The trigger has no special case for 0, and nothing re-queues a `0` row on its own |
| `-2` | `LOOKUP_PENDING_UPDATE` | `updateLookupTable` passes it as the tick for rows it writes into `sync_lookup` during an incremental build (`CentralSyncManager.js:380`; `buildSyncLookupSelect.ts:13-23`); `updateSyncLookupPendingRecords` later replaces it with the real tick (`updateLookupTable.js:508-520`) | none: `sync_lookup` is excluded from the trigger (`services/migrations/constants.ts`), so -2 is stored as written. Pulls filter `updated_at_sync_tick > since` with `since >= -1`, so -2 rows are excluded until re-stamped |
| positive | a real tick | the trigger (branch 3) from the current tick; on central, `bumpSyncTickForRepull` writes the literal `1` and relies on the trigger to replace it with the current tick (`packages/database/src/sync/bumpSyncTickForRepull.ts:40-53`) | already a tick; overwritten on next write |

Why: comment at `saveChanges.ts:1-13` for -1/-999. Comment at `buildSyncLookupSelect.ts:13-23` for -2.
Notes: Mobile has no trigger; its equivalent is a TypeORM hook, `assignUpdatedAtSyncTick` in `packages/mobile/App/models/BaseModelWithoutId.ts:68-85`, with the same two-way logic (-1 becomes -999, anything else gets the current tick) and the column default `-999` (`:53`).

### CLK-23 The clock value is read by the trigger without a lock, so writers are not blocked by tick tocks
Source: Part 2 00:12:06 ("Advancing the clock isn't an issue, and we're actually not locking out much")
Verdict: confirmed
Evidence: The trigger reads the clock with a plain `SELECT` (CLK-21); Postgres does not make reads wait for row locks, so a transaction holding the row lock (CLK-14) does not stop other transactions writing, only other tick tocks and the importer's explicit lock. Waiters wait only for shared holders of an older tick (`waitForPendingEditsUsingSyncTick`).
Why: as CLK-14.
Notes: The speaker's example (sync 5 to 10, import started at tick 7 still running) works as described because the import holds a shared lock on 7 until it commits, and a pull snapshot waits for it. For central imports the importer additionally holds the clock row lock, so the snapshot's tick tock cannot even proceed until the import commits (CLK-14); in that case the pending-edits wait is a second guard.

### CLK-24 A client gets and sets its own current tick, and does not tick again until its next sync
Source: Part 1 00:10:51
Verdict: confirmed
Evidence: Facility: `startSyncSession` returns `startedAtTick` (`FacilitySyncManager.js:196-202`, `CentralServerConnection.js:164-183`). `pushChanges(sessionId, newSyncClockTime)` reads the current value into `currentSyncClockTime`, then `LocalSystemFact.set(FACT_CURRENT_SYNC_TICK, newSyncClockTime)` (`FacilitySyncManager.js:285-292`), then `waitForPendingEditsUsingSyncTick(this.sequelize, currentSyncClockTime)` (`:295`). After the push it stores the previous tick as `lastSuccessfulSyncPush` (`:326`). Mobile does the same sequence with `getSyncTick`/`setSyncTick` (`MobileSyncManager.ts:322-359`, with the new tick coming from `startedAtTick` at `:251`). Nothing else on either client writes the row, so the tick is constant between one session's start of push and the next session's start of push.
Why: comment `FacilitySyncManager.js:289-291` (CLK-06). The `currentSyncClockTime` wait uses the old tick so that edits stamped with the old tick, possibly in an open transaction, finish before the push snapshot is taken.
Notes: The swap happens at the start of the push phase, not at the start of the session and not at its end. If the session fails before `pushChanges` the client keeps its old tick. The value stored as the successful push cursor is the old tick (`currentSyncClockTime`), so the next push re-sends everything stamped with the old tick or later; edits made during the session carry the new tick. The facility also asserts after pull that no pulled record was changed locally after the push snapshot (`packages/facility-server/app/sync/assertIfPulledRecordsUpdatedAfterPushSnapshot.js:24`, comparing against `lastSuccessfulSyncPush`), which relies on this tick behaviour. Mobile fallback: `getSyncTick` returns `-1` when the fact is absent (`packages/mobile/App/services/sync/utils/getSyncTick.ts:12`). A facility database before its first session holds the baseline `1`.

### CLK-25 How the trigger is disabled, and for how long
Source: Part 2 00:03:52 (disabling sync within a transaction in migrations); Part 3 01:35 onward is out of range
Verdict: answered
Evidence: Mechanism: `local_system_facts` row with key `syncTrigger` (`FACT_SYNC_TRIGGER_CONTROL`, `packages/constants/src/facts.ts:15`); value `'disabled'` switches off branches 2 and 3 of the function (CLK-21) and, via the separate AFTER trigger, makes central flag the lookup row for rebuild (`1793235590139` lines 24-35). Every place that disables or enables it:
1. Pre-migration hook sets `'disabled'` (`preMigrationHooks.ts:5-20`), run at the start of every `up` batch (`migrations.js:378`) and every `down` (`:514`). Post-migration hook sets `'enabled'` (`postMigrationHooks.ts:276-283`) after the batch (`migrations.js:434`, `:543`). Duration: from before the first migration to after the last, including the post-migration hooks that create columns, indexes and triggers, so it can be minutes to hours on a big database. If a migration throws, the post hook does not run and the fact stays `'disabled'`.
2. Data-migration helper `disableSyncTrigger(sequelize, callback)` (`packages/database/src/dataMigrations/index.js:11-16`): sets `'disabled'`, runs the callback, sets `'enabled'`. Its own comment: "It's recommended to wrap this in a transaction. Otherwise, the trigger kept disabled when the callback throws an error". No non-test caller was found in `packages` (searched `disableSyncTrigger`); the tests define their own copies (`packages/database/__tests__/sync/syncLookupSelfHeal.test.ts:60`, `packages/central-server/__tests__/sync/CentralSyncManager.updateLookupTable.test.js:851`).
3. Nothing else writes the fact in production code (searched `syncTrigger`, `FACT_SYNC_TRIGGER_CONTROL`).

Readers: `isSyncTriggerDisabled` is checked at startup by central (`packages/central-server/app/ApplicationContext.js:130-133`, which logs a warning and returns `null` from `init`, skipping the rest of the set-up) and by the facility, which throws (`packages/facility-server/app/database/integrity.js:7-10`, "Sync Trigger is disabled in the database"). So a stuck `disabled` fact stops a facility from starting and cuts central's initialisation short.
Why: comment `preMigrationHooks.ts:9-11` (CLK-16).
Notes: The support runbook `docs/runbooks/sync-restart-loop.md` and `docs/reference/query-cookbook.md:336-344` mention the trigger; the latter's description of the function ("rewrites -1 to -999, else to currentSyncTick") matches the code and omits the disabled bypass and the lock.

### CLK-26 Mobile's incoming marker uses the wrong key name
Source: not in the transcript (arises from CLK-18/22)
Verdict: unverified at runtime, flagged
Evidence: `pullRecordsInBatches.ts:42` sets `updated_at_sync_tick: -1` (snake case). `buildFromSyncRecord` then does `pick(record.data, includedColumns)` where `includedColumns` are TypeORM property names (`updatedAtSyncTick`) (`buildFromSyncRecord.ts:10-18`, `extractIncludedColumns.ts:13-26`). The snake-case key is not in that list, so it looks to be dropped before the raw `INSERT`/`UPDATE` (`executePreparedQuery.ts`). Rows saved this way bypass the TypeORM `@BeforeInsert` hook too, so the stored tick would be the column default `-999` on inserts, and unchanged on updates. The facility uses the camelCase key (`pullIncomingChanges.js:56`).
Why: no comment explains it. `inference`: results in `-999` on new rows (right), but an existing row with a local tick that is updated from central keeps its local tick and may be pushed back once.
Notes: Worth a look by whoever owns mobile sync, and for the documentation it means the mobile flag story is "by default -999, by hook -1 to -999", not "always -1 on pull".

### CLK-27 Lookup build ticks and the pull cursor
Source: Part 2 00:15:46; Part 1 01:18:24 to 01:27:00 (push side, only the clock-adjacent claims)
Verdict: partly
Evidence: Part 2 00:15:46 says the lookup table does a single write using the current sync tick when it writes, then advances the tick, and that `waitForPendingEdits` could therefore come out of pull setup. Code: for an incremental build, rows are written with -2 and re-stamped after commit with a fresh tick (CLK-10 #3), and a build waits for pending edits against its own start tick (`:341`). For an initial build the rows keep the source tables' own ticks (`CentralSyncManager.js:352-358`, `buildSyncLookupSelect.ts:13-23`), which is the case where a late-committing source row could be missed without the wait, so it is still wanted there. See CLK-12 for the config switch.
Why: comments at `:352-358`, `:373-377`.
Notes: The push-side claims in the remaining Part 1 range (01:18:24 to 01:27:00) did not contain statements about the clock beyond those above; they are covered by the push-persist ledger.

### CLK-28 Remove echoed changes compares saved-at tick with outgoing tick
Source: Part 2 00:37:48, 00:39:17
Verdict: confirmed as far as the clock is concerned
Evidence: `removeEchoedChanges` deletes outgoing rows where the incoming and outgoing record match and `incoming.saved_at_sync_tick = outgoing.saved_at_sync_tick`, with the comment "don't remove if an update has happened outside of this session" (`packages/database/src/sync/removeEchoedChanges.ts:13`). `saved_at_sync_tick` on incoming rows is the first persist tock (CLK-09); the second tick tock exists so that post-persist adjustments by `adjustDataPostSyncPush` and `bumpSyncTickForRepull` (which stamps the later tick) are not mistaken for echoes (`CentralSyncManager.js:784-786`, PR #7772).
Why: PR #7772, as in CLK-09.
Notes: The speaker's reading that, with the lookup table in place, the just-pushed records are unlikely to be in the same session's snapshot, and so the echo removal is mostly redundant, was not tested here.

### CLK-29 Places we tick-tock (Part 3 summary)
Source: Part 3 01:38:24
Verdict: partly
Evidence: Speaker's list: starting the session; updating the lookup table (setting what it is up to after commit); the snapshot for the pull; persisting. Code: six call sites in five places (CLK-10). The lookup update tick-tocks twice; `lastSuccessfulLookupTableUpdate` is set to the first tick (`currentTick`, from `:339`) inside the build transaction, and the second tick (`:363`) is the tick used to re-stamp pending lookup rows and recorded in `SyncLookupTick`. Persist tick-tocks twice, and the comment the speaker read (no records subsequently modified share the tick) belongs to the second.
Why: comments in CLK-10.

## Open questions answered

1. Where the current tick is stored and how `tickTockGlobalClock` works. One row in `local_system_facts`, key `currentSyncTick`; one SQL statement; adds 2; returns `{ tick: tock - 1, tock }`. Central keeps the tock (the stored value, odd); the client receives the tick (even) at session start. The clock starts at `1` (baseline seed, `000_baseline.sql:4739`), so the first tick tock yields tick 2, tock 3. The odd/even parity between central and clients holds in production by construction (CLK-05), with the baseline-1 edge case and test setups that seed 2. Evidence: `CentralSyncManager.js:127-134`, `LocalSystemFact.ts:83-103`.
2. Every call site. Six, all in `CentralSyncManager.js`, listed with use and the comments in CLK-10. No other production code advances or sets the central tick. Facility sets its tick at `FacilitySyncManager.js:292`; mobile at `MobileSyncManager.ts:331`; tests set it freely. The transcript's "some tick-tocks are purely for concurrency control": the code says call 5 once was and is now "purely for saving with a unique tick" (CLK-09), and call 6 is for echo safety (CLK-10); none is documented as concurrency-only, and the lookup post-commit tick tock (#3) is documented as a concurrency device ("any writes to currentSyncTick will have to wait until this transaction is committed").
3. What can block `tickTockGlobalClock`. The row lock from an `UPDATE` (or an explicit `FOR UPDATE`) on the clock row held in an open transaction. CLS means a tick tock inside `sequelize.transaction(...)` joins that transaction (Sequelize `query` reads `transaction` from CLS). Holders: persist (whole transaction, scales with push size), admin importer (explicit `FOR UPDATE`, whole import), lookup-table post-commit transaction (length of the pending-row re-stamp), and any other tick tock queued behind those. Persist is therefore not the only blocker, and concurrent persists serialise on it. Details in CLK-14.
4. How clients get and set their tick, and "does not tick again until the next sync". Confirmed (CLK-24): the tick comes with the session start and is applied at the start of the push phase; nothing else changes it.
5. The current function, the flags, the unrecognised argument, the lock. Quoted in CLK-21 (migration `1793235590139-moveSyncLookupFlaggingToAfterTrigger.ts`). Flag table in CLK-22. The argument was `TG_ARGV[0]` from `1784602019354`, now gone (CLK-19). Lock: `pg_try_advisory_xact_lock_shared(current_tick)`, shared, transaction-scoped, `bigint` key equal to the current tick, non-blocking, result ignored.
6. How the trigger is disabled. The `syncTrigger` local system fact, set to `'disabled'` before and `'enabled'` after each migration batch, and by the unused `disableSyncTrigger` helper (CLK-25). The window is the full migration batch (minutes to hours); it stays disabled if the batch fails; facility refuses to start and central stops initialising while it is.
7. Does `llm/docs/initial-overview.md` match the code? Mostly. The table lists three flags; the constants have four (`LOOKUP_PENDING_UPDATE: -2` is missing, and lives only in `sync_lookup`, not on source tables). The `-1` and `-999` rows are correct (`-999` "Facility rows default to this" matches `postMigrationHooks.ts:54`). The `0` row ("Re-stamp with the current tick on next write/sync (re-queues the record). Central rows default to this.") is misleading: central rows default to `0` only when a new column is added (existing rows), the trigger gives `0` no special treatment (any write stamps the current tick), and nothing re-queues a `0` row by itself; the constant `OVERWRITE_WITH_CURRENT_TICK` is not used in non-test code. The prose under the table ("rewrites -1 to -999 and any other value to the current sync tick", "writing 1 just gets stamped with the latest tick, which is how a record is re-queued for sync") is accurate and matches `bumpSyncTickForRepull`, but does not mention that the stamping is skipped when `syncTrigger = 'disabled'`, nor the shared advisory lock. The overview's "(unless `local_system_facts.syncTrigger = 'disabled'`)" does mention the bypass; I note only the lock is missing.

## Not in the transcript

- Persists serialise end to end through the clock row (CLK-14). Large pushes therefore delay every session start, pull snapshot setup and lookup build on central, not only other persists. Session start hides this by running `prepareSession` in the background and having clients poll `ready` (`CentralSyncManager.js:166-173`).
- The admin importer holds an explicit row lock on the clock for the full import in a `SERIALIZABLE` transaction (CLK-14). This is the most direct reason a long import stalls pulls.
- `LocalSystemFact.incrementValue` casts to `integer`; `LocalSystemFact.set` is non-atomic and carries a "do not change" warning (CLK-02).
- A second trigger, `set_updated_at_by_field`, also reads `currentSyncTick` (CLK-08).
- The trigger bypasses itself when disabled and then stores `-1` as `-1` (CLK-21 branch 1), which can matter for a data migration that writes pulled-style rows.
- The two possible gaps in the advisory lock protocol: `PERFORM pg_try_advisory_xact_lock_shared` discards its result, and the tick read and lock are separate steps (CLK-21 notes). Both are `inference`; no test was found for either.
- `pg_locks.objid` carries only the low 32 bits of a `bigint` advisory lock key (CLK-15).
- `SYNC_LOOKUP_PENDING_UPDATE_FLAG = -1` is a stale exported constant, now unused (CLK-22). The comment at `CentralSyncManager.js:375` still names it; the live constant is `SYNC_TICK_FLAGS.LOOKUP_PENDING_UPDATE` (-2).
- Tests that pin clock behaviour: `packages/central-server/__tests__/sync/CentralSyncManager.startSession.test.js:70` (session start tick-tocks by 2), `CentralSyncManager.syncLookup.test.js:~930-965` (lookup build tick-tocks twice, using a spy on `tickTockGlobalClock`), `packages/central-server/__tests__/sync/CentralSyncManager.syncDeviceTick.test.js` and `packages/database/__tests__/sync/saveChangesForModel.test.ts` (-1 to -999 on apply). I did not run them.
- Tests seed the clock directly (`incrementValue`, `set`) and some start at 2; do not infer parity rules from tests.

## Unresolved

- What `1744340076240` actually fixed relative to the baseline function. The diff reads as a refactor to a local variable with the same order of operations. Next: `git log` and the PR for that migration, and the original issue.
- Whether any production process other than the importer and persist holds a long transaction that includes a tick tock indirectly (for example a scheduled task that calls into sync code). I searched for direct calls and for `LOCK.UPDATE` on the clock row and found none, but did not follow every caller of `persistIncomingChanges`, `updateLookupTable`, `startSession`.
- The mobile -1 key mismatch (CLK-26) needs a mobile-side run or test to settle: whether the stored tick for pulled rows is really -999 on insert and unchanged on update.
- Duration of persist, importer and lookup-pending re-stamp on real data: no timeout or metric in the code path found; a large deployment's logs or `sync_sessions.debug_info` (`beganPersistAt`, `persistCompletedAt`) would give actual figures.
- Whether a `0` row on central ever arises outside column back-fill (for example through a data import); none found in code.
