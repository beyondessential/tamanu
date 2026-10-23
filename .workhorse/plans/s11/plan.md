# Synchronise push progress between central and sync clients

Make central the source of truth for how far each sync client has pushed, mirroring how a client already owns its pull cursor. Behaviour is specified in `specs/sync/push-progress.md` (PUSH). This plan captures the implementation approach and the decisions behind it.

## The problem being fixed

The push cursor (`lastSuccessfulSyncPush`) lives only on the client. `FacilitySyncManager.pushChanges` snapshots everything stamped above that cursor, pushes it, then advances the cursor to the client's current tick. Central never records where a client has pushed to. So if a client DB is restored from a snapshot that diverges from central's, the client's cursor no longer reflects what central actually holds — in the restore-ahead direction it sits above central's real state and the client never re-pushes the records central is missing.

## Approach

Central records a per-client push cursor and hands it back at session start; the client resumes from the lower of that and its own cursor. "Lower of the two" (not central-authoritative) is the resume rule — see Trade-offs.

### Storage (central)

- Add a nullable `last_successful_sync_push` (`BIGINT`) column to `devices`. `Device` is `DO_NOT_SYNC` and central-side, keyed by the id central authenticates (`req.device`), and already carries per-device bookkeeping (`lastSeenAt`), so a column here is consistent precedent.
- One Sequelize migration, DDL only, nullable, no backfill (a null cursor means "central has no record yet" → client falls back to its own cursor).
- No paired mobile (TypeORM) migration: the storage is purely central. The server↔mobile pairing rule is about synced schema, which this is not. Mobile keeps using its existing `LAST_SUCCESSFUL_PUSH` fact and only reads central's cursor from the response.
- Update the dbt source models under `database/model/` for the new `devices` column (per `packages/database/CLAUDE.md`).

### Reporting the cursor (client → central)

- The client sends the cursor it reached — its `currentSyncClockTime` (the tick ceiling of the push it just completed) — on `POST /:sessionId/push/complete` (body currently carries only `tablesToInclude`).
- Thread it through `completePush(sessionId, deviceId, tablesToInclude, pushedUpToTick)` → `persistIncomingChanges`.
- Store it **inside the same transaction** as `saveIncomingChanges`, as `last_successful_sync_push = GREATEST(COALESCE(last_successful_sync_push, -1), :pushedUpToTick)` for `device.id`. Same-transaction so a failed/interrupted persist never advances it; `GREATEST` so a reported value below the stored one never regresses it (needed for the restore-behind direction).
- Advance it even when the push delta was empty — "pushed up to N" holds regardless, and keeping central's cursor level with the client avoids needless re-pushes next session.

### Resuming the push (central → client)

- Add the stored cursor to the `GET /:sessionId/metadata` response (currently `{ startedAtTick }`), looked up by the session's device id. The client already fetches this and reads `startedAtTick` in `startSyncSession`.
- In `pushChanges` / `MobileSyncManager.pushOutgoingChanges`, compute `pushSince = centralCursor == null ? localCursor : min(centralCursor, localCursor)` and snapshot from there.
- Keep recording the local cursor as today (advance to `currentSyncClockTime` after a push); it stays the fallback and the value reported up.

### Mobile parity

- Mirror the facility changes in `MobileSyncManager`: send `pushedUpToTick` on push-complete, read central's cursor from session metadata, resume from the min. No mobile schema change.

## Trade-offs

- **Resume rule: lower of the two, not central-authoritative.** Central-authoritative fixes the restore-ahead bug but regresses restore-behind: records written after the restore but before the first post-restore push are stamped with the pre-restore (low) tick, and central-authoritative would skip them. `min(central, local)` fixes restore-ahead and preserves restore-behind, costing only the occasional idempotent re-push when the two legitimately diverge. It also sidesteps a cursor-reporting wrinkle (a client computing a "new cursor" below central's).
- **Why not reuse `SyncDeviceTick`.** It records central's own tick (`tock`) per device for pull echo-avoidance in the sync lookup table (`updateLookupTable.js`) — a different tick space and purpose. The push cursor is a client-local tick only the client knows. Not reusable.
- **Storage: column on `devices` vs dedicated table.** Chose the column for simplicity and precedent (`lastSeenAt`); the one-row update keys straight off `device.id` in the persist transaction. The column is present-but-unused on facility DBs, which is harmless.
- **Mixed versions degrade cleanly.** Old client / new central: nothing reported, cursor stays null, behaves as today. New client / old central: no cursor in metadata, client falls back to local; the extra push-complete field is ignored. Full effect needs both new.

## Implementation steps

- [x] Sequelize migration: add nullable `last_successful_sync_push` BIGINT to `devices`.
- [x] `Device` model: declare the new field.
- [x] Central persist: thread `pushCursor` through the push-complete route → `completePush` → `persistIncomingChanges`; write it with `GREATEST`/`COALESCE` in the save transaction.
- [x] Central metadata: include the device's stored cursor (`lastSuccessfulPush`) in `fetchSyncMetadata` / the `/metadata` response and the ready-stream end message.
- [x] Facility: read central's cursor in `CentralServerConnection`/`startSyncSession`, apply the min in `FacilitySyncManager.pushChanges`, send `pushCursor` on push-complete.
- [x] Mobile: the same read/min/report in `MobileSyncManager`.
- [x] dbt: added the `devices` column and doc to `database/model/public/devices.{yml,md}` by hand. Re-run `npm run dbt-generate-model` against a live DB to reconcile, then `npm run dbt-check-todos`.
- [~] Tests: added central-side storage/metadata tests (`CentralSyncManager.devicePushCursor.test.js`) and facility resume-min tests (`FacilitySyncManager.test.js`); updated existing call-arg assertions. Still owed: mobile-side and full restore-direction integration round-trips — see `.workhorse/test-cases/s11/`.

## Resolved

- **Wire field names.** Client reports `pushCursor` (its `currentSyncClockTime`) on `POST /:sessionId/push/complete`; central returns `lastSuccessfulPush` (its stored cursor for the device, or null) in the session metadata.
- **Empty pushes don't report.** `completePush` is only called on a non-empty push (existing call sites), so central's cursor advances only then. This is harmless: the range an empty push would have covered holds no records, so nothing is skipped and no re-push churn results. Dropped the earlier "advance on empty pushes" idea as unnecessary.

## Verification still owed

- No `node_modules` in this worktree, so lint / unit tests / `dbt-generate-model` were not run here. Needs `npm install` then: `npm run central-test` (sync suites), `npm run facility-test` (sync suites), mobile tests, `npx eslint` on the changed files, and the dbt reconcile/check.
