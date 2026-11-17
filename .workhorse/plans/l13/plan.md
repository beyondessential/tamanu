# L13 plan: supervisor

Infra's side (actuator, pod, routing, hibernation) is infra card Y3.

## The model

Each server sleeps on its own traffic alone.

- A facility sleeps when its own users go quiet: no requests for its idle time (about 30 minutes) and no work in flight. It does one last sync, then stops every part, sync included.
- An awake facility syncs every minute, so central sees no traffic only once every facility is asleep. After its own idle time (15 to 30 minutes) it sleeps too, knowing nothing about facilities.
- Waking happens on use. A facility shows a waking page; its first sync wakes central, and sync already tries again every minute.
- Accepted trade-off: data entered at one facility during a quiet period reaches the others when they are next used.

Dropped with the earlier design: the changes-pending check and its tick, central serving logins and token refreshes while asleep (the copy of login's tables, the supervisor's own Postgres, the hand-back), partial wakes for sync, cross-wakes, and every other change to sync internals.

## Decisions

- The supervisor talks only to its server's api and to the actuator. It has no database connection and no facility key file: busy, next due time, final sync and migration state all come from the api.
- A facility whose final sync does not complete (central unreachable) stays awake and tries again after its next idle time. Unpushed data is work in flight.
- A facility's timed wake for a scheduled task ends with a sync, like any facility sleep.
- Automatic discharge (`OutpatientDischarger`, `DeceasedPatientDischarger`) runs on central.
- Each scheduled task says whether it can sleep: a task that can sleep does not wake a sleeping server when due, and catches up once on the next wake. A task wakes the server unless it declares it can sleep, so a missed declaration costs uptime rather than a skipped run. Only tasks whose output leaves the system on time are expected to wake (scheduled reports, vaccination reminders, patient communications); generators, dischargers, queue processors and cleaners can sleep. If every facility task can sleep, facilities need no timed wakes at all.
- A `503` with a `Retry-After` from central, anywhere before a sync session opens (the session start, or the login or token refresh before it), puts the sync in line as a queued one, on facility and mobile. A `503` without one is an ordinary failure. This is the only change under the sync code-owned paths.
- Specs on main describe only what is built; each supervisor PR lands its own specs with its code.
- The supervisor is a Caddy build carrying Tamanu's Go modules, not a separate process running Caddy. A handler wrapping each route sees every request's start and end in process, so there is no per-request call out, no access-log matching, and no config reload, which would drop websockets and reset Caddy's in-flight metrics. BES already builds Caddy with `xcaddy` (third-party-builds, Seedling), so Go is no new toolchain at BES.
- Routing is generated in Go from the role and the configured part addresses, not shipped as a Caddyfile: the role and portal differences are code, and the routes, the gate and the actuator contract share one list of parts.
- The supervisor is configured entirely by environment variables, read and checked by its own `caddy tamanu-supervisor` command, which builds Caddy's config in memory. No config file.
- Boundary: plain HTTP on fixed ports, no TLS, no hostnames. The patient portal is a second port. The actuator is the only interface outward; the supervisor's own status and health endpoints are read-only.
- Upgrades (V14) reach the supervisor through the actuator contract: the actuator's status says when an upgrade is in progress. Controlling parts is optional in the contract, and an actuator that does not control parts never has its server put to sleep, which is how a platform that only reports upgrades runs it.
- Busy means work actually running: a scheduled task recorded as running, or a FHIR job queued or started. Queue counts play no part, since `countQueue()` means outbound work for some tasks, housekeeping for cleaners and time-driven work for the discharger. The busy call sets a hold in the same transaction, so no task starts between the check and the stop; tasks check the hold before each run. A busy server is checked again every minute. Nothing waits on `SIGTERM`, so an upgrade or restart stops as fast as it does today.

## Explicitly rejected

- Stopping mobile's periodic sync while the app is idle. An app not in use is backgrounded, and there is no sync in the background, so it already stops syncing.

## Order of work

