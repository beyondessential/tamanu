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
- The supervisor is configured entirely by environment variables, checked for obvious mistakes by the image's `sh` entrypoint, and filled into the shipped Caddyfile.
- Boundary: plain HTTP on fixed ports, no TLS, no hostnames. The patient portal is a second port. The actuator is the only interface outward; the supervisor's own status and health endpoints are read-only.
- Upgrades (V14) reach the supervisor through the actuator contract: the actuator's status says when an upgrade is in progress. Controlling parts is optional in the contract, and an actuator that does not control parts never has its server put to sleep, which is how a platform that only reports upgrades runs it.
- The supervisor serves the web app and patient portal itself. Its image is the release's frontend image, so infra moves deployments over one at a time: by default the frontend and patient portal images serve their frontend alone, as for a deployment that routes to the parts itself, and given the `supervisor` command and its environment the frontend image runs the supervisor. A deployment never has both. Tamanu's error pages then come from the one process that is always up, and the front end stays up while the server sleeps. `web` and `portal` are no longer parts. A browser opening a page while the server is not awake still gets the waking page until the web app can show waking itself.
- Compatibility: every supervisor and server of one release line (minor version) work together in any mix of patches; their contract changes incompatibly only between lines, and always so that upgrades never need the other side stopped or downgraded first. A supervisor restarted alone within a line (for a front-end hotfix) leaves the server asleep or awake as it was. Across lines, the platform replaces the supervisor before it reports the upgrade finished, and the supervisor makes no api calls during an upgrade.
- The actuator holds a lease (with a token it checks on every state change), the supervisor's saved state, and a report from each running supervisor. Every supervisor passes traffic; only the lease holder acts (decides sleep and wake, sets desired state, calls the api), so supervisors can be replaced or run several at once with no gap in traffic. Keeping state with the actuator rather than on a volume or in the database lets a supervisor be replaced while the server sleeps without waking it.
- Busy means work actually running: a scheduled task recorded as running, or a FHIR job queued or started. Queue counts play no part, since `countQueue()` means outbound work for some tasks, housekeeping for cleaners and time-driven work for the discharger. The busy call sets a hold in the same transaction, so no task starts between the check and the stop; tasks check the hold before each run. A busy server is checked again every minute. Nothing waits on `SIGTERM`, so an upgrade or restart stops as fast as it does today.

## Explicitly rejected

- Stopping mobile's periodic sync while the app is idle. An app not in use is backgrounded, and there is no sync in the background, so it already stops syncing.
- Replacing the TLS-terminating Caddy on bare-metal Linux and Windows servers with the supervisor, or giving the supervisor TLS of any kind.

## Order of work

