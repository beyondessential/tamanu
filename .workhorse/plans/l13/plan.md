# L13 plan: supervisor

Infra's side (actuator, pod, sleep state on the Argo Application) is infra card Y3; its working doc holds the spike evidence behind the numbers here.

## Technical notes

### Supervisor process

- Runs on Node, Tamanu's own code. Measured floor for Node, Tamanu's login code and the tuned Postgres together is about 190 MB; request about 250 MB, with the limit equal to the request (Node sizes its heap from the cgroup limit).
- Caddy runs as a child process. Routes switch between app upstreams and the supervisor through Caddy's admin API (loopback or a Unix socket only). Caddy writes its access log to a pipe the supervisor reads, which gives request start and end for in-flight tracking.
- Rate limits need a non-stock Caddy module (`rate_limit`); the image bundles a Caddy built with it. No WAF or TLS modules.
- Upstreams, the actuator URL, the listen address and the Caddy and Postgres binary paths come from config.
- With no actuator configured, Postgres is never started.

### The supervisor's Postgres

- Real PostgreSQL, not PGlite (PGlite alone needs 256 to 400 MB). Contrib extensions `fuzzystrmatch` and `uuid-ossp` must be available.
- Settings that reach the floor: `max_connections=5`, `shared_buffers=1MB`, `work_mem=1MB`, `maintenance_work_mem=1MB`, `temp_buffers=800kB`, `wal_buffers=32kB`, `wal_level=minimal`, `max_wal_senders=0`, `max_wal_size=32MB`, `min_wal_size=32MB`, `autovacuum=off`, `max_worker_processes=0`, parallel workers off, `io_method=sync` (on 18), `track_activities=off`, `track_counts=off`.
- `fsync` stays on (the spike ran with it off), because the rows awaiting hand-back and the held values (tick, cursor, next task time) must survive a crash. Re-check the memory floor and copy time with it on.
- The small lock table means: create and fill tables one statement at a time.
- Data directory on the supervisor's durable storage.

### Schema artefact

- CI per release: migrate an empty database, prune to the allowlist, `pg_dump -s --no-owner --no-privileges`. About 73 KB. Generate it so it loads into the oldest Postgres major a platform may provide (run `pg_dump` of that major, or test-load into it in CI).
- A schema dump blanks `search_path`; reset it after loading.

### Copy and hand-back

- Copy: `pg_dump -a --disable-triggers` of the allowlist piped into the copy, or streamed `COPY` from Node. About 0.3 s for 25,000 rows in the spike.
- Changed rows are tracked inside the copy (a trigger on the three written tables, added after the load, recording each row's key in a side table), not by timestamp: copied rows keep central's `updated_at`, which can be ahead of the supervisor's clock, and handing back unchanged rows would bump their sync ticks and make every device re-pull them.
- Hand-back upserts the tracked rows into the real database with triggers on.
- The supervisor uses the application's database role and connection configuration (`connectionConfig.js` in `@tamanu/database`, so `DATABASE_URL` when set). A narrower role was considered and dropped: the supervisor holds the token signing secret, so a compromised supervisor can already act as any user through the api, and a separate role would need grants kept in step with the schema and its triggers, plus provisioning on every platform.

### Scheduled tasks

- Classify every task in `packages/central-server/app/tasks/` and `packages/facility-server/app/tasks/` as time-driven or activity-driven. Each task declares it. Check that catch-up "runs once" is right for each time-driven task (the bed fee charger must not drop days).
- Time-driven tasks feed queues (vaccination reminders feed the email processor, the report scheduler feeds report requests); a timed wake ends only once those queues are empty.
- Busy check at sleep: an api endpoint, for the supervisor only, reporting whether a task is running or any work queue has pending items.
- Time-driven tasks report their next due time, including report schedules stored in the database. The sleep-time endpoint returns the earliest.
- `node-schedule` skips runs missed while down: add last-ran bookkeeping per task, and a run-once-on-start for tasks whose due time passed.

### Facility partial wake

- The facility supervisor authenticates to central with the facility's sync credentials, read at sleep from `local_system_facts` (`FACT_SYNC_EMAIL`, `FACT_DEVICE_ID`, central host) and `local_system_secrets` (password, decrypted with the facility's key file, which is mounted into the supervisor). If central is asleep, central's supervisor serves that login.
- The partial wake ends when the facility's last successful sync completed after the wake started (read from the facility database), or at the time bound.

### Other notes

- Last-seen writes are throttled: update only when the stored value is older than a few minutes.
- `SendStatusToMetaServer` is dead in every deployment: remove it rather than have the supervisor stand in for it while asleep.
- A forgotten web tab keeps a facility awake through its polling unless idle logout logs it out; card V13 pauses polling while the tab is hidden.

