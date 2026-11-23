# Concurrency analysis

Reasoning about the questions the orientation sessions left open, worked through from the code at `22d3edaa36`. Each finding states how sure it is. "Read" means derived from reading the code; "reproduced" means a test showed it (see `12-conflict-repro.md` where one exists).

## The mechanisms, stated once

Everything below rests on four mechanisms. They are easy to misread in the code because none of them is labelled.

**M1. The clock row lock.** `tickTockGlobalClock` is one `UPDATE local_system_facts ... RETURNING` (`packages/database/src/models/LocalSystemFact.ts:83-103`). Sequelize CLS means that when it is called inside `sequelize.transaction(...)` the update runs in that transaction, which then holds the row lock on the clock row until it commits. Every other tick-tock is an update of the same row, so it queues behind. This is what "a persist takes a lock on tick-tocking" means. There is no explicit lock; the lock is a side effect of where the tick-tock sits. Holders: the persist transaction (`CentralSyncManager.js:752-788`, held for the whole persist), the lookup table's stamping transaction (`:362-369`, short), and the admin importer (see `01-clock-and-ticks.md`).

**M2. The private tock.** Inside the persist transaction the clock has been advanced to `tock` but not committed. The sync tick trigger running inside that transaction reads its own uncommitted value and stamps persisted rows with `tock`. Every other transaction, under read committed, still reads the old committed value. Before committing, persist tick-tocks again (`:787`), so the committed clock jumps straight past `tock`. No other write on central can ever carry `tock`. `sync_device_ticks` records `(deviceId, tock)` (`:782`).

**M3. Pending edits.** The trigger (`set_updated_at_sync_tick`, current definition in `packages/database/src/migrations/1793235590139-moveSyncLookupFlaggingToAfterTrigger.ts:36-67`) reads the committed clock value, takes a shared transaction-scoped advisory lock keyed on that tick, and stamps the row. A reader that needs "everything up to tick T is committed" tick-tocks to get T, lists shared advisory locks below T from `pg_locks` (`packages/database/src/sync/getSyncTicksOfPendingEdits.ts`), and takes and releases an exclusive lock on each (`waitForPendingEditsUsingSyncTick.ts`), which waits for the holders to commit or roll back.

**M4. The pending flag.** The lookup build writes rows with tick `-2` inside a long repeatable read transaction, then stamps them with a fresh tick in a short second transaction (`CentralSyncManager.js:359-370`, `updateLookupTable.js:507-521`). Pulls read `updated_at_sync_tick > since` with `since >= -1`, so `-2` rows are invisible until stamped.

## F1. The lookup stamping transaction is not racy

Question (Part 3 00:29 to 00:36): the stamping transaction tick-tocks and then updates the pending rows under read committed; can a pull tick-tock past it before it commits and miss those rows? The comment says "any writes to currentSyncTick will have to wait until this transaction is committed" and the speakers could not see what makes that true.

Answer: the comment is right, by M1. The tick-tock at `:363` is inside `store.sequelize.transaction` at `:362`, so that transaction holds the clock row lock until it commits. A pull's first act is its own tick-tock (`:467`), which blocks on that lock. Two orders are possible:

- Pull tick-tocks first: its `pullUntil` is lower than the stamping tick. If its snapshot happens to see the stamped rows it sends them (the lookup query has no upper bound, `snapshotOutgoingChanges.js:259`), and they are sent again next time. Harmless.
- Stamping tick-tocks first: the pull's tick-tock waits for the stamping commit, so its snapshot starts after the rows are stamped and visible.

The isolation level is irrelevant; the row lock does the work. The statement in the session that the transaction "is not writing to the current sync tick record" is the slip: the tick-tock is that write.

Confidence: high (read). The thing to protect: **the tick-tock must stay inside the same transaction as the stamping update.** Hoisting it out, or passing `transaction: null`, reopens the race.

Residual: if the process dies between the build commit and the stamping transaction, the `-2` rows are stamped by the next run, but no `sync_lookup_ticks` row is written for the lost run, so `getLookupSourceTickRange` (`getLookupSourceTickRange.js:13-41`) can return a `minSourceTick` that is too late and changelog rows for that window are not attached. Audit rows only, needs a crash at one point. Confidence: medium (read, not traced through the changelog attach).

## F2. In a true conflict, the pushing device and central end up holding each other's version

This is the generalised form of the question at Part 2 01:36 to 01:44 (do records altered by merge escape avoid-repull?). It is not specific to merge.

Sequence, for any record R with record-level conflict resolution:

1. Device Y's change to R reaches central and the lookup table: lookup row = version Y, tick `L_y`, later than device X's pull cursor.
2. X, not having pulled that, edits R locally and syncs. Push: `mergeRecord` returns the incoming record (`packages/database/src/sync/mergeRecord.ts:48-52`), so central's row is version X at X's private `tock`.
3. Same session, seconds later, X pulls. The lookup table has not been refreshed, so its row for R is still version Y at `L_y > since`, `pushed_by_device_id = Y`. Nothing excludes it. X receives version Y.
4. On X, the pulled record was not edited after the push snapshot, so `assertIfPulledRecordsUpdatedAfterPushSnapshot` (`packages/facility-server/app/sync/assertIfPulledRecordsUpdatedAfterPushSnapshot.js:24`) passes, and `saveUpdates` takes central's version (`saveChanges.ts:60-61`). X now holds version Y.
5. The lookup table refreshes: row for R = version X, `pushed_by_device_id = X` (join at `updateLookupTable.js:84-85`, by M2).
6. X's later pulls exclude it (`snapshotOutgoingChanges.js:297-299`). X holds Y; central and every other device hold X.