- [x] **PR 2 (#11617, reworked):** a waking central queues the sync, facility and mobile, with tests. Nothing else. The earlier version of this branch is pushed as `archive/l13-2-changes-pending`; it holds a first version of central's busy route (`app/supervisor/index.js`, `app/tasks/pendingWork.js`, at `d43d9b606e`) and of `TamanuApi.whileServerWakes` (at `2801922c59`), both reusable.
- [x] **PR 3: specs.** Cut the specs on main down to what the code has, so each supervisor PR lands its own specs with its code:
  - Supervisor (SUPV), Sleep and wake (SLPWK) and Serving central while asleep (ASLEEP): deleted. Drafts for the new model, to bring back with PR 4 and 5, are pushed as `archive/l13-supervisor-specs` (commit `231c44ace2`).
  - SLPWK's "Client requests that wake central" moved to its own spec, Waking central before socket messages (CWAKE), without the Telegram webhook and polling lines, which depend on the supervisor.
  - Changes-pending check (SYNCHK): reduced to "Syncing with a waking central" at `specs/sync/waking-central.md`. Same id and "While central wakes" heading, which PR 2's code cites.
  - Sync lookup table (LOOKUP): "Refreshing on demand" deleted. Run history: the "up to date" outcome deleted.
- [ ] **Supervisor phases**, outside the sync code-owned paths, each started once the one before is approved, and each landing the specs for what it builds:
  - [x] PR 4a (#11700, merged): server side. Scheduled task run state, the task hold, and the `/api/supervisor` routes on central and facility. No specs: nothing is observable without the supervisor, and SUPV and SLPWK land with PR 4b
  - [x] PR 4b (on this card's branch): the supervisor as a Caddy build, the actuator contract, and sleep and wake. Brings back SUPV and SLPWK (without its scheduled tasks section), with the Telegram webhook and polling lines in SLPWK
  - PR 5: scheduled tasks, with SLPWK's scheduled tasks section
  - PR 6: health, packaging and docs
  - [ ] Mobile waiting message: its own small PR, branch `feat/L13/mobile-waking-central-message`; held until product confirms the wording

### PR 4: the supervisor (SUPV, SLPWK)

Server side (JS):

- [x] Scheduled task run state: a table that does not sync and is not change-logged (as `sync_facility_runs`), one row per task with running since, last started and last finished; `ScheduledTask` records each run there; the tasks process clears running state when it starts
- [x] Task hold: a single row holding an expiry; `ScheduledTask` skips a run while a hold is current, and checks it in the same transaction that records the run as started
- [x] Supervisor api routes on central and facility, under `/api/supervisor`, behind a bearer token from the `SUPERVISOR_TOKEN` environment variable, compared in constant time, rejected when unset:
  - `POST /tasks/hold`: in one transaction, set the hold with an expiry, then check for running tasks and FHIR jobs queued or started; busy releases the hold and answers busy
  - `DELETE /tasks/hold`: release the hold
  - `GET /status`: the release version, for the migration check
  - facility only, `POST /final-sync`: run a sync as `POST /sync/run` does, answering whether it completed
- [x] Tests for each route and for task runs under a hold

Supervisor (Go, `packages/supervisor`):

- [x] Go module with `cmd/supervisor/main.go` importing Caddy's standard modules, `caddy-ratelimit` and Tamanu's modules; `go build` gives the binary, no `xcaddy` needed
- [x] `caddy tamanu-supervisor` command: read and check the environment (role, listen addresses for the server and the portal, part addresses with lists comma-separated, actuator URL, idle time with a default per role, api token, data directory), build Caddy's config, run it
- [x] Routes for each role: `/api/*` and `/v1/*` to the api pool (least connections, no-store), `/v1/login` 308 to `/api/login`, the frontend for the rest, the portal port to the portal frontend with the same api routes; rate limits 1000/s per IP on the api and 10/s on `/api/login`; error pages, zstd and gzip, no-cache on `/`, `/manifest.json` and `/env.js`; HTTP/1.1 and h2c
- [x] Gate handler at the head of each route, carrying the route's class (activity, exempt, websocket) and part: counts activity from start to end, forwards when the part is ready, otherwise answers the waking response (`503` with `Retry-After` for API paths, the waking page for browsers) and starts a wake, or the upgrading response while an upgrade is in progress; websocket upgrades get `503` and do not wake
- [x] Exempt from activity: health probes (`/`, `/api/public/ping`), time sync (`/api/timesync`), supervisor probes
- [x] App module: idle timer from the gate, the sleep and wake state machine, state persisted as JSON in the data directory, resume after a restart, wake when the persisted state came from another release
- [x] Sleep: stop forwarding activity, `POST /tasks/hold` (busy: release, keep forwarding, check again in a minute), stop tasks and fhir, facility final sync (not completed: release and stay awake), stop sync, api and web, stop the database. Activity or a failed step wakes from wherever the sleep reached
- [x] Wake: database, then the other parts; forward to each part once ready; release the hold; retry a stalled wake
- [x] Without an actuator, or with one that does not control parts: route only, never sleep
- [x] Actuator contract `packages/supervisor/actuator/v1.openapi.yaml`: `GET /v1/state` (whether it controls parts, each part's desired and observed state, whether an upgrade is in progress) and `PUT /v1/state` (desired state per part); a client polling until each part is ready or stopped; a fake actuator for tests and local runs
- [x] Admin API routes, read-only: server state, each part's state, last sleep or wake failure, upgrade in progress, supervisor health
- [x] Go tests: routes per role, activity classification, the sleep and wake sequences against the fake actuator, cancellation and restart at each step
- [x] CI job building and testing the Go module; a `supervisor` Dockerfile stage
- [x] Every supervisor passes traffic, holder or not: the holder announces the phase (numbered) in its report, every other supervisor follows the newest announcement and says so in its own report, and forwards to parts the actuator reports ready
- [x] The holder's idle check goes by every live report (latest activity, in-flight count); a wake request at any supervisor is reported at once and the holder starts the wake
- [x] Sleep barrier: after announcing going-to-sleep, nothing stops until every live report follows that announcement with nothing in flight; an expired report is no longer waited for
- [x] On `SIGTERM` the holder releases the lease and keeps passing traffic while Caddy drains; readiness is having read the actuator's state, whether or not holding the lease
- [x] The frontend images are built on the supervisor binary (a Caddy build) and serve their frontend with the existing `Caddyfile.docker` by default; `supervisor` as the command runs the supervisor
- [ ] Tell infra (Y3) and V14 the contract file exists

Built as PR 4a (#11700, server side, merged) and PR 4b (this card's branch, the supervisor). Notes from the build:

- The supervisor checks the server's release before setting the hold, since the check has no side effects.
- A failed hold release never blocks a wake; the hold expires by itself.
- A cancelled sleep lets an actuator stop request already sent finish, so it cannot land after the wake's start.
- An upgrade starting mid-sleep is seen at the next actuator poll; the server wakes once the upgrade ends.
- `TAMANU_SUPERVISOR_TRUSTED_PROXIES` names the proxies whose forwarded client address the rate limits use.
- A facility with sync disabled can never complete its final sync, so it never sleeps.
- Announcements are a lease token and sequence pair, so a new holder's first announcement beats every earlier one with nothing carried over; every supervisor polls the actuator every second; the sleep barrier gives up after a minute and counts as a failed sleep.

### Making the supervisor smaller

The supervisor came out far larger than a small component should be. The decision stays with the supervisor: moving it to the actuator only moves the cost to infra. Settled so far:

- Routing is a Caddyfile shipped with the release, not generated in Go. Lists are space-separated, so Caddy splits them itself. The `tamanu` app's settings (actuator address, idle time, api token) are a block in that Caddyfile, parsed by our module with Caddy's own types.
- The image's entrypoint is a POSIX `sh` script. With no `supervisor` command it runs Caddy with its arguments, so the default old-layout mode is unchanged. With `supervisor` it checks each required variable is set and non-empty, checks the obvious formats (role, `host:port` addresses, an `http(s)://` actuator address, a duration-looking idle time), rejects unknown `TAMANU_SUPERVISOR_*` names, picks the role's Caddyfile and the portal's block when its address is set, and runs `caddy run`. It catches the obvious mistakes only; the operator follows the documented contract.
- This removes the `config` and `routes` packages and the `tamanu-supervisor` command. The smoke tests stay, run against the shipped Caddyfile.

- No saved state. A new lease holder reads the phase from the actuator's part states: every part desired and observed down is asleep, and stays so; anything else is woken, so a sleep cut short by a restart becomes a wake. This drops the saved-state record and its contract endpoint, step tracking and resuming a sleep, and the saved release check (upgrades already wake through the actuator). The last failure is kept in memory only, so a new holder shows none until it meets one itself.
- Several supervisors per server stay: the lease, reports and sleep barrier remain, and the lease only decides who acts.
- Tests are reviewed for what earns its place, then rewritten table-driven alongside the code changes. The review (about 3,800 test lines to about 1,900, fakes and helpers about 1,000 to 850):
  - Gone with their code: config, routes and persist tests. The smoke tests stay, run against the shipped Caddyfile.
  - State package tests cut but the concurrent activity test; they repeat what the gate tests check through the gate.
  - Folded into tables: the gate's page, index and browser tests into `TestGate`; upgrades by when they start; release checks; hand-over cases; the sleep barrier; api instance failover; status endpoints.
  - Cut as plumbing the machine tests already exercise: actuator and api client round trips, the large-token announcement test, the page copy lint, `SameLine`.
  - `cmd/fake-actuator` and the fake's `/fake/*` endpoints go; the in-process smoke test covers the same flow.
  - New: a table of how a new holder reads the phase from part states.
  - Gaps filled: a sleep barrier that times out, losing the lease mid-sleep or mid-wake, the entrypoint script (missing and malformed variables, the default Caddyfile mode), and a path-to-behaviour table in the smoke test (websockets, time sync, an ordinary api path).

Build order, on this card's branch (#11712):

- [x] Specs: SUPV and SLPWK without the saved state (resilience, compatibility, the actuator contract), and configuration as the entrypoint's contract
- [x] Drop the saved state: `internal/persist`, the contract's saved-state endpoint and the fake's, step tracking and resuming; a new holder reads the phase from part states. New-holder table test
- [x] Caddyfile routing: the shipped Caddyfiles, the `tamanu` app's Caddyfile block, the `sh` entrypoint with its test table, the Dockerfile; remove `internal/config`, `internal/routes` (but the smoke tests) and `internal/command`. Smoke tests against the Caddyfile, with the path table
- [x] Test review cuts and merges, package by package, and the remaining gap tests. The tests came to about 2,800 lines rather than 1,900: the machine's tests stayed near 1,200, the gap rows and the per-supervisor harness taking what the merges saved. The upgrade table caught a wake that went on starting parts after an upgrade began mid-wake, now fixed
- [x] Remove `cmd/fake-actuator`; README and PR description
- [ ] Then triage the open review issues against what is left, since many touch removed code

### Rust instead of Caddy (draft, under discussion)

Proposed with Edwin: drop Caddy and Go, and write the supervisor in Rust. Go would be Tamanu's only Go, while Rust is already in Tamanu's build (the toolbox image compiles bestool) and is BES's language for server tooling. A purpose-built server should also sit well under the Caddy build's memory floor. Supersedes the Caddy decisions above (Decisions, and "Making the supervisor smaller") once agreed; the Go version is then archived as a pushed branch, like the earlier designs.

Premises:

- The whole supervisor moves, not only the proxying: the gate, the sleep and wake machine, the actuator and api clients, the pages and the status server. The Go module, `entrypoint.sh`, the supervisor's Caddyfiles and both `Caddyfile.docker` go.
- One binary with two modes. The frontend mode serves one built frontend alone, as each `Caddyfile.docker` does today (web app and patient portal, Linux and Windows images), and is the images' default. `supervisor` runs the supervisor. The image contract is otherwise unchanged.
- The actuator contract, the api's supervisor routes, the specs' behaviour and the environment variables are unchanged. Only the spec line naming Caddy changes.

Proposed decisions:

- Routing is Rust code, not a config file. The routes are fixed per release and their differences are the role and whether a portal is served, which is already environment. A config file would mean writing a parser and a route interpreter: a small Caddy, with its own tests. Routes in code are one table of path to route class, tested directly, and the gate is typed into each route instead of named in text.
- Configuration stays environment variables, same names and defaults, parsed and checked in Rust with every problem reported at once. This replaces `entrypoint.sh`, its test table, the `_TAMANU_SUPERVISOR_*_PORT` workaround and `supervisor adapt`; a `--check` flag validates and prints the configuration with the token redacted. The frontend mode keeps `BIND_ADDRESS`, comma-separated.
- Stack: tokio; hyper 1 with hyper-util (server detecting HTTP/1.1 or cleartext HTTP/2 per connection, and one pooled client for everything outbound); axum for routing; tower-http for files, compression and request tracing; governor for rate limits; serde for the JSON; tracing for logs. Versions pinned with `cargo add`.
- No TLS anywhere in the supervisor, inbound or outbound. The actuator is reached over plain HTTP like the api, so its address must be `http://`, and the platform keeps the actuator and the supervisor on a private network, since the bearer token crosses it in the clear (in the pod, or restricted by network policy). This matches the boundary already in the specs, where TLS belongs to the platform, and drops reqwest and rustls: the actuator and api clients are thin JSON calls on the same hyper-util client the proxy uses.
- The actuator contract stays HTTP and JSON, as handed to infra. A Unix socket would only work with the actuator in the supervisor's pod, and gRPC would add protobuf tooling to both sides for a handful of calls.
- Own reverse proxy on hyper-util's client, not a proxy crate: least connections, retrying a failed connect on the next instance, and the gate's accounting all need hooks inside the proxy.
- One crate at `packages/supervisor`, library and binary, its modules mirroring the Go packages. The release is stamped at build time from a `TAMANU_VERSION` variable read with `option_env!`, so a version bump recompiles only the crate itself.
- Linux image: a static musl build in a `rust:alpine` stage, with BuildKit cache mounts for the registry and target directory. Windows image: built natively on the Windows layer job's runner (already `windows-latest`), replacing the download of `caddy.exe`.

What Caddy does today, which the Rust build does itself:

| Concern | Today | Rust |
| --- | --- | --- |
| Listeners | `bind` lists, h1 and h2c | One tokio listener per address, hyper-util auto connection builder |
| Static files | `file_server`, precompressed zstd, br, gzip | tower-http `ServeDir` with its precompressed variants |
| Web app routes | `file {path} {path}/ /index.html` | Index fallback for paths that are not files, but `/env.js` |
| `/env.js` | `respond` with `{env.*}` | Rendered once at start from the same variables |
| Cache headers | `header` per path | Set per route class |
| Compression | `encode zstd gzip` | tower-http compression layer on api and page routes |
| Error pages | `handle_errors` and `tamanu_error_page` | The error page module, on proxy failures and missing files |
| Proxying | `reverse_proxy`, least_conn, 2 retries within 5 s, keepalive 2 min | Own proxy: in-flight count per instance, retry on connect failure, pooled keepalive; hop-by-hop headers removed, `X-Forwarded-*` set |
| Websockets | `reverse_proxy` upgrade | hyper upgrade on both sides, then a bidirectional copy |
| Client address | `trusted_proxies` strict | The nearest untrusted address in `X-Forwarded-For` |
| Rate limits | caddy-ratelimit sliding windows | governor GCRA keyed by client address: one timestamp per address instead of a buffer of events, swept periodically |
| Stopping | `grace_period 10s` | Graceful shutdown bounded at 10 s, lease released first |
| Logs | Caddy's JSON access log on stderr | tracing JSON on stderr |
| Status | `tamanu_status` on a loopback server | Same, a second axum router |

The gate counts a request from its start until its response body has finished, so a long download or sync pull counts as activity throughout: the response body is wrapped in a guard that ends the count when it is dropped.

Order of work, replacing the Go module on this card's branch (#11712), which has not merged:

- [ ] Archive the Go version as `archive/l13-supervisor-go`
- [ ] Crate skeleton, configuration from the environment with its error table, CI job (build, test, clippy, fmt), Dockerfile stage
- [ ] Frontend mode, then the frontend and patient portal images and the Windows images moved onto it; delete both `Caddyfile.docker`. Checked once against the Caddy images, path by path: status, headers, body, encoding
- [ ] Proxy: instance pool, least connections, connect retries, client address, websockets, compression, rate limits
- [ ] State, gate, pages, error pages and status server
- [ ] Actuator client and fake actuator, api client and fake api
- [ ] Sleep and wake machine, its tests ported as tables
- [ ] In-process smoke tests replacing the Caddyfile ones, with the path-to-behaviour table
- [ ] Remove the Go module, its CI job and `entrypoint.sh`; README, the spec line naming Caddy, and this plan's decisions
- [ ] Measure idle and loaded memory against the Caddy build and record it here

- The Caddy that fronts bare-metal Linux and Windows servers stays: it terminates TLS and holds the hostnames, which the supervisor never does. It is the platform's side of the boundary there, as infra's ingress is on Kubernetes.

- No deployment overrides the frontend images' command or mounts a Caddyfile into them, so the frontend mode only has to keep what they rely on: port 3000 by default (`BIND_ADDRESS` to change it), `200` on `/` for probes, `/env.js` from `NODE_ENV`, `REVISION` and `BUGSNAG_API_KEY`, and running as a non-root user. Checked in infra's Kubernetes renderer (image default, `PORT` set but unread, a 100 MiB memory limit), and the Linux quadlets in ops (image default, behind the host Caddy on port 3000). The Windows images run the entrypoint our own image config declares. Canopy's redirect runs the upstream Caddy image, not ours.

Secure defaults. Caddy's best-known one, automatic HTTPS, is already off in the supervisor (TLS is the platform's), so what the Rust build has to match are its quieter defaults, each made explicit and covered by a smoke test row:

- Slow clients: Caddy waits at most a minute for request headers and five minutes on an idle connection, and drops a connection whose body read or response write stalls for a minute (reset on every read or write, so large sync payloads are unaffected). Rust: hyper's header read timeout, which also bounds the wait for the next request on a kept-alive connection, and a stall timeout around each connection's socket.
- Forwarded headers: Caddy strips `X-Forwarded-For`, `-Proto` and `-Host` from clients outside the trusted proxies before setting its own. Rust: the same, before the request reaches any route, so neither the rate limits nor the api ever see a client's own.
- Path matching: Caddy matches paths case-insensitively, with dot segments resolved and doubled slashes merged, so a crafted path cannot slip past a route such as the refusal of `/api/supervisor`. Rust: routes classify a normalised copy of the path (percent-decoded, lowercased, dot segments resolved, slashes merged), and a path that decodes to a slash, a backslash or a NUL is refused with `400`. The request is forwarded with its path unchanged.
- Proxying: hop-by-hop headers, and any named in `Connection`, are removed both ways; `Upgrade` passes only on the websocket route. hyper rejects conflicting or malformed body framing, and the client frames every forwarded body afresh, so a request cannot be smuggled to the api.
- Limits: hyper's bounds on header size, and on HTTP/2 concurrent streams and reset streams (the rapid reset attack), kept at their defaults, which are no looser than Caddy's.
- Files: the file server never leaves its root and never lists directories.
- Admin surface: none listening outward. Caddy's admin API is off today; the status server stays loopback and read-only.
- Responses: Tamanu's own error pages, never an upstream's error text. Caddy adds no security headers by default, so neither does this.
- `/env.js` is serialised as JSON, where today's Caddy template pastes the variables unescaped into JavaScript template literals, which would run any `${…}` in them.
- The crate forbids `unsafe` code, and CI checks its dependencies against the RustSec advisory database.

Logging. Today the frontend images' Caddy writes an access line per request (the URI with its query string, and every request header, with only cookies and authorisation redacted), and the supervisor writes no access log, but Caddy's error log carries the full URI and headers of every request answered with a `5xx` (an api instance down, say), beside the sleep and wake machine's events.

- One format in both modes: JSON lines on stderr through tracing, each with a UTC time, level, message and fields. The level is set by `TAMANU_SUPERVISOR_LOG` in tracing's filter syntax, `info` by default.
- Never logged, at any level: query strings (the api's searches carry patient names and other details), request and response bodies, header values, and the api token. Paths are logged, as the api's own log does. This is stricter than Caddy, whose logs carry query strings and every header but the credential ones.
- Supervisor mode logs no line for a request it forwards and the api answers, since the api logs each request itself (`getLoggingMiddleware`, at winston's `http` level). It logs what only it knows:
  - its sleep and wake events, with the same messages and levels as now, and fields for the phase, announcement and step;
  - a request it could not forward (no api instance answered), at warn, with the method, path, instance and the kind of failure;
  - a refused path (`/api/supervisor`, or a path that decodes to a slash, a backslash or a NUL), at warn;
  - waking and upgrading responses as a count per wake or upgrade, and rate-limited requests as a count per client address and minute, so a burst or an attack cannot flood the log;
  - at debug, a line per request with its route class and the gate's decision.
- Frontend mode keeps an access line per request at info, as today, with the method, path, status, bytes, duration and client address.

### Later

- [ ] The web app shows waking itself (reads `Retry-After` on a `503`), so a page can load straight into a sleeping server instead of the waking page

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
- [ ] Linux and Windows supervisor binaries in the server bundles (`cd-package-servers.yml`); the supervisor image is already published as the frontend image
- [ ] Support pack: `docs/runbooks/sync-facility-stale.md` and `docs/healthchecks.md` for sleeping servers
- [ ] Hand infra (Y3) the image name, config keys and the contract file