## Order of work

The work lands as three pull requests: phase 1, phase 2, then phases 3 to 9.

- **Pause after phase 1 and after phase 2.** Stop once the phase is built and pushed, and wait for the user before starting the next phase, so each lands as its own PR.
- **Every sync code-owner change is in phase 2**, so the sync owners review one PR. The code-owned paths are `packages/shared/src/sync/`, `packages/facility-server/app/sync/`, `packages/central-server/app/sync/`, `packages/mobile/App/services/sync/` and `packages/database/src/sync/` (see `CODEOWNERS`). Phases 1 and 3 to 9 change nothing under them. Anything later phases need from that code is built in phase 2 and only called afterwards.

### 1. Clean-up and socket call sites (PR 1, then pause)

No changes under sync code-owned paths: the call sites use the existing `whoami()` and `fetch` on each `CentralServerConnection`.


- [x] Remove `SendStatusToMetaServer`: `packages/shared/src/tasks/SendStatusToMetaServer.js`, its export in `packages/shared/src/tasks/index.js`, its registration in `packages/central-server/app/tasks/index.js` and `packages/facility-server/app/tasks/index.js`, the `sendStatusToMetaServer` schedule, and its tests. `FACT_META_SERVER_ID` stays: it is in `SERVER_IDENTITY_FACTS`, which `forget_server_identity()` clears, and changing that list needs a migration. `metaServer.hosts`, `serverId` and `timeoutMs` stay, since the upgrade step reads the hosts. Keep `metaServer.updateUrls` (used by `versionCompatibility`)
- [x] Facility `packages/facility-server/app/routes/apiv1/patient/patientContact.js`: make an HTTP request to central (`wakeCentral`, in `app/utils`, over the existing `CentralServerConnection.whoami()`; a failure is logged and the emit goes ahead, since socket.io buffers it) before emitting `PATIENT_CONTACT_INSERT`, without holding up the response
- [x] Facility `packages/facility-server/app/routes/apiv1/telegram/telegramRoutes.js`: same before `TELEGRAM_GET_BOT_INFO`, and time out the wait for the bot info reply with an error
- [x] Mobile `App/ui/contexts/ReminderContactContext.tsx` and `App/ui/navigation/screens/home/PatientDetails/ReminderContactQR/Screen.tsx`: same before each emit, through the existing `CentralServerConnection.fetch`
- [x] Tests for the facility routes: the HTTP request precedes the emit; the bot info route errors on timeout

### 2. Changes-pending check (SYNCHK, LOOKUP, SYNRUN) (PR 2, then pause)

All sync code-owned changes for the card, including what the supervisor will later call.

Central:
- [x] `getHighestRealChangeTick` in `packages/central-server/app/sync/`: max settled `updated_at_sync_tick` from `sync_lookup` (excluding the pending-update flag), served by the existing index; confirm with `EXPLAIN`
- [x] Route `GET /api/sync/pending?since=<tick>` in `buildSyncRoutes.js`, answering `{ changesToPull }`, taking the pull cursor, requiring a device with the sync client scope, answering pull or nothing; always pull when `config.sync.lookupTable.enabled` is false
- The supervisor's own routes (lookup refresh, busy, next due) are not in this phase: they and the build lock touch no code-owned path and land in phase 5
- [x] Tests in `packages/central-server/__tests__/sync/`: tick ignores pending flags and moves only on real changes; never-pulled answers pull; disabled lookup answers pull

Facility (`packages/facility-server/app/sync/FacilitySyncManager.js`):
- [x] Only a sync whose trigger type is `scheduled` (the schedule, including start-up) checks; the existing `this.reason` carries it
- [x] Export a `hasUnpushedChanges(models)` helper from `packages/facility-server/app/sync/` (any synced row with `updated_at_sync_tick` above `FACT_LAST_SUCCESSFUL_SYNC_PUSH`); the facility supervisor calls it at sleep in phase 5
- [x] For scheduled syncs: skip the check when `hasUnpushedChanges`; otherwise call the check and stop on "nothing", still running the post-session provisioning (sync user swap, settings PSK)
- [x] `CentralServerConnection`: add the check call; on `503` with `Retry-After`, wait and retry within the attempt for the check and for session start
- [x] Run history: a run the check answers with nothing to pull is recorded as succeeded with no session (dbt model docs); it moves the last successful sync time but not the pull cursor
- [x] Tests: each skip rule, the up-to-date outcome, the retry on `503`