- [x] **PR 2 (#11617, reworked):** a waking central queues the sync, facility and mobile, with tests. Nothing else. The earlier version of this branch is pushed as `archive/l13-2-changes-pending`; it holds a first version of central's busy route (`app/supervisor/index.js`, `app/tasks/pendingWork.js`, at `d43d9b606e`) and of `TamanuApi.whileServerWakes` (at `2801922c59`), both reusable.
- [x] **PR 3: specs.** Cut the specs on main down to what the code has, so each supervisor PR lands its own specs with its code:
  - Supervisor (SUPV), Sleep and wake (SLPWK) and Serving central while asleep (ASLEEP): deleted. Drafts for the new model, to bring back with PR 4 and 5, are pushed as `archive/l13-supervisor-specs` (commit `231c44ace2`).
  - SLPWK's "Client requests that wake central" moved to its own spec, Waking central before socket messages (CWAKE), without the Telegram webhook and polling lines, which depend on the supervisor.
  - Changes-pending check (SYNCHK): reduced to "Syncing with a waking central" at `specs/sync/waking-central.md`. Same id and "While central wakes" heading, which PR 2's code cites.
  - Sync lookup table (LOOKUP): "Refreshing on demand" deleted. Run history: the "up to date" outcome deleted.
- [ ] **Supervisor phases**, outside the sync code-owned paths, each started once the one before is approved, and each landing the specs for what it builds:
  - PR 4a: server side. Scheduled task run state, the task hold, and the `/api/supervisor` routes on central and facility. No specs: nothing is observable without the supervisor, and SUPV and SLPWK land with PR 4b
  - PR 4b: the supervisor as a Caddy build, the actuator contract, and sleep and wake. Brings back SUPV and SLPWK (without its scheduled tasks section), with the Telegram webhook and polling lines in SLPWK
  - PR 5: scheduled tasks, with SLPWK's scheduled tasks section
  - PR 6: health, packaging and docs
  - Mobile waiting message: its own small PR, any time

### PR 4: the supervisor (SUPV, SLPWK)

Server side (JS):

- [ ] Scheduled task run state: a table that does not sync and is not change-logged (as `sync_facility_runs`), one row per task with running since, last started and last finished; `ScheduledTask` records each run there; the tasks process clears running state when it starts
- [ ] Task hold: a single row holding an expiry; `ScheduledTask` skips a run while a hold is current, and checks it in the same transaction that records the run as started
- [ ] Supervisor api routes on central and facility, under `/api/supervisor`, behind a bearer token from config (`SUPERVISOR_TOKEN`), compared in constant time, rejected when unset:
  - `POST /hold`: in one transaction, set the hold with an expiry, then check for running tasks and FHIR jobs queued or started; busy releases the hold and answers busy
  - `DELETE /hold`: release the hold
  - `GET /status`: the release version, for the migration check
  - facility only, `POST /final-sync`: run a sync as `POST /sync/run` does, answering whether it completed
- [ ] Tests for each route and for task runs under a hold

Supervisor (Go, `packages/supervisor`):

- [ ] Go module with `cmd/supervisor/main.go` importing Caddy's standard modules, `caddy-ratelimit` and Tamanu's modules; `go build` gives the binary, no `xcaddy` needed
- [ ] `caddy tamanu-supervisor` command: read and check the environment (role, listen addresses for the server and the portal, part addresses with lists comma-separated, actuator URL, idle time with a default per role, api token, data directory), build Caddy's config, run it
- [ ] Routes for each role: `/api/*` and `/v1/*` to the api pool (least connections, no-store), `/v1/login` 308 to `/api/login`, the frontend for the rest, the portal port to the portal frontend with the same api routes; rate limits 1000/s per IP on the api and 10/s on `/api/login`; error pages, zstd and gzip, no-cache on `/`, `/manifest.json` and `/env.js`; HTTP/1.1 and h2c
- [ ] Gate handler at the head of each route, carrying the route's class (activity, exempt, websocket) and part: counts activity from start to end, forwards when the part is ready, otherwise answers the waking response (`503` with `Retry-After` for API paths, the waking page for browsers) and starts a wake, or the upgrading response while an upgrade is in progress; websocket upgrades get `503` and do not wake
- [ ] Exempt from activity: health probes (`/`, `/api/public/ping`), time sync (`/api/timesync`), supervisor probes
- [ ] App module: idle timer from the gate, the sleep and wake state machine, state persisted as JSON in the data directory, resume after a restart, wake when the persisted state came from another release
- [ ] Sleep: stop forwarding activity, `POST /hold` (busy: release, keep forwarding, check again in a minute), stop tasks and fhir, facility final sync (not completed: release and stay awake), stop sync, api and web, stop the database. Activity or a failed step wakes from wherever the sleep reached
- [ ] Wake: database, then the other parts; forward to each part once ready; release the hold; retry a stalled wake
- [ ] Without an actuator, or with one that does not control parts: route only, never sleep
- [ ] Actuator contract `packages/supervisor/actuator/v1.openapi.yaml`: `GET /v1/state` (whether it controls parts, each part's desired and observed state, whether an upgrade is in progress) and `PUT /v1/state` (desired state per part); a client polling until each part is ready or stopped; a fake actuator for tests and local runs
- [ ] Admin API routes, read-only: server state, each part's state, last sleep or wake failure, upgrade in progress, supervisor health
- [ ] Go tests: routes per role, activity classification, the sleep and wake sequences against the fake actuator, cancellation and restart at each step
- [ ] CI job building and testing the Go module; a `supervisor` Dockerfile stage
- [ ] Tell infra (Y3) and V14 the contract file exists

### Scheduled tasks (SLPWK#scheduled-tasks)

- [ ] A can-sleep declaration on `ScheduledTask`, set on every task in `packages/central-server/app/tasks/` and `packages/facility-server/app/tasks/`; tasks that cannot sleep expose their next due time (cron next fire, or from the database for `ReportRequestScheduler`)
- [ ] Last-ran bookkeeping per task and one catch-up run on start for a due time that passed while asleep; the bed fee charger must not drop days
- [ ] Reuse the task run state from PR 4 for last-ran bookkeeping
- [ ] Timed wake: database and tasks (plus api on central; plus the final sync on a facility); ends once due tasks have run and the queues they fed are empty
- [ ] Tests: catch-up runs once; bed fees across a sleep; a timed wake ends with empty queues

### Mobile

- [ ] While a sync waits in line behind a waking central, the sync screen says it is waiting for central to wake up, in place of "Sync in queue". `MobileSyncManager` is under the sync code-owned paths, so this goes in a small PR of its own

### Health, packaging and docs

- [ ] A sleeping server reads as healthy: the supervisor's status says asleep; Canopy's stale-sync check reads it (outside this repo)
- [ ] Linux and Windows supervisor binaries in the server bundles (`cd-package-servers.yml`), and publishing the supervisor image
- [ ] Support pack: `docs/runbooks/sync-facility-stale.md` and `docs/healthchecks.md` for sleeping servers
- [ ] Hand infra (Y3) the image name, config keys and the contract file
