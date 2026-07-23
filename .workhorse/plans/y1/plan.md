# Sync self-healing: missing-record phone home — implementation plan

Implements `specs/sync/self-healing.md` (HEAL). When a facility server or mobile device hits a missing foreign key while persisting pulled records, it reports the missing `(table, id)` pairs to central; central re-queues those records (bumps their sync tick) so the next sync heals them, guarded by a per-`(facility, record)` consecutive-failure threshold and a per-request cap, with each event recorded in the sync session's `debug_info`.

## Architecture notes

- **Detection differs per client, reporting is shared.** Mobile detects via `PRAGMA foreign_key_check` in `packages/mobile/App/services/sync/utils/checkForeignKeys.ts`. Facility detects via the PostgreSQL FK violation thrown out of `saveIncomingChanges` (constraints are deferred by `withDeferredSyncSafeguards` and asserted at `SET CONSTRAINTS ... IMMEDIATE`). Both funnel to the same central endpoint carrying `{ recordType, id }` pairs.
- **Re-queuing mechanism is the existing tick bump.** Setting `updated_at_sync_tick` to a positive value causes the `set_updated_at_sync_tick` trigger to restamp it with the current tick, re-queuing the record — the same approach as `bumpSyncTickForRepull.ts`. Never set the tick to a hand-picked value expecting it to stick.
- **Endpoint home.** Add to `packages/central-server/app/sync/buildSyncRoutes.js`, scoped under `/:sessionId/...`. Device auth and session scoping already exist there. Logic lives on `CentralSyncManager`, delegating the DB work to a new function in `packages/database/src/sync/`.
- **Loop-guard state is derived, not stored in a new table.** The consecutive count for a `(facility, record)` is computed by reading the device's previous sync session's recorded phone-home entries from `debug_info` and comparing against the incoming report; the updated entries are written to the current session's `debug_info` via `SyncSession.addDebugInfo` (best-effort; a lost write can only permit one extra bump).
- **Settings.** New central settings under the existing `sync` block in `packages/settings/src/schema/central.ts`: consecutive-failure threshold (default 3) and per-request cap (default 500). Read via `req.settings.get(...)`.
- **No schema migration** is expected — `sync_sessions.debug_info` already exists as JSON. Confirm during build; if confirmed, skip the dbt/model steps.

## Central: settings

- [ ] Add `sync.selfHealing.maxConsecutiveBumps` (default 3) and `sync.selfHealing.maxRecordsPerRequest` (default 500) to the `sync` block in `packages/settings/src/schema/central.ts`, with descriptions and positive-integer yup types

## Central: re-queue logic

- [ ] Add a function in `packages/database/src/sync/` (e.g. `healMissingReferences.ts`) that takes the resolved models, the reported `{ recordType, id }` pairs, and the settings values, and returns a per-record outcome (`bumped` | `absentOnCentral` | `notSyncable` | `overThreshold` | `overCap`)
- [ ] Resolve each `recordType` to a model; classify anything without a syncable model as `notSyncable`
- [ ] For syncable records, check existence on central by id; classify missing ones as `absentOnCentral` and log them (they indicate genuine data loss)
- [ ] Bump `updated_at_sync_tick` for surviving records using the same UPDATE pattern as `bumpSyncTickForRepull.ts` (set to a positive value, let the trigger restamp), grouped by model
- [ ] Apply the per-request cap: process at most `maxRecordsPerRequest` records, classifying the remainder as `overCap`

## Central: loop guard

- [ ] Compute the consecutive count per `(facility, recordType, id)` by reading the device's previous completed sync session's recorded phone-home entries from `debug_info`; increment when the record was reported there, otherwise start at 1
- [ ] Classify records whose count exceeds `maxConsecutiveBumps` as `overThreshold` and do not bump them
- [ ] Resolve the device's previous session (most recent completed session for the same device before the current one) to source the prior counts

## Central: endpoint

- [ ] Add a route (e.g. `POST /:sessionId/missing-references`) to `buildSyncRoutes.js` with a zod body schema of `{ records: [{ recordType, id }] }`
- [ ] Add a `CentralSyncManager` method that loads the session's facility/device context, reads the two settings, runs the loop guard + re-queue function, and returns the outcomes
- [ ] Record each event (facility, recordType, id, consecutive count, action taken) into the session's `debug_info` via `SyncSession.addDebugInfo`
- [ ] Respond with an acknowledgement (and optionally the per-record outcomes for client logging); do not alter the client's existing failure handling

## Facility client: detect and report

- [ ] Add a parser (shared or facility-side) that extracts `{ recordType, id }` pairs from a `SequelizeForeignKeyConstraintError` — parent table and missing key value come from `error.original.table`/`error.original.detail` (`Key (col)=(value) is not present in table "parent".`)
- [ ] In the facility pull/persist flow (`FacilitySyncManager.js` → `saveIncomingChanges`), catch the FK violation, post the parsed pairs to central, then rethrow so the session still fails as today
- [ ] Add a `postMissingReferences(sessionId, records)` method to `packages/facility-server/app/sync/CentralServerConnection.js`

## Mobile client: detect and report

- [ ] Extend `checkForeignKeys.ts` to resolve each violation's missing parent **id** (map `foreign_key_check`'s `fkid` via `PRAGMA foreign_key_list(table)` to the from-column, read that column off the child row) and return the `{ recordType, id }` pairs alongside throwing
- [ ] In `MobileSyncManager.ts` pull (both the streamed and snapshot persist paths that call `checkForeignKeys`), post the collected pairs to central before the FK error aborts the session
- [ ] Add the corresponding central-server call to the mobile sync API client

## Tests

- [ ] Central endpoint integration test (`packages/central-server/__tests__/sync/`): bumps an existing syncable record's tick; skips + logs a record absent on central; skips a non-syncable record type; requires device auth
- [ ] Loop-guard test: same record reported across consecutive sessions increments the count and stops bumping past the threshold; a gap (record not reported in an intervening session) resets it
- [ ] Cap test: a request over `maxRecordsPerRequest` bumps up to the cap and marks the overflow
- [ ] Facility FK-error parser unit test: parses parent table + missing id from a representative `SequelizeForeignKeyConstraintError`
- [ ] Mobile `checkForeignKeys` unit test: resolves the missing parent id for a violation and returns the reportable pairs