Mobile (`packages/mobile/App/services/sync/`):
- [x] A `scheduled` flag on the existing `triggerSync({ urgent })` options, passed only by `BackendManager`'s periodic sync
- [x] For scheduled syncs: skip the check when there are outgoing changes or `tablesForFullResync` is set; otherwise check and stop on "nothing", updating the displayed last-synced time only
- [x] `CentralServerConnection.ts`: the check call, and `503` with `Retry-After` handling for the check and session start
- [x] Tests in `MobileSyncManager.test.ts`

Decisions made while building:
- A 503 counts as central waking only when it carries a `Retry-After`; one without is an ordinary error, so an outage fails rather than parking the sync. Facility waits up to 60 s per retry and 30 minutes in all (`sync.centralWake` config); mobile waits 1 to 30 s per retry and 10 minutes in all.
- The waiting itself is `TamanuApi.whileServerWakes` in `@tamanu/api-client`, opt-in per connection, so the facility, web and the supervisor's own clients share one implementation. Mobile keeps its own copy: it has its own axios client and does not depend on that package (card W13).
- No fallback for a central without the route: central's version check keeps facilities and devices on its own minor version. An answer without the flag fails the sync, so a fault shows rather than being covered by a session.
- The tick read is a backward index-only scan of the existing `updated_at_sync_tick` index; no migration.
- A run with nothing to pull is recorded as `succeeded`, not a status of its own, so alerting that reads run history needs no change. It moves the facility's last completed time but not the pull cursor.

### 3. Supervisor package skeleton (SUPV) (PR 3 starts)

From here on, nothing changes under sync code-owned paths.


