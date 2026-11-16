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
- The specs land separately from the sync PR.

## Order of work

- [x] **PR 2 (#11617, reworked):** a waking central queues the sync, facility and mobile, with tests. Nothing else. The earlier version of this branch is kept locally as `archive/l13-2-changes-pending`; it holds a first version of central's busy route (`app/supervisor/index.js`, `app/tasks/pendingWork.js`, at `d43d9b606e`) and of `TamanuApi.whileServerWakes` (at `2801922c59`), both reusable.
- [x] **PR 3: specs.** Cut the specs on main down to what the code has, so each supervisor PR lands its own specs with its code:
  - Supervisor (SUPV), Sleep and wake (SLPWK) and Serving central while asleep (ASLEEP): deleted. Drafts for the new model, to bring back with PR 4 and 5, are in commit `231c44ace2` (on the earlier `workhorse/l13-3` branch, kept locally).
  - SLPWK's "Client requests that wake central" moved to its own spec, Waking central before socket messages (CWAKE), without the Telegram webhook and polling lines, which depend on the supervisor.
  - Changes-pending check (SYNCHK): reduced to "Syncing with a waking central" at `specs/sync/waking-central.md`. Same id and "While central wakes" heading, which PR 2's code cites.
  - Sync lookup table (LOOKUP): "Refreshing on demand" deleted. Run history: the "up to date" outcome deleted.
- [ ] **Supervisor phases**, outside the sync code-owned paths, as three PRs, each started once the one before is approved, and each landing the specs for what it builds:
  - PR 4: supervisor skeleton, actuator contract, sleep and wake. Brings back SUPV and SLPWK (without its scheduled tasks section), with the Telegram webhook and polling lines in SLPWK
  - PR 5: scheduled tasks, with SLPWK's scheduled tasks section
  - PR 6: mobile, health, packaging and docs

### Supervisor skeleton (SUPV)

- [ ] Workspace package `packages/supervisor` (`@tamanu/supervisor`); config through `config`: role, listen address, part upstreams, actuator URL (optional), Caddy binary path, data directory, idle time per role, the supervisor's credential for its server's api
- [ ] Caddy as a child process: generated JSON config (Tamanu's server block: paths per part, rate limits, error and waking pages), admin API on a Unix socket, routes reloaded through it; HTTP/1.1 and h2c on one listener. Ported from `packages/web/Caddyfile.docker` and the infra Linux templates' server block (paths only; TLS and WAF stay with the platform). Rate limits need the non-stock `rate_limit` module
- [ ] Request log on a pipe, giving start and end of each request; exempt from activity: health probes, monitoring, supervisor probes, time sync, websocket upgrades
- [ ] Status endpoints: server state, per-part state, last sleep or wake failure, supervisor health
- [ ] Without an actuator: route only
- [ ] Tests: switching routes without dropping in-flight connections; activity classification

### Actuator contract (SLPWK#actuator-contract)

- [ ] `packages/supervisor/actuator/v1.openapi.yaml`: `PUT`/`GET /v1/state`, desired and observed state per part
- [ ] Typed client with polling until ready or stopped; a fake actuator for tests and local runs
- [ ] Tell infra (Y3) the contract file exists

### Sleep and wake (SLPWK)

- [ ] Supervisor-only api routes behind a bearer token from config, on both servers: busy (a task running, or a work queue with pending items: report requests, FHIR jobs, communications, integration pushes), next due time of the tasks that cannot sleep, migration state. On a facility also a final-sync route calling `syncConnection.runSync`, as `POST /sync/run` does, answering whether it completed
- [ ] Idle timer from the activity stream, counting in-flight requests
- [ ] State persisted on the data directory: awake, going to sleep (with the step reached), asleep, waking, timed wake; every step idempotent; resume after a restart, and wake when the release changed
- [ ] Sleep: stop forwarding activity, busy check, stop tasks and fhir, facility final sync (not completed: stay awake), next due time, stop sync, api and web, stop database. Activity or a failed step rolls forward to a wake
- [ ] Wake: database, then the other parts; forward per part as each is ready; retry a stalled wake
- [ ] Waking responses: `503` with `Retry-After` for API paths, the waking page for browsers (polls supervisor status, then reloads), `503` for websocket upgrades
- [ ] Facility login against a waking central falls back to local at once: check that a `503` takes the fallback in `centralServerLoginWithLocalFallback` and is not retried with backoff first
- [ ] Graceful stop for the tasks process: finish the running task on `SIGTERM` (`startTasks.js`, `ScheduledTask`)
- [ ] Tests with the fake actuator: each sequence, cancellation at each step, restart at each step

### Scheduled tasks (SLPWK#scheduled-tasks)

- [ ] A can-sleep declaration on `ScheduledTask`, set on every task in `packages/central-server/app/tasks/` and `packages/facility-server/app/tasks/`; tasks that cannot sleep expose their next due time (cron next fire, or from the database for `ReportRequestScheduler`)
- [ ] Last-ran bookkeeping per task and one catch-up run on start for a due time that passed while asleep; the bed fee charger must not drop days
- [ ] Timed wake: database and tasks (plus api on central; plus the final sync on a facility); ends once due tasks have run and the queues they fed are empty
- [ ] Tests: catch-up runs once; bed fees across a sleep; a timed wake ends with empty queues

### Mobile (needs a product check)

- [ ] Stop the periodic sync while the app is idle (`BackendManager`, outside the sync paths), possibly behind a setting
- [ ] "Waiting for central to wake up" while a sync is in line behind a waking central, in place of "Sync in queue"

### Health, packaging and docs

- [ ] A sleeping server reads as healthy: the supervisor's status says asleep; Canopy's stale-sync check reads it (outside this repo)
- [ ] `Dockerfile` `supervisor` target with Node and Caddy (with `rate_limit`); Linux and Windows bundles in `cd-package-servers.yml`
- [ ] Support pack: `docs/runbooks/sync-facility-stale.md` and `docs/healthchecks.md` for sleeping servers
- [ ] Hand infra (Y3) the image name, config keys and the contract file