Before the lookup table, step 3 read the real tables, so X pulled the resolved record in the same session. The lookup table's lag means the pull in a session no longer sees that session's push, and avoid-repull then suppresses the only thing that would correct it. With avoid-repull off, X would flap to Y and back to X one sync later.

The "other side" in step 1 does not have to be a facility. A central scheduled task, an admin edit or a patient merge changing a record that a facility has also edited since its last pull gives the same result.

The field-level case (patient additional data) is the same shape: X pushes its fields, central merges them with Y's, the merged row is saved at X's `tock`, X pulls the stale Y row and loses its own fields locally, and the merged row is then attributed to X and never sent. Nothing flags merged rows for repull: `requires_repull` is set only for changes returned by a model's `incomingSyncHook` (`packages/database/src/sync/incomingSyncHook.ts:63-77`). The doc comment on `bumpSyncTickForRepull` (`bumpSyncTickForRepull.ts:13-15`) says field-wise merges are covered; no code does that.

`removeEchoedChanges` does not help: see F5.

Confidence: high on each step (read); end-to-end reproduction is in `12-conflict-repro.md` if that file exists, otherwise still to be run. No existing test covers it; the avoid-repull tests (`packages/central-server/__tests__/sync/CentralSyncManager.syncLookup.test.js:1496-1600`) cover only the plain echo.

## F3. Record-level conflict resolution is "last push wins"

Confirmed as the session concluded (Part 1 02:02 to 02:08). `mergeRecord` compares ticks only per field and only when both sides carry `updatedAtByField`; otherwise it returns the incoming record unconditionally. Within the field-level path a tie keeps the existing value (`pickLatest` uses strict `>`, `mergeRecord.ts:11`).

The tick still matters at record level, but not for choosing a winner: it decides what each client is sent and what it pushes.

## F4. Waiting for pending edits in the pull is still needed

Question (Part 2 00:15 to 00:17): now that a pull reads the lookup table, can `waitForPendingEdits` in `setupSnapshotForPull` go?

No. The pull still reads one real table by source tick: `patient_facilities`, to decide which patients are newly marked and need their whole history (`CentralSyncManager.js:495-497`, `createMarkedForSyncPatientsTable.js:14-22`). If a transaction that inserted a `patient_facilities` row with tick `t` commits after a pull whose `pullUntil` is above `t`, that patient is never seen as newly marked by that facility, and their history never syncs. The wait at `:469` is what prevents it.

Confidence: high (read). Worth a comment in the code, since the reason is no longer the obvious one.

## F5. `removeEchoedChanges` cannot match on the lookup path

It deletes an outgoing snapshot row only when an incoming row for the same record has the same `saved_at_sync_tick` (`packages/database/src/sync/removeEchoedChanges.ts:13`). Incoming rows are stamped with the persist `tock` (`CentralSyncManager.js:775-780`). Outgoing rows from the lookup table carry the lookup row's tick (`snapshotOutgoingChanges.js:254`), which is either the `tick` half of a later tick-tock or, for rows from an initial or full rebuild, the source tick of a row written before this session's persist. Those can never equal this session's `tock`. So on the lookup path it is dead code, as suspected (Part 2 00:39 to 00:42). It is only live when `sync.lookupTable.enabled` is false.

Confidence: high (read).

## F6. The persist tick-tocks are load-bearing for avoid-repull

The comment at `CentralSyncManager.js:758-762` says the first tick-tock is "now purely for saving with a unique tick". That uniqueness is exactly what `pushed_by_device_id` rests on (M2): the lookup build attributes a row to a device when the row's tick equals a `sync_device_ticks.persisted_at_sync_tick`. If any other write could share that tick, it would be attributed to the device and never sent to it. Both tick-tocks are needed: the first makes the tick, the second (`:787`) stops later writes reusing it. `adjustDataPostSyncPush` and `bumpSyncTickForRepull` deliberately run after the transaction (`:790-793`) so their writes get a later tick and do go back to the device.

Removing or moving either tick-tock, or moving the post-persist steps inside the transaction, would silently stop records reaching the device that pushed their previous version. Confidence: high (read).

## F7. The trigger still reads the tick before locking it

Migration `1744340076240-fixRaceConditionInSettingUpdateSyncTick.ts` is titled as fixing a race, but its change was to read into a variable, lock, then assign. The read still comes before the lock, and the lock is `pg_try_advisory_xact_lock_shared`, whose result is discarded. So this interleaving remains possible:

1. Writer's trigger reads the committed clock value `t`.
2. A reader tick-tocks, lists shared locks below its tick, finds none on `t`, and proceeds.
3. Writer takes its shared lock on `t` and writes the row with `t`, committing after the reader's snapshot.

The reader's cursor is now above `t` and the row is never picked up: on central by the lookup build or the newly-marked check, on a facility by the push (`FacilitySyncManager.js:286-295` sets the new tick, then waits on the old one). The window is two adjacent statements in one PL/pgSQL function, against two network round trips on the other side, so the writer's backend would have to stall for around a millisecond at exactly that point. Very unlikely per write; not impossible across years of writes.

Closing it means locking and then re-reading the clock, repeating if it moved. Confidence: medium (read; the PR behind the migration may explain what it meant to fix).

## Things that look removable and are not

- The tick-tock in `prepareSession` (`:196`): gives the client its unique tick for the session. Needed.
- The tick-tocks in persist: F6.
- The tick-tock inside the stamping transaction: F1.
- `waitForPendingEdits` in the pull: F4.

## Things that look load-bearing and are not (on the lookup path)

- `removeEchoedChanges`: F5.
- The model-level `buildSyncFilter` and `buildPatientSyncFilter` for snapshotting pulls. They are still used by the facility bootstrap, so they are not dead; see `05-pull-snapshot.md`.