- [ ] New workspace package `packages/supervisor` (`@tamanu/supervisor`), added to the root `workspaces`; entry point and config through `config` like the servers
- [ ] Config: role (central or facility), listen address, part upstreams, actuator URL (optional), Caddy and Postgres binary paths, data directory, idle time (default 30 minutes), supervisor credential for central's api; the database connection through `@tamanu/database`'s `connectionConfig.js`, as the servers do
- [ ] Caddy child process: generate the JSON config (Tamanu's server block: paths per part, rate limits, error and waking pages), start Caddy with the admin API on a Unix socket, reload routes through it; h1 and h2c on one listener
- [ ] Port the routing from `packages/web/Caddyfile.docker` and the infra Linux templates' server block (paths only; TLS and WAF stay with the platform)
- [ ] Request log on a pipe: parse start and end of each request, classify exempt requests (health, monitoring, `/api/sync/pending`, timesync, central login and refresh, supervisor probes)
- [ ] Status endpoints: server state, per-part state, last sleep or wake failure, database clear for writers, supervisor health
- [ ] Without an actuator: route only, never start Postgres
- [ ] Tests: routing switch without dropping in-flight connections; activity classification

### 4. Actuator contract (SLPWK#actuator-contract)

- [ ] `packages/supervisor/actuator/v1.openapi.yaml`: `PUT`/`GET /v1/state`, per-part desired and observed state
- [ ] Typed client in the supervisor, with polling until ready or stopped
- [ ] Fake actuator for tests and local runs: drives `npm` processes or just records state
- [ ] Let infra (card Y3) know the contract file exists

### 5. Sleep and wake (SLPWK)

Central's supervisor-only routes go first. They touch nothing under the sync code-owned paths: the build lock is taken by both callers (the route and `SyncLookupRefresher`, in `app/tasks`) around `centralSyncManager.updateLookupTable()` rather than inside it. A first version, with tests, is in this branch's history at commit `d43d9b606e` (`app/supervisor/index.js`, `app/tasks/pendingWork.js` and the task edits, `__tests__/supervisor/supervisorRoutes.test.js`, the `supervisor.token` config); its lock sits inside `CentralSyncManager`, to be moved out.

- [ ] Supervisor-only routes on central's api behind a bearer token from config (`supervisor.token`, `SUPERVISOR_TOKEN`; unset rejects everything), mounted before user authentication: `POST /api/supervisor/lookup-refresh` (an on-demand lookup build, answering the highest real-change tick; errors if the build aborts) and `GET /api/supervisor/busy` (pending queue counts). A task running in the tasks process is not visible to the api and is covered by the graceful stop below
- [ ] Advisory lock shared by the scheduled and on-demand lookup builds, taken by `SyncLookupRefresher` and the route, so the two never run together; a build asked for while another runs waits for it
- [ ] Idle timer from the activity stream, counting in-flight requests
- [ ] State machine persisted on the data directory: awake, going to sleep (with the step reached), asleep, waking, partial wake; every step idempotent
- [ ] Sleep sequence: close the door, busy check, stop tasks, fhir and sync, central final build and next due time, facility reads (cursor, phase 2's `hasUnpushedChanges`, next due time, sync credentials through `serverConfig.js`), stop api and web, central copy, stop database; cancel and roll forward to a wake on activity or a failed step
- [ ] Migration state check before sleeping (compare `SequelizeMeta` to the release's migrations)
- [ ] Wake sequence: database, central hand-back, other parts, forward per part as each is ready; retry a stalled wake
- [ ] Waking responses: `503` with `Retry-After` for API paths, the waking page (polls supervisor status, then reloads), `503` for websocket upgrades
- [ ] Between-states serving on central (forward to api when up; held tick; waking response for logins while the copy is unavailable)
- [ ] Graceful stop for the tasks process: finish the running task on `SIGTERM` (check `startTasks.js` and `ScheduledTask`)
- [ ] Tests with the fake actuator: each sequence, cancellation at each step, restart at each step

### 6. Supervisor Postgres and the copy (ASLEEP)

- [ ] Postgres child process: `initdb` on first start in the data directory, the tuned settings above with `fsync` on, contrib extensions
- [ ] CI step (in `ci.yml` and the release build): migrate an empty database, prune to the allowlist (`logs` schema structure only), `pg_dump -s --no-owner --no-privileges` with the oldest supported major's `pg_dump`, shipped in the supervisor package
- [ ] Copy at sleep: load schema, then each table in its own `COPY` with triggers off; checksums of the seven read-only tables; then install the change-tracking trigger on the three written tables
- [ ] Central context against the copy: `initDatabase` on the copy, settings reader, auth secret from config; mount central's `login` and `refresh` handlers from `packages/central-server/app/auth/` on the supervisor's Express app unchanged
- [ ] Changes-pending check from the held tick: the supervisor's own route, with the same rule as central's handler (a device that never pulled, or a tick above its cursor, has changes)
- [ ] Logins from unknown devices and logins with no device get the waking response and start a wake
- [ ] CI drift guard: run `__tests__/auth/login.test.js`, `refresh.test.js`, `jwt-validation.test.js` and the check's tests against a database built from the allowlist schema
- [ ] Measure the memory floor and copy time again with `fsync` on

### 7. Hand-back and restarts (ASLEEP#handing-back, SUPV#resilience)

- [ ] Hand-back: upsert tracked rows by common columns (devices by id, refresh tokens by user and device, login attempts insert only; last-seen only when later), triggers on, one transaction; then delete the copy
- [ ] Checksum comparison before hand-back, reported on mismatch
- [ ] On start: resume from the persisted state; a different release than the copy's means wake; finish an interrupted hand-back
- [ ] Database-clear status for migrations
- [ ] Tests: hand-back after login, refresh rotation, failed logins and new last-seen; repeated hand-back; hand-back from a copy with an extra or missing column

### 8. Partial wakes and scheduled tasks (SLPWK#partial-wakes, #scheduled-tasks)

- [ ] Facility: on the sync schedule, partial wake when unpushed changes were held; otherwise the check against central with the held credentials and cursor; end when the facility's last successful sync is after the wake started, or on no progress
- [ ] Classify every task in `packages/central-server/app/tasks/` and `packages/facility-server/app/tasks/` (a `kind` on each `ScheduledTask` subclass); time-driven tasks expose their next due time (cron next fire, or from the database for `ReportRequestScheduler`)
- [ ] Supervisor-only next-due-time route on central's api (beside phase 5's lookup-refresh and busy routes, same credential), returning the earliest next due time of the time-driven tasks
- [ ] Last-ran bookkeeping per task (a `local_system_facts` key per task, or a small table) and run-once-on-start for missed runs in `ScheduledTask`
- [ ] Timed partial wake: database and tasks (plus api on central); end once due tasks have run and their queues are empty
- [ ] Facility time-driven next due time read at sleep from the facility database
- [ ] Tests: catch-up runs once; bed fee charger does not drop days across a sleep; timed wake ends with empty queues

### 9. Packaging and docs

- [ ] `Dockerfile`: `supervisor` target with Node, Caddy (with `rate_limit`), Postgres server and contrib
- [ ] `cd-package-servers.yml`: Linux and Windows bundles of the supervisor (Caddy and Postgres provided by the installation)
- [ ] Support pack: `docs/runbooks/sync-facility-stale.md` and `docs/healthchecks.md` for facilities that open no session when idle, and for sleeping servers
- [ ] Hand infra (Y3) the image name, config keys, the contract file, and that the facility supervisor needs the facility's key file
