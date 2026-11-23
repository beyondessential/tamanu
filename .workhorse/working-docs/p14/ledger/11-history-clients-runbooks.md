# History of fixes: facility sync client, mobile sync client, sync runbooks

Prefix `HIC`. Code references are to this worktree at main (`22d3edaa36`). "Confidence" says what the entry rests on. Many PR bodies are empty or the unfilled template; those entries rest on the diff and are marked.

Where the shared persistence layer (`packages/database/src/sync/`) is involved it is cited, because the facility client reaches central's data through it, but the central server's own side belongs to another ledger.

## Echo, cursors and attribution

### HIC-01 Soft-deletes and restores pulled from central were echoed straight back
PR: #11055 (2026-09-28), TAM-7120
Symptom: a bulk delete of about 800k rows on central produced an equal-sized push from every facility that pulled it.
Cause: pulled records carry the sentinel tick `-1` (`INCOMING_FROM_CENTRAL_SERVER`), which the `set_updated_at_sync_tick` trigger stores as `-999` so the facility never pushes them back. The delete and restore paths used paranoid `destroy()`/`restore()`, whose statement leaves `updated_at_sync_tick` out, so the trigger stamped the current tick instead and the row looked locally edited.
Fix: write `deleted_at` and the tick in the same statement. On central the client-supplied `deletedAt` is discarded (only mobile sends it), and the write is restricted to model attributes so a raw snake-case key such as `deleted_at` cannot override the decision (Sequelize puts unknown keys in the SET clause verbatim).
Guard today: `packages/database/src/sync/saveChanges.ts:35-106` (delete/restore decision travels on the record), `:62-88` (`fields` restriction); sentinel is set in `packages/facility-server/app/sync/pullIncomingChanges.js:56` and `:96`.
Lesson: any write to a pulled row must put the sentinel tick in the same statement as the change. A model helper that omits the column from its UPDATE (paranoid destroy/restore, `save` with `fields`) makes the trigger stamp a real tick and the row echoes. Check also that raw column names never reach `Model.update`.
Confidence: high (PR body, diff, code read).

