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
- Supervisor's role on the real database: not yet tested. Loading with triggers off happens in the supervisor's own Postgres, so the real-database role needs no trigger privilege.

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

- [ ] Remove `SendStatusToMetaServer` (central and facility) and its config and settings

- [ ] Changes-pending check on central, with last-seen recording, and the facility and mobile clients using it; the up-to-date run outcome
- [ ] On-demand lookup refresh endpoint returning the highest real-change tick
- [ ] Socket call sites: HTTP request to central before `patient-contact:insert` and `telegram:get-bot-info`; timeout on the facility's bot info route
- [ ] Supervisor skeleton: config, embedded Caddy, routing, Tamanu's server block, status endpoints, no actuator (routing only)
- [ ] Actuator contract OpenAPI file, and a fake actuator for tests
- [ ] Activity tracking from Caddy's log, idle timer, sleep and wake sequences
- [ ] Supervisor Postgres, schema artefact in CI, copy, login and refresh from the copy, changes-pending check from the copy
- [ ] Hand-back, checksums, restart recovery
- [ ] Rollouts: hand-back by common columns, database-clear status
- [ ] Facility partial wakes
- [ ] Scheduled tasks: classification, timed wakes, catch-up
- [ ] Login test suite against the allowlist copy in CI
- [ ] Supervisor container image bundling Caddy and Postgres
- [ ] Support pack: `docs/runbooks/sync-facility-stale.md` and `docs/healthchecks.md` for facilities that open no session when idle, and for sleeping servers