### HIC-02 Pulled records edited locally between push snapshot and persist: the assertion, and its flag history
PR: #4599 (2023-09-15) SAV-286; #5520 (2024-03-15) SAV-601; #8326 (2025-08-28) TAMOC-171
Symptom: a record edited on the facility after the push snapshot was taken, and also pulled in the same session, was overwritten by the pull. The edit was never pushed.
Cause: the pull is persisted with the not-to-push sentinel, so the local edit loses its tick and is forgotten.
Fix: after the pull is staged and before it is saved, throw if any staged incoming row has a local `updated_at_sync_tick` above the last successful push cursor, so the session fails and the next one pushes the edit first. Turned off by default in 2.4 (#5520, no explanation in the commit or PR), then turned back on by default after a couple of weeks of testing on one deployment (#8326).
Guard today: `packages/facility-server/app/sync/assertIfPulledRecordsUpdatedAfterPushSnapshot.js:12-41`, called at `packages/facility-server/app/sync/FacilitySyncManager.js:349-354`; flag `sync.assertIfPulledRecordsUpdatedAfterPushSnapshot` is `true` at `packages/facility-server/config/default.json5:28`.
Lesson: this assertion fails the whole session by design. A table that is written locally at a high rate and also changed centrally can make sessions fail repeatedly (see "sync restart loop" under the runbooks). Anything new that writes synced tables during a sync window needs thought about this check. The reason it was disabled in 2.4 is not recorded anywhere I could find.
Confidence: medium (code and flag history certain; reason for the 2.4 disable is unknown; effect on session failure rate is inference).

### HIC-03 The assertion ignored pulled deletes
PR: #11269 (2026-10-14), TAM-7120
Symptom: a local edit to a record that central had deleted in the same window was lost, together with its changelog.
Cause: the assertion's query had `AND is_deleted IS FALSE`, so a pulled delete was exempt. The delete is persisted with the not-to-push sentinel and overwrites the local edit.
Fix: dropped the `is_deleted` filter.
Guard today: `packages/facility-server/app/sync/assertIfPulledRecordsUpdatedAfterPushSnapshot.js:5-11` (comment) and `:17-25` (no filter).
Lesson: "deletes are special, skip them" is wrong anywhere the sentinel tick is applied; a tombstone overwrites local state exactly like an update does.
Confidence: high (diff and code comment; PR body empty).

### HIC-04 The assertion counted rows it only needed to find
PR: #11314 (2026-10-12)
Symptom: the pre-persist assertion was slow on large pulls (inferred from the title; PR body is empty).
Cause: `SELECT COUNT(*)` over a join of the snapshot table and each synced table, run for every pull model.
Fix: `SELECT EXISTS (...)`. The error message changed from "There are N records" to "Some record".
Guard today: `packages/facility-server/app/sync/assertIfPulledRecordsUpdatedAfterPushSnapshot.js:16-25`.
Lesson: existence checks over snapshot-sized tables use `EXISTS`, and a log line that quoted a count loses it; check nothing parses the old message.
Confidence: medium (diff only).

### HIC-05 Facility re-pulled what it had just pushed (sync_lookup repull avoidance)
PR: #6545 (2024-10-14), SAV-837
Symptom: with the central lookup table enabled, a device pulled back its own pushed changes from the previous session.
Cause: the lookup table had no notion of which device wrote a row.
Fix: central records `pushed_by_device_id` per lookup row, joined from `sync_device_ticks` on the persist tick, and the pull filter skips rows pushed by the requesting device. The facility's part is to send its `deviceId` with `initiatePull`.
Guard today: `packages/facility-server/app/sync/CentralServerConnection.js:198` (sends `deviceId`); central `packages/central-server/app/sync/snapshotOutgoingChanges.js:297-299`, `packages/central-server/app/sync/updateLookupTable.js:84-86`.
Lesson: correctness of "don't serve me my own writes" depends on the deviceId being unique per physical database and on `sync_device_ticks` being complete. Two servers sharing a deviceId (a restored copy of a backup) each hide the other's writes from the other. See HIC-06 and the restore runbook.
Confidence: medium (diff and code; the cloned-deviceId consequence is inference from the filter).

### HIC-06 Device attribution committed after the persist transaction
PR: #11057 (2026-09-21)
Symptom: after a crash during a roughly 940k-row persist, the device re-pulled everything it had just pushed.
Cause: `sync_device_ticks` was inserted after the persist transaction committed; a crash in between left rows committed but unattributed forever, so HIC-05's filter did not apply.
Fix: insert the device tick inside the persist transaction.
Guard today: `packages/central-server/app/sync/CentralSyncManager.js:782` (inside the persist transaction).
Lesson: state that another filter depends on (attribution, cursors, ticks) commits with the rows it describes, never after. Look for any `await` after a commit that the next session's correctness needs.
Confidence: high (PR body). Central-side code; recorded here because it breaks the facility's pull.

### HIC-07 Multi-step transactions skipped sync
PR: #3530 (2023-02-15), SAV-93
Symptom: a record written in a long transaction could be stamped with a tick the facility had already moved past, so it was never pushed.
Cause: the tick is read inside the transaction by the trigger, but the transaction commits later; the push snapshot could run in between and the new cursor skip it.
Fix: create/update triggers take a shared advisory lock keyed on the tick; the facility waits for an exclusive lock on the previous tick before snapshotting.
Guard today: `packages/facility-server/app/sync/FacilitySyncManager.js:295`; `packages/database/src/sync/waitForPendingEditsUsingSyncTick.ts:6-13`; triggers use `pg_try_advisory_xact_lock_shared` in `packages/database/src/migrations/1793235590139-moveSyncLookupFlaggingToAfterTrigger.ts:60,101`.
Lesson: do not read the push cursor, or snapshot, without the wait. New triggers or write paths that set a tick must take the same shared lock.
Confidence: high (PR body, code).

### HIC-08 Mobile insert recorded no per-field ticks
PR: #10353 (2026-07-13)
Symptom: a patient additional data row created on mobile with initial values synced without `updatedAtByField`, so central's field-level merge against a concurrent edit could lose the mobile values.
Cause: the insert branch of `setUpdatedAtByField` read `this[snakeCase(key)]` but entity properties are camelCase, so the check was always undefined.
Fix: read `this[camelCaseKey]`, matching the update branch. Regression test added.
Guard today: `packages/mobile/App/models/PatientAdditionalData.ts` (`setUpdatedAtByField`), spec `PatientAdditionalData.spec.ts`.
Lesson: field-merge bookkeeping that silently no-ops fails only under concurrent edits. Test the insert and update branches against each other.
Confidence: high (PR body).

### HIC-09 Mobile stored the literal text `datetime('now')` as `deletedAt` for incoming tombstones
PR: #10350 (2026-07-21)
Symptom: soft-deleted rows on mobile held a 15-character string in `deletedAt`; `IS NULL` filtering still worked, parsing or comparing did not.
Cause: the value was bound as a query parameter, so SQLite stored the SQL expression as text.
Fix: use a real local ISO 9075 string.
Guard today: `packages/mobile/App/services/sync/utils/buildFromSyncRecord.ts:16`, `buildFromSyncRecord.spec.ts`.
Lesson: SQL expressions cannot travel as bound parameters. Note this stamps device-local time, not the primary timezone, and ignores the record's real deletion time.
Confidence: high (PR body, diff).

### HIC-10 Creating linked records did not mark the patient for sync
PR: #3337 (2022-12-14), EPI-305
Symptom: records created through encounters and similar paths for a patient not yet marked for sync never reached the facility's sync scope.
Cause: a missed feature in the first pass of the v2 sync model; marking lived in a patient endpoint.
Fix: separate marking logic backed by a table, hooked on creation.
Guard today: `packages/database/src/utils/onCreateEncounterMarkPatientForSync.ts:12-15`; `packages/facility-server/app/routes/apiv1/patient/patient.js` (marking endpoint).
Lesson: any new path that creates patient-linked data on a facility needs to go through the marking hook, or the record exists locally and never leaves.
Confidence: low (PR body only; current wiring not exhaustively traced).

## Push and pull loops

### HIC-11 Empty pull page threw and failed the session
PR: #10326 (2026-07-28), finding F8 of a logic-bug audit (#10266)
Symptom: a session failed with a TypeError although there was nothing wrong.
Cause: the loop destructured `records[records.length - 1]` before the `if (!records.length) break`. Empty final pages occur when central's `totalToPull` diverges from the dependency-ordered pull query.
Fix: break first. Regression test.
Guard today: `packages/facility-server/app/sync/pullIncomingChanges.js:36-47`.
Lesson: `totalToPull` is an estimate; loops must terminate on an empty page, not only on the count. Note that the polling path returns `totalPulled: totalToPull` (`:76`), not the real count, so a short pull is not visible in what it reports.
Confidence: high (PR body, code).

### HIC-12 Dynamic page limit could stick at one record
PR: #3659 (2023-03-07), EPI-387
Symptom: mobile pulled one record per page indefinitely.
Cause: mobile used an old algorithm; `Math.floor(1 * 1.2)` is still 1, so the limit could never rise from 1.
Fix: copy the facility algorithm (ceil on the upper bound) and add a negative-time guard.
Guard today: facility `packages/facility-server/app/sync/calculatePageLimit.js:5-40`, mobile `packages/mobile/App/services/sync/utils/calculatePageLimit.ts:20-53`. The "file is mirrored" comment at `calculatePageLimit.js:1` is stale: mobile now takes a settings object first, and has different defaults (`:10-17`).
Lesson: the two limiters are copies that have drifted. Any change to the scaling maths needs both, and the upper bound must be able to round up. See the page limit runbook below.
Confidence: high (PR body, diff).

### HIC-13 Elapsed time mixed two machines' clocks, and started late
PR: #6298 (2024-08-22), SAV-806
Symptom: the facility sync status showed a running sync with no start time, and negative "time ago".
Cause: start time was recorded partway through the sync after async work; "ago" compared `Date.now()` on the facility and on the browser.
Fix: record the start time first; compute elapsed on one side.
Guard today: `packages/facility-server/app/sync/FacilitySyncManager.js:183-184`; `calculatePageLimit.js:22-26` for the same negative-duration hazard.
Lesson: never subtract timestamps taken on two machines.
Confidence: medium (PR body; current client code not traced).

### HIC-14 Persist starved the facility's own users of database connections
PR: #4659 (2023-09-14), SAV-83
Symptom: users saw lag during large pulls.
Cause: probably connection pool exhaustion while persisting large batches; the author could not reproduce locally (PR body).
Fix: configurable pause between batches.
Guard today: `packages/facility-server/app/sync/pullIncomingChanges.js:66-70`; `packages/database/src/sync/saveIncomingChanges.ts:149,175`. Two similarly named keys exist in `packages/facility-server/config/default.json5:25-26`: `pauseBetweenPersistedCacheBatchesInMilliseconds` (persist) and `pauseBetweenCacheBatchInMilliseconds` (pull staging). Setting one does not affect the other.
Lesson: bulk loops on the facility share a small connection pool with live users; they need a pause and a cap on concurrency, and a setting must say which loop it governs.
Confidence: medium (PR body admits the cause is unproven).

### HIC-15 Changelog insert built one enormous query and ran the persist out of memory
PR: #10703 (2026-08-10)
Symptom: out-of-memory during the persist phase.
Cause: `ChangeLog.bulkCreate` over every changelog record at once; each carries a full copy of the record in `record_data`.
Fix: batch by `persistedCacheBatchSize`, pause between batches, discard results.
Guard today: `packages/database/src/utils/audit/insertChangelogRecords.ts:20-43`.
Lesson: anything proportional to the number of pulled or pushed records needs batching, including audit side effects, and its working set must not grow with the session.
Confidence: medium (diff; PR body empty).

### HIC-16 Building large arrays with spread or concat
PR: #11763 (2026-11-20)
Symptom: none observed ("pre-emptively").
Cause: concatenating or spreading arrays of very large sync snapshots can throw `RangeError` (argument count, or repeated copying).
Fix: push in a loop. An earlier PR (#3262, 2022) did the opposite, replacing `.push(...values)` with `concat`; this is the same hazard from both sides.
Guard today: `packages/facility-server/app/sync/snapshotOutgoingChanges.js:54-59`; `packages/mobile/App/services/sync/utils/snapshotOutgoingChanges.ts:38-52` (#11181 did the same on mobile).
Lesson: `push(...arr)` is unsafe for unbounded arrays, and `concat` in a loop is quadratic; use a `for` loop with `push`.
Confidence: medium (diff, title; no PR body).

### HIC-17 Session start can outlast the HTTP timeout
PR: #3491 (2023-02-08), EPI-357
Symptom: pull sessions failed while another client's push was persisting.
Cause: central's tick-tock blocks while a push persists, so session start could outrun the request timeout.
Fix: central does the work asynchronously and the client polls a `ready` endpoint.
Guard today: `packages/facility-server/app/sync/CentralServerConnection.js:158-183` (ready poll or stream, then fetch `metadata`); mobile `packages/mobile/App/services/sync/CentralServerConnection.ts:208-217` (`pollUntilTrue`, up to 12 hours at 1 s).
Lesson: do not add synchronous work to the session-start request; it must stay a quick call with a poll behind it.
Confidence: high (PR body).

### HIC-18 Mobile pull request timeout was too short for a big sync
PR: #4808 (2023-10-16), TAMOC-81
Symptom: a large pull timed out at 45 s and restarted the whole sync.
Cause: a hard-coded 45 s timeout; central can take longer to prepare a large pull.
Fix: per-query timeout, 5 minutes for pull.
Guard today: `packages/mobile/App/services/sync/CentralServerConnection.ts:88` (default 45 s) and `:306` (5 min).
Lesson: the author notes a timeout restarts the whole session; any new long-running endpoint on mobile needs its own timeout.
Confidence: high (PR body).

### HIC-19 Irrecoverable errors were retried, and errors were parsed outside the retry wrapper
PR: #3618 (2023-02-28) EPI-379; #2466 (2022-07-28), #2472 (2022-08-29) TAN-1269/TAN-1646 (bodies empty)
Symptom: auth failures and client-version rejections were retried through the whole backoff; callers got confusing errors.
Cause: `callWithBackoff` only reasons about errors thrown inside its callback; responses were examined after it returned.
Fix: classify the response inside the callback and throw typed errors; retry only recoverable ones.
Guard today: `packages/mobile/App/services/sync/utils/callWithBackoff.ts:32-39` (`isRecoverable`), `CentralServerConnection.ts:127-141`; facility uses the shared api-client backoff with `config.sync.backoff` (`packages/facility-server/app/sync/CentralServerConnection.js:40-44`, default 15 attempts, `config/default.json5`).
Lesson: a new error type thrown during sync needs a recoverable/irrecoverable decision, or it gets retried 15 times with growing waits.
Confidence: low for #2466 and #2472 (titles only), medium for #3618 (diff).

## Mobile save path

### HIC-20 `tablesForFullResync` handled only one of several rows, then the fix was reverted
PR: #7742 (2025-05-29, SAV-962) fixed it; #7751 (2025-05-30) reverted that part
Symptom: after several app upgrades, only some tables were fully re-synced.
Cause: each mobile migration inserts a new `local_system_facts` row with a random id and key `tablesForFullResync`, never an upsert. The reader used `findOne`, so only one row was honoured; the cleanup deleted all of them by key.
Fix: #7742 read all rows, split and merged them. #7751 (whose title is about truncating tables in one migration) put the old `findOne` back in `MobileSyncManager.ts`.
Guard today: none. `packages/mobile/App/services/sync/MobileSyncManager.ts:389-392` uses `findOne`; `:551` deletes every row; writers at `packages/mobile/App/migrations/utils/triggerFullResync.ts:3-19` and `1669855692000-resyncPatientAdditionalData.ts:16`. Only one migration calls the helper today (`1759957009000-addAndSyncProcedureTables.ts:204`), so the bug is latent.
Lesson: a second migration that calls `triggerFullResync` before a device syncs loses one request silently. Either read all rows (as #7742 did) or make the writer an upsert that appends. A revert in a neighbouring PR can undo a fix; check `git log -S` on the symbol.
Confidence: high on the code; medium that the revert was accidental (inference from the two PRs landing a day apart and the second's unrelated title).

### HIC-21 Mobile bulk insert dropped columns that only some rows carried
PR: #9396 (2026-03-24), SAV-1143
Symptom: columns present in some pushed rows were missing locally.
Cause: sync sends only populated columns, and the insert took its column list from `rows[0]`; the update wrote NULL into columns a row did not carry.
Fix: union of all rows' keys for inserts; updates grouped by column signature so each batch only updates columns its rows carry.
Guard today: `packages/mobile/App/services/sync/utils/executePreparedQuery.ts:14-15` (`getAllColumns`), `:73-84` (grouping).
Lesson: never derive the column set from the first record, and never assume a missing key means NULL. The PR says it is also protecting against "an outdated sync lookup table".
Confidence: high (PR body, diff).

### HIC-22 Race when a failed batch insert fell back to row inserts
PR: #10960 (2026-09-02)
Symptom: errors racing the transaction rollback (PR body is the empty template).
Cause: the fallback ran `Promise.all` over individual inserts. `Promise.all` does not cancel the others when one rejects, and all share one SQLite connection, so queries ran against a transaction that was rolling back.
Fix: sequential inserts (comment at `executePreparedQuery.ts:45-47`).
Guard today: `packages/mobile/App/services/sync/utils/executePreparedQuery.ts:42-55`. The update fallback still uses `Promise.all` (`:115-125`), so the same race remains there.
Lesson: no `Promise.all` over writes inside a sync transaction on mobile. The update path was missed.
Confidence: high for the insert (code comment, diff); medium that the update path is a live risk (inference).

### HIC-23 Foreign key failures named no record
PR: #10308 (2026-07-14), TAM-6959; moved by #11183 (2026-10-12), TAM-7126
Symptom: "FOREIGN KEY constraint failed" with no clue which record, in a deferred-FK transaction.
Cause: FKs are deferred for the whole save transaction (so insert order does not matter), so a genuine violation only appears at COMMIT.
Fix: #10308 ran `PRAGMA foreign_key_check` before every commit. That is a whole-database scan on every sync, so #11183 runs it only after COMMIT fails, then rolls back.
Guard today: `packages/mobile/App/services/sync/utils/runSyncSaveTransaction.ts:25-58`, `checkForeignKeys.ts:29-65`, `deferForeignKeys.ts:13-15`.
Lesson: do not add a pre-commit integrity scan to the happy path of mobile sync. Direct query-runner use here is deliberate (TypeORM rolls back before the callback can see the error); do not "simplify" it to `manager.transaction`.
Confidence: high (code comments, diffs; PR bodies empty).

### HIC-24 Topological sort that did not sort
PR: #11093 (2026-09-18), TAM-7126
Symptom: one `PRAGMA foreign_key_list` per model (about 53) inside the transaction on every sync.
Cause: `sortInDependencyOrder` did not produce a correct topological order, and FKs are deferred anyway, so order never mattered.
Fix: removed.
Guard today: `MobileSyncManager.ts:442-444`, `:517-521` (comments say FKs are deferred, order irrelevant).
Lesson: save order on mobile is irrelevant only because of `defer_foreign_keys` at `deferForeignKeys.ts:14`. If that is ever dropped, order matters again, and the removed sort was wrong. The facility still sorts (`facilityBootstrap.js:25`).
Confidence: high (PR body).

### HIC-25 An empty incremental pull still took the write lock and scanned the database
PR: #11092 (2026-09-14), TAM-7126
Symptom: every five-minute no-op sync created a snapshot, opened the write-locking save transaction and ran the FK check.
Cause: no early return for zero records.
Fix: with zero records, only advance the pull cursor, in a small transaction.
Guard today: `packages/mobile/App/services/sync/MobileSyncManager.ts:477-482`.
Lesson: the cursor must still advance to `pullUntil` or the next session re-asks from the old tick. Early returns must keep that.
Confidence: high (PR body).

### HIC-26 Hydrating whole models to check existence
PR: #10959 (2026-09-09)
Symptom: slow incoming saves (PR body empty).
Cause: `repository.find` with `In(ids)` hydrates entities with eager relations, only to learn which ids exist.
Fix: raw `SELECT id`.
Guard today: `packages/mobile/App/services/sync/utils/saveIncomingChanges.ts:29-38`.
Lesson: on the sync path avoid TypeORM `find` where you need ids or scalars.
Confidence: medium (diff only).

### HIC-27 Outgoing snapshot loaded 13 joins per row to throw them away
PR: #11156 (2026-09-24), TAM-7104; #11181 (2026-09-21)
Symptom: slow push snapshot.
Cause: `find()` joined every eager relation (13 reference-data joins per additional-data row), and `extractIncludedColumns` then dropped the relation objects.
Fix: `loadEagerRelations: false` (relation ids hydrate from the row); #11181 removed redundant shallow clones.
Guard today: `packages/mobile/App/services/sync/utils/snapshotOutgoingChanges.ts:43`, contract tests in `snapshotOutgoingChanges.spec.ts` and `extractIncludedColumns.spec.ts`.
Lesson: pushed payloads must stay scalar columns and relation ids. Any change to `@RelationId` or eager flags on a synced model changes what is pushed.
Confidence: high (PR body for #11156; #11181 diff only).

### HIC-28 Mobile push payloads were uncompressed
PR: #10795 (2026-09-06), TAM-7093
Symptom: large pushes on slow links (PR body empty).
Cause: JSON body sent raw.
Fix: send the body as a pre-serialised string with `Content-Encoding: gzip` over 1 KiB; React Native's networking layer compresses string bodies when that header is set, and central inflates them.
Guard today: `packages/mobile/App/services/sync/utils/compressibleRequestBody.ts:1-15`, `CentralServerConnection.ts:311`, central test `gzippedPush.test.js`.
Lesson: the body must be a string, not bytes; React Native strips the header for other body types. Changing the push body shape needs this retested on a device.
Confidence: medium (diff and code comment).

### HIC-29 Snapshot staged in the main database, journalled
PR: #11176 (2026-10-13) and #11189 (2026-10-28), TAM-7128
Symptom: incremental syncs were slow to stage, and the main file never shrank after a large sync.
Cause: staged pages went through the main file's journal, and deleted pages stayed as free pages.
Fix: stage in an attached throwaway database with no journal and no fsync; reclaim space with incremental vacuum or a full VACUUM at most daily.
Guard today: `packages/mobile/App/infra/db/index.ts:183-203` (attach, journal off), `:252-257` (main journal qualified `main.`), `:350-351` and `MobileSyncManager.ts:229-235` (wait for maintenance before starting a session), `manageSnapshotTable.ts:56-69` (recreate on corruption).
Lesson: pragmas must be schema-qualified (`main.journal_mode`, `main.optimize`) or they hit the snapshot database too. A session must not start while a VACUUM runs or it holds the session open waiting for the write lock. The snapshot file can be corrupt after a kill and is rebuilt, never repaired.
Confidence: high (PR body, comments).

### HIC-30 Unsafe SQLite pragmas for initial sync
PR: #9277 (2026-03-05)
Symptom: the default was flipped to off (no reason given in the PR or commit).
Cause: `useUnsafeSchemaForInitialSync` sets `journal_mode = OFF`, `synchronous = 0`, exclusive locking and in-memory temp store. With the journal off there is no rollback or crash recovery.
Fix: default changed from `true` to `false`.
Guard today: `MobileSyncManager.ts:435-438`, `packages/mobile/App/infra/db/index.ts:443-457`.
Lesson: with the setting on, a failure mid-initial-sync cannot roll back, and the "single transaction" guarantee in `pullInitialSync` is void. Reason for the flip is unknown; treat as unsafe.
Confidence: medium (code; reason is inference).

### HIC-31 Crash on initial sync when `mobileSync` settings were missing
PR: #9934 (2026-06-02)
Symptom: crash on a device's first sync.
Cause: settings arrive by sync, so on first sync `getSetting('mobileSync')` is undefined and code destructured it.
Fix: `?? {}` and per-use defaults.
Guard today: `MobileSyncManager.ts:103-105`, `saveIncomingChanges.ts:93` (default `maxRecordsPerInsertBatch = 2000`), `pushOutgoingChanges.ts:23`.
Lesson: every setting the sync loop reads must have a default in the loop itself, because on first sync the settings table is empty. Same for facilities (the pause config etc. come from files, not settings).
Confidence: high (PR body, diff).

### HIC-32 A migration deleted tables without awaiting
PR: #10863 (2026-08-20)
Symptom: race in the `wipeAllDataAndResync` migration (PR body empty).
Cause: `queryRunner.query('DELETE FROM ...')` in a loop without `await`.
Fix: await each.
Guard today: `packages/mobile/App/migrations/1675907161000-wipeAllDataAndResync.ts:~82`.
Lesson: migrations that wipe sync tables must await every statement; an unawaited delete races the sync cursor reset that follows.
Confidence: medium (diff).

### HIC-33 Mobile rejects rows other servers accept
PR: #6750 (2024-11-20)
Symptom: mobile sync failed after a task template import.
Cause: an import generated a second translated string with no extractable name, which mobile could not store; also a missing table index for reference data relations on mobile.
Fix: set the text to empty; add the index.
Guard today: not traced (central-side import).
Lesson: constraints and indexes on the mobile schema are stricter than central's. A new reference-data import shape can fail every mobile device at once, so test it against the mobile schema.
Confidence: medium (PR body; guard not traced).

### HIC-34 Central-scope settings reached mobile
PR: #11411 (2026-10-14)
Symptom: devices held central-only settings rows from before an earlier fix (#11388).
Cause: mobile syncs straight from central and had pulled those rows.
Fix: mobile migration deleting `settings` rows with scope `central`; safe because mobile only pulls settings.
Guard today: a mobile migration (not traced).
Lesson: a fix on the central side does not clean devices that already pulled; it needs a client migration. Settings with `secret` or central scope must never be pulled by mobile.
Confidence: medium (PR body).

### HIC-35 Mobile SQLite parameter limits
PR: #7983 (2025-10-07), includes #7929
Symptom: slow bulk insert; the old 999-variable assumption.
Cause: batch sizes were bounded by SQLite's historical 999 limit.
Fix: limit raised to 32766; batch size is the lesser of the setting and `32766 / columns`; commit text says 500 was best after benchmarking.
Guard today: `packages/mobile/App/infra/db/limits.ts:1-18`, used at `executePreparedQuery.ts:34,97`.
Lesson: a model with many columns shrinks the batch; adding columns to a synced table silently changes batch size.
Confidence: low (PR body empty; commit text only).

### HIC-36 Screen could sleep during a sync
PR: #11596 (2026-11-04), G13
Symptom: the OS suspended the app mid-sync.
Fix: `activateKeepAwake` for the duration of an open session, released in `finally`.
Guard today: `MobileSyncManager.ts:273`, `:297`; spec `specs/sync/mobile-keep-awake.md`.
Lesson: every exit from a session must release it. The PR says native wake lock or foreground service is out of scope.
Confidence: medium.

### HIC-37 Auth errors swallowed for the rest of the session
PR: #10279 (2026-07-13), from audit #10266
Symptom: after one use of the reconnect modal, mobile stayed signed in with dead authentication and sync silently failing.
Cause: the one-time skip flag was set to `true` again instead of `false`.
Fix: reset to `false`.
Guard today: `packages/mobile/App/ui/contexts/AuthContext.tsx`.
Lesson: one-shot flags that suppress error handling need a test proving they consume themselves.
Confidence: high (PR body).

### HIC-38 Connection status that did not re-render, and idle logout flashes
PR: #3648 (2023-03-07) WAITM-605; #3695 (2023-03-09) WAITM-602
Symptom: the "central disconnected" alert was unpredictable; idle detection flashed logout.
Cause: connection status lived as a field on a class passed through context (not observable); status was set in some paths and lost in a merge.
Fix: emit `statusChange` events and listen from the component. Throw early when no deviceId on login.
Guard today: `packages/mobile/App/services/sync/CentralServerConnection.ts:152` (emit) and `ui/components/SyncInactiveAlert.tsx`.
Lesson: state held on a plain class is invisible to React; use events or a store. These two PRs are UI-adjacent; low value for the sync document.
Confidence: medium (PR bodies, diff).

## Facility server

### HIC-39 Sync attempted with no credentials
PR: #9943 (2026-06-09)
Symptom: a facility hammered central without credentials, risking an IP lockout.
Fix: throw each run if email or password is missing.
Guard today: `packages/facility-server/app/sync/FacilitySyncManager.js:178-181`.
Lesson: sync failures that come from missing configuration should be local and loud, never a request to central. Note it throws on every scheduled run, so a facility waiting for setup produces a failed run row each time (see HIC-47).
Confidence: high (PR body).

### HIC-40 Facility start was blocked by an unreachable central
PR: #8926 (2025-12-18)
Symptom: the facility API took about 76 s longer to start when central was unreachable.
Cause: the start-up timezone check fetched central's health with login backoff of 15 attempts.
Fix: `preserveBackoffForAuthAttempt` so the check fails after one attempt.
Guard today: partly superseded. The remote timezone check is gone from `packages/shared/src/utils/timeZoneCheck.js`. The option remains at `CentralServerConnection.js:76` and is used only by `packages/facility-server/app/routes/apiv1/systemErrorReport.js:17-23`.
Lesson: nothing on the boot path may wait on central. If a request to central is added at start-up, it needs `backoff: false` and the option above.
Confidence: high.

### HIC-41 Two sync managers meant two concurrent syncs
PR: #6595 (2024-10-22, SAV-842, hotfix), #6488 (2024-09-24, SAV-828), #6497 (SAV-829)
Symptom: a facility ran multiple syncs at once.
Cause: the in-memory single-flight guard lives on one `FacilitySyncManager` instance; `SyncTask` and the sync API each built their own.
Fix: build one manager and pass it to `SyncTask` in the same process.
Guard today: `packages/facility-server/app/subCommands/startApp.js:93-109` ("must be shared with SyncTask to prevent multiple syncs"), `startTasks.js:46`, `FacilitySyncManager.js:88-126` (`currentSyncPromise`, `nextSyncPromise`).
Lesson: single-flight is per process. The `sync` subcommand (`subCommands/sync.js:21,26`) creates its own manager, so a CLI sync alongside the server relies on central refusing a second session, not on this guard (inference).
Confidence: medium (diffs; PR bodies one-liners).

### HIC-42 Session left open and snapshot tables leaked when the facility failed locally
PR: #8768 (2025-11-25), TAMOC-371; earlier #3266 (2022-12-05), #3294 (2022-12-13)
Symptom: a local failure left the session open until it lapsed on central, and left a per-session snapshot table behind.
Cause: errors during push, pull or persist were not reported, and `dropSnapshotTable` ran only after success.
Fix: wrap push, pull and end in try/catch; report an error with no Problem response to central via `POST sync/:id/error`; drop in `finally`. Per-session tables (#3294) isolate drop cost.
Guard today: `FacilitySyncManager.js:224-238`; `CentralServerConnection.js:186-188`; `dropAllSnapshotTables` at `:217`.
Lesson: a Problem with a `response` is already known to central; anything else must be reported. Cleanup belongs in `finally`. Stale tables are exactly what the `sync_snapshot_tables` healthcheck finds.
Confidence: high.

### HIC-43 Mobile never told central a session failed
PR: #10567 (2026-07-28)
Symptom: central only noticed a failed mobile session when it timed out.
Fix: report to central before rethrowing, best-effort.
Guard today: `MobileSyncManager.ts:283-289`, `:306-316`; `CentralServerConnection.ts:266`.
Lesson: the report must never mask the original error; keep it in its own try/catch. Mobile reports every error (the facility skips Problems that came from central).
Confidence: high (PR body).

### HIC-44 Upgrade steps that depended on the network
PR: #10586 (2026-07-28), TAM-6962 (folds in #10584, #10583, #10587)
Symptom: a facility upgraded over a bad link kept using an old config fallback that a later release deletes.
Cause: provisioning wrote nothing unless central answered, and the PSK step retried only at the next upgrade.
Fix: write credentials offline; pull the settings PSK on a completed sync, gated on absence and unable to fail the sync; serve the PSK to `kind: sync` accounts only, which forced the credential swap onto sync users.
Guard today: `FacilitySyncManager.js:240-257`, `pullSettingsPsk.js:9-26`, `convergeSyncUser.js:17-62`.
Lesson: provisioning that has a fallback must not depend on the network, and post-sync steps wrap errors so they never fail the session. `setIfAbsent` makes an empty PSK permanent, hence the falsy check (`pullSettingsPsk.js:16`).
Confidence: high (PR body).

### HIC-45 A new HTTP stack for central
PR: #10656 (2026-08-17), TAM-7029
Symptom: sync is thousands of small requests over slow links.
Fix: `faith` (Rust fetch with DNS cache and HTTP/2). The wrapper trims network errors. Opt-out is an env var, because facility settings arrive by sync and cannot be flipped for the one facility it breaks.
Guard today: `packages/facility-server/app/sync/faithFetch.js:11-23`, `CentralServerConnection.js:47-49`.
Lesson: the PR body says it keeps the first 200 characters of the error; the code now throws `faith: <code>` with the original as `cause`, so error classification depends on `ERROR_CODES` membership. A new error code from faith not in that table is rethrown raw, and may lose recoverable classification. The PR also notes it was untested against a private CA.
Confidence: medium (PR body and code differ in detail).

### HIC-46 Sync during central wake-up counted as failure
PR: #11617 (2026-11-16), L13
Symptom: facilities and devices logged failures while a sleeping central woke.
Cause: central answers `503` with `Retry-After` while waking.
Fix: treat only a 503 with a non-empty `Retry-After` as "queued"; a bare 503 stays a failure.
Guard today: `packages/facility-server/app/sync/CentralServerConnection.js:16-21,149-151`; `packages/mobile/App/services/sync/CentralServerConnection.ts:36-52,240`; spec `specs/sync/waking-central.md`.
Lesson: it is applied only on session start, login and refresh. A 503 mid-session is still an ordinary failure.
Confidence: high.

### HIC-47 A hung sync was invisible to alerting
PR: #11366 (2026-10-12), TAM-7169
Symptom: alerting only fires on repeated failures, so a hung sync never flagged.
Fix: a `sync_facility_runs` row is written as `running` first, then updated; persist start and end are recorded outside the save transaction. Recording failures never fail the sync.
Guard today: `FacilitySyncManager.js:135-175`, `:357,373`; `packages/database/src/models/SyncFacilityRun.ts:15-65`; spec `specs/sync/run-history.md`.
Lesson: the first write must precede anything that can hang. `triggerType` is stored but never the full reason (it carries emails and patient ids).
Confidence: high.

### HIC-48 First sync took hours before login worked
PR: #11305 (2026-10-14), Q8
Symptom: a new facility could not be logged into until its whole first pull finished.
Cause: login reads facilities, roles and permissions from local tables that were still empty.
Fix: `POST /api/sync/bootstrap` returns the minimum; the facility saves it with the pull's own code, marked last-updated-elsewhere, in one REPEATABLE READ read on central. The pull cursor is untouched, so the first sync replaces everything.
Guard today: `packages/facility-server/app/sync/facilityBootstrap.js:17-38`, `FacilitySyncManager.js:193-195,269-283`; central `buildFacilityBootstrap.js`.
Lesson: bootstrap must not move the cursor and must carry the sentinel tick, or it echoes or hides records. `hasBootstrapped` is per process and failure is swallowed.
Confidence: high.

### HIC-49 A wizard-configured facility could never sync
PR: #11056 (2026-09-11)
Symptom: the setup wizard's probe login registered the device with no scopes, then sync asked for `sync_client` and central refused.
Fix: `admin/syncCredentials` moves the device onto the sync user with `sync_client`; the wizard rejects an undeclared host or facility.
Guard today: `FacilitySyncManager`/`CentralServerConnection.js:111` (scope requested), `convergeSyncUser.js:39-42`.
Lesson: scope is requested at login and fixed per device; anything that registers a device before the sync user exists will lock it out.
Confidence: high (PR body, tested end to end).

### HIC-50 The wizard reappeared and rotated the sync password
PR: #11688 (2026-11-16)
Symptom: with two API containers the wizard reappeared after setup, and a repeat submit left sync failing "Invalid credentials".
Cause: `isServerConfigured()` is per process; central rotated the password and the facility discarded the new one.
Fix: also check the stored sync email in the database; refuse a repeat submit before asking central; disable the button while in flight.
Guard today: `packages/facility-server/app/serverConfig` (not traced in detail).
Lesson: "configured" must be read from the database, not process memory; two submits in the same second can still both reach central (PR body).
Confidence: medium.

### HIC-51 Device ids
PR: #6677 (2024-11-14, SAV-846) and #8264 (2025-09-16, TAMOC-330)
Symptom: PR #6677 says only "read the ticket"; mobile moved from a hardware-derived id to a stored UUID. #8264 gave central its own id for audit.
Cause: (inference) hardware ids can collide or change; deviceId feeds `sync_device_ticks` and HIC-05 filtering.
Fix: mobile persists `mobile-<uuid>` in config; facilities and central share `initDeviceId`, which throws when config and database disagree.
Guard today: `packages/mobile/App/services/sync/CentralServerConnection.ts:91-98`; `packages/shared/src/utils/initDeviceId.js:10-27`.
Lesson: deviceId is an identity that backs echo suppression; a restored or cloned database copies it. The mismatch throw is the only guard.
Confidence: low (reason inferred; bodies are template or one line).

### HIC-52 Snapshot table keys moved from UUID to BIGSERIAL
PR: #6326 / #6328 (2024-08-23), SAV-810
Symptom: not stated.
Cause: (inference) random UUID primary keys on very large snapshot tables are slow and scatter inserts, and paging uses `id > :fromId`.
Fix: `id BIGSERIAL`; default `fromId = 0`.
Guard today: `packages/database/src/sync/manageSnapshotTable.ts:40`, `findSyncSnapshotRecords.ts:21,32`.
Lesson: paging cursors on snapshot tables are numeric. The pull `fromId` the facility sends in polling mode is a different thing (base64 `{sortOrder, id}`, `pullIncomingChanges.js:45-46`); streaming mode sends the bare `message.id` (`:126`).
Confidence: low (diff only).

### HIC-53 Push-then-delete leaves a window
PR: #7190 (2025-04-03), NASS-1531
Symptom: n/a (feature adding `PUSH_TO_CENTRAL_THEN_DELETE`, used for patient communications).
Cause: after a successful push the facility hard-deletes the pushed ids.
Guard today: `packages/facility-server/app/sync/deleteRedundantLocalCopies.js:7-20`.
Lesson: it deletes by the ids in the snapshot, so a row edited after the snapshot but before the delete is destroyed with the edit lost (inference, nothing in the code compares ticks). Only safe for tables with no local edits after creation.
Confidence: low.

### HIC-54 Unhelpful error text on mobile
PR: #11430 (2026-10-20)
Symptom: the sync screen said "Unknown error".
Cause: React Native's XHR has no `statusText`; the code built the problem from it.
Fix: use `err.message`; display `title ?? message`.
Guard today: `CentralServerConnection.ts:36-40`; `SyncErrorDisplay.tsx`.
Lesson: do not rely on web `Response` fields in React Native.
Confidence: high.

### HIC-55 Stale pulled-count summary
PR: #10827 (2026-08-31)
Symptom: the sync summary never showed "last pulled".
Cause: `lastSyncPulledRecordsCount` was never assigned.
Guard today: `MobileSyncManager.ts:416`.
Lesson: it is the central `totalToPull`, not records saved; it reads zero when the early return in HIC-25 fires only if central says zero.
Confidence: medium.

## From the runbooks

Read: `docs/runbooks/sync-facility-stale.md`, `sync-restart-loop.md`, `sync-pull-page-limit.md`, `facility-restored-from-backup.md`, `docs/sops/stop-facility-syncing.md`, the sync parts of `docs/reference/query-cookbook.md`, `docs/healthchecks.md`, `docs/ruled-out-actions.md`.

### R1 Facility not syncing or stale (`sync_facility_stale`, `sync_lookup`, `sync_sessions`)
What it is: no completed session for 10 minutes (warn) or 30 (fail). Check definitions live in Canopy, not in this repository (`docs/healthchecks.md`).
Mechanism in code: a facility attempts a session on every `SyncTask` tick (`packages/facility-server/app/tasks/SyncTask.js:26-35`, schedule from `config.sync.schedule`). A tick without a completed session is a failed or queued run (`FacilitySyncManager.js:143-155`). Central refuses new sessions until the lookup table has built (`CentralSyncManager.js:188-193`), so a stale lookup makes every facility stale. The central refresh is incremental from `lastSuccessfulLookupTableUpdate` (`CentralSyncManager.js:344,414`).
For a developer: stale means failed, queued or never attempted, and these are different. Since #11366 a facility's own `sync_facility_runs` rows tell them apart (a `running` row with an old `start_time` is a hang); the runbook does not mention that table. A facility waiting for setup also fails every tick (HIC-39), and a waking central counts as queued, not failed (HIC-46).
Drift: the runbook says nothing about `sync_facility_runs`, queued state or credentials-not-configured. Its stuck-session advice (snapshot progress queries) matches central code.

### R2 Sync restart loop (`sync_restart_loop`: 5 per hour warn, 10 fail)
What it is: the runbook says "sessions start and die repeatedly". In the code there is no concept of a restart; the facility starts a new session at its next tick after a failure.
Mechanism: each failure ends the session (local failures are reported by `markSessionErrored`, `FacilitySyncManager.js:229-234`). Deterministic causes that recur every tick: the pre-persist assertion HIC-02/03 (`:349-354`), a foreign key conflict at persist (`withDeferredSyncSafeguards`, `packages/database/src/sync/withDeferredSyncSafeguards.ts`), missing credentials (HIC-39), and before #10326 an empty page (HIC-11). A session also fails if the process dies mid-session, which leaves a session open on central until it lapses (`CentralSyncManager.js:53`).
For a developer: a sync check that throws is retried at full frequency with no backoff between sessions, so any new throwing guard becomes a restart loop if its condition persists. Make guards recoverable by the next session, or make them stop retrying.
Drift: runbook says foreign key conflicts are "almost never" due to restore skew and recommends bumping the missing parent's tick to `1`. That matches the trigger (`docs/reference/query-cookbook.md` cites `1744340076240-fixRaceConditionInSettingUpdateSyncTick.ts`; the latest definition of the trigger functions is `1793235590139-moveSyncLookupFlaggingToAfterTrigger.ts`, which still takes the shared advisory lock). But the bump only helps if the lookup serves the row to this device: if `pushed_by_device_id` equals the device (HIC-05), `snapshotOutgoingChanges.js:297-299` still excludes it. Not mentioned in the runbook.

### R3 Facility restored from backup
What it is: after restoring a facility database, foreign key conflicts appear because rows central believes the device already has are missing.
Mechanism (verified in part): the facility's pull cursor and rows revert to the backup; central's lookup still attributes everything the device pushed after the backup to it (`sync_device_ticks`, `pushed_by_device_id`) and the pull filter skips those (`packages/central-server/app/sync/snapshotOutgoingChanges.js:297-299`). Records the facility lost and central will not re-serve become missing parents of anything newer. The runbook's phrase "sync_lookup state in the future" is not a term in the code; the closest real thing is this attribution.
Drift (important): the runbook says truncating `sync_lookup` makes it rebuild. In code, whether the lookup rebuilds from scratch depends on the fact `lastSuccessfulLookupTableUpdate`, not on the table being empty (`CentralSyncManager.js:344-348`: `isInitialBuildOfLookupTable` is true only when that fact is `-1`). A bare TRUNCATE leaves the fact set, so the next refresh is incremental and the table stays nearly empty. Clearing the fact instead blocks every session until the first build completes (`CentralSyncManager.js:188-193`). I found no code that detects an empty table. Also a rebuild re-derives attribution from `sync_device_ticks` (`updateLookupTable.js:84-86`), so it may reproduce the same exclusion. The documented fix may not do what it says; a developer should confirm before the doc is trusted.
For a developer: a facility's deviceId and cursor are only meaningful together with central's `sync_device_ticks`. Anything that duplicates or rewinds a facility database breaks echo suppression silently. `initDeviceId` (`packages/shared/src/utils/initDeviceId.js:20-24`) refuses a config/database mismatch but cannot see a restored copy.
Note `docs/sops/restore-as-copy.md` exists for the clone case; I did not audit it.

### R4 Pull page limit stuck low
What it is: the limit oscillates in a small band (the runbook's example 52, 46, 38) instead of rising.
Mechanism: `calculatePageLimit` (`packages/facility-server/app/sync/calculatePageLimit.js:5-40`) assumes page time is proportional to records. It sizes to hit `optimalTimePerPageMs` and moves at most `maxLimitChangePerPage` per page. With a fixed per-request cost (slow link) the estimate of time per record is inflated at small limits and the limit shrinks; the floor is `minLimit`, which defaults to 1 (`config/default.json5:36-42`, initial 10). The "degenerate loop" explanation is inference; the runbook gives none.
Runbook fix: raise bounds (initial 1000, min 100, max 10000, 5000 ms). Consistent with the code: a higher `minLimit` is the only floor. The log line named in the runbook exists at `pullIncomingChanges.js:31`. Config is read at call time (`calculatePageLimit.js:8` default argument) but the file is read at process start, so the restart note is right.
Drift: the runbook covers only the facility. Mobile has its own limiter with different defaults (`DYNAMIC_LIMITER_DEFAULTS`, 10000/1000/40000, 10 s) set by the `mobileSync.dynamicLimiter` setting. Also the push path uses the same limiter (`pushOutgoingChanges.js:5`) and the runbook does not mention it.

### R5 Stop a facility syncing
Mechanism: the PM2, systemd and Kubernetes variants stop the process that owns the sync manager (HIC-41); the fallback bans the egress IP at central's Caddy with a 429. A 429 is not a recognised recoverable error in the shared backoff, so I did not verify whether the facility treats it as retriable; it will retry within its 15-attempt backoff on every tick.
For a developer: since #11617 a bare 503 is a failure; a 429 has no special handling that I found.

### R6 Sync parts of the cookbook and ruled-out list
The `tablesForFullResync` and trigger notes in the cookbook ("Bump a record for resync") match `SYNC_TICK_FLAGS` and the trigger. The ruled-out entry for truncating `sync_lookup` repeats R3's claim and has the same drift.

## Recurring themes

- Sentinel tick and echo: HIC-01, 02, 03, 05, 06, 07, 48. Anything that writes a pulled row must put the sentinel tick in the same statement; anything the next pull depends on commits with the rows.
- Per-process or per-instance state mistaken for global: HIC-41, 50, 51 (and the mobile `statusChange` fix, HIC-38).
- Unbounded work proportional to session size: HIC-14, 15, 16, 24, 25, 26, 27, 28, 29, 35.
- Errors that retry forever or never report: HIC-19, 39, 42, 43, 47, 54.
- Defaults missing on first sync, or settings that arrive by sync: HIC-31, 34, 44.
- Silent partial data on mobile: HIC-20, 21, 22, 30, 33.
- Copies that drift: calculatePageLimit (HIC-12), deviceId init (HIC-51), the two pause keys (HIC-14).
- Fixes undone by later PRs: HIC-20 (reverted a day later), HIC-40 (guard removed by refactor), HIC-45 (code drifted from PR text).

## Review checklist candidates

- Does every write to a pulled row carry `updatedAtSyncTick` in the same statement (HIC-01)?
- Does a new post-commit step affect what the next session reads (HIC-06)?
- Is a check that throws recoverable by the next session, or does it become a restart loop (HIC-02, R2)?
- Does a new loop over records batch, pause, and cap concurrency (HIC-14, 15)?
- Does code on the sync path avoid `push(...arr)`, `Promise.all` over writes in a transaction, and TypeORM `find` where a raw `SELECT id` will do (HIC-16, 22, 26)?
- On mobile, are pragmas schema-qualified and does the transaction still defer foreign keys (HIC-23, 24, 29)?
- Does the sync loop have defaults for every setting it reads, given settings arrive by sync (HIC-31)?
- Does a new error type decide recoverable or irrecoverable, and are local failures reported to central (HIC-19, 42, 43)?
- Is anything that starts before sync, or at boot, free of waits on central (HIC-40)?
- Are `calculatePageLimit` copies, and the two pause config keys, changed together (HIC-12, 14)?
- Is a "configured" or "already done" flag read from the database rather than process memory (HIC-50)?
- Does a new migration that triggers a full resync write an upsert, not a new row (HIC-20)?
- Does a change to a mobile model's relations or eager flags alter the pushed payload (HIC-27)?

## Thin evidence

- Empty PR bodies, entry rests on the diff: HIC-04, 22, 26, 28, 32, 35, 52 (and 23, 24 partly), 54.
- Reason inferred, not stated: HIC-02 (why disabled in 2.4), HIC-30 (why the unsafe default was flipped), HIC-51 (why UUIDs), HIC-52 (why BIGSERIAL), HIC-53 (consequence of delete-by-id).
- #3648 and #3695 are UI-adjacent; HIC-38 is included because they were on the required list.
- #7742 and #7751 are not wrong individually; the claim that the revert was accidental is inference.
- The runbook claims in R3 (restore and lookup truncation) and R4 (cause of the low loop) are my reading of the code and need a developer who knows the incident history to confirm.
- Several line numbers for mobile UI, `serverConfig` and migrations are approximate or not traced and are marked "not traced".
