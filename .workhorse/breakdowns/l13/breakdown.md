---
base: default
---

# Supervisor: the layers after frontend mode

L13 stops at the supervisor's first layer, #11712: `packages/supervisor`, a Rust server that replaces Caddy in the frontend and patient portal images and does nothing else yet. The cards below carry it the rest of the way, landing in order where one builds on another. Every layer leaves existing deployments working unchanged: a deployment moves onto a layer when its platform is ready, and stays as it is until then. Infra's side (the Kubernetes pod, the actuator there, routing in front of the supervisor) is infra card Y3; Seedling's definitions and upgrades are V14.

## Supervisor: route the server's traffic · A18

Make the supervisor the server's front door: the frontend image becomes the server's entrypoint, carries both the web app and the patient portal, and routes the api's traffic itself, so routing ships with Tamanu instead of living in each platform's configuration. Run with the command `supervisor`, the binary does this; run without it, it stays in frontend mode as #11712 left it, so deployments that route to the server's parts themselves keep working, and move over when ready. A deployment uses one or the other, never both.

Routes, classified on a normalised copy of the path (percent-decoded, lowercased, dot segments resolved, doubled slashes merged; a path that decodes to a slash, backslash or NUL gets `400`) and forwarded with the path unchanged:

- `/api`, `/api/*`, `/v1`, `/v1/*` to the api's instances, with `Cache-Control: no-store` and compression
- `/v1/login` redirects with `308` to `/api/login`
- `/api/supervisor` and below gets `404` at the front door: those routes are for the supervisor alone, which calls the api directly
- `/api/socket.io/*` websocket upgrades to the api, each on a connection of its own
- the web app's files and routes as in frontend mode; on central, a second address serves the patient portal, whose api paths still go to the api

The proxy is written on hyper-util's client rather than a proxy crate, since least connections, retries and the gate later need hooks inside it: an in-flight count per api instance picks the least busy, a failed connect is retried on the next instance (twice within five seconds), and kept-alive connections are pooled. Hop-by-hop headers, and any named in `Connection`, are removed both ways, and `X-Forwarded-For`, `-Proto` and `-Host` are set. The client's address is the nearest untrusted one in `X-Forwarded-For` when the peer is one of the trusted proxies; from any other peer those headers are dropped before anything reads them.

The api is reached over pooled HTTP/1.1, which is where request smuggling lives (see https://http1mustdie.com/): a front and back end that disagree on where a request ends let one client's bytes become the start of another's request. Until the api serves HTTP/2 (Y17), the supervisor narrows it:

- hyper parses strictly, and every forwarded request is framed afresh
- requests with both `Content-Length` and `Transfer-Encoding`, a transfer coding other than `chunked`, or more than one `Content-Length` get `400`
- `Expect: 100-continue` is answered by the supervisor and never passed on
- a connection whose exchange ended irregularly (a response before the request body was sent, an error, a timeout) is closed rather than pooled

Rate limits per client address: 1,000 requests a second in bursts of 100 on the api, and 10 a second on `/api/login`, with governor's GCRA, which keeps one timestamp per address and is swept periodically. Test them with many client addresses: the Go build this replaced keyed its limits on a placeholder Caddy does not have, so every client shared one bucket, and its sliding windows took 774 MB for a million addresses against 22 MB here.

Security headers: on the api's responses, helmet's set as central's api and the facility's api and sync process send it today (`helmet({ crossOriginEmbedderPolicy: true, strictTransportSecurity: false })`, helmet 8.1), added only where the api sent none, so responses are the same whether or not the api still runs helmet; `X-Powered-By` removed. Then enforce the content security policy #11712 only reports on the frontends: run Postgres, central, a facility server and both apps locally behind the supervisor, walk each app's main flows with Playwright, collect every report, adjust the policy, and send it as `Content-Security-Policy`. Loading the patient portal without an api already reports one string evaluated as JavaScript, from a `Function(...)` fallback in a bundled dependency.

Upgrades: the supervisor reads the actuator's `GET /v1/state` and, while it says an upgrade is in progress, answers a browser opening a page with Tamanu's upgrading page (`526.html` in the web app's error pages) and every other request for the server with `503` and `Retry-After`; syncs already wait in line on a `503` with `Retry-After`. This is the only actuator call, which is all V14's Seedling upgrades need; no lease, since no supervisor acts on the server yet. With no actuator configured, it only routes. Error pages: a part that does not answer gets Tamanu's page for `502`, `503` or `504`, never the upstream's text.

Status server, on loopback only, read-only, answering JSON. Kubernetes reads it with an exec probe such as `wget -qO- http://127.0.0.1:8081/ready`.

- `/health`: the supervisor's own health, for a liveness probe
- `/ready`: `503` until it knows what to do with requests, which is at once without an actuator, and once it has read the actuator's state with one
- `/status`: the release, the parts, and whether an upgrade is in progress

Configuration is by environment variables, checked at start with every problem reported at once and naming the variable. An unknown `TAMANU_SUPERVISOR_` variable is an error, and `--check` prints the configuration with the token hidden. The release is stamped into the binary at build time from `TAMANU_VERSION`, for the status and the compatibility check.

| Variable | Default | Meaning |
| --- | --- | --- |
| `TAMANU_SUPERVISOR_ROLE` | required | `central` or `facility` |
| `TAMANU_SUPERVISOR_LISTEN` | `:8080` | Address for the server's traffic |
| `TAMANU_SUPERVISOR_PORTAL_LISTEN` | none | Central only: address for the patient portal, with `PORTAL_ROOT` |
| `TAMANU_SUPERVISOR_STATUS_LISTEN` | `127.0.0.1:8081` | Loopback address for the status server |
| `TAMANU_SUPERVISOR_API_UPSTREAMS` | required | Space-separated `host:port` list of api instances |
| `TAMANU_SUPERVISOR_WEB_ROOT` | required | The built web app, with Tamanu's error pages in `resources/errors` |
| `TAMANU_SUPERVISOR_PORTAL_ROOT` | none | The built patient portal |
| `TAMANU_SUPERVISOR_ACTUATOR_URL` | none | The platform's actuator, an `http://` address |
| `TAMANU_SUPERVISOR_API_TOKEN` | none | Credential for the api's supervisor routes and the actuator, required with an actuator; the server's side is its `SUPERVISOR_TOKEN` |
| `TAMANU_SUPERVISOR_TRUSTED_PROXIES` | required | Space-separated CIDR ranges of the platform's proxies, never `/0` |
| `TAMANU_SUPERVISOR_LOG` | `info` | Log filter, in tracing's syntax |

No TLS anywhere: certificates and hostnames are the platform's, and the actuator is reached over plain HTTP on a private network (in the pod, or behind a network policy), since the bearer token crosses it in the clear. Each listener takes HTTP/1.1 or cleartext HTTP/2 by the connection's first bytes, as frontend mode does.

Logging:

- no line for a request the api answers, since the api logs each itself
- a warning for a request no instance answered (method, path, instance, kind of failure), and for a refused path
- rate-limited requests counted per client address and minute, rather than a line each
- status server requests at debug
- never logged: query strings, bodies, header values, the token

Tests: in-process smoke tests with a path-to-behaviour table against a fake api and fake actuator, including a row for each smuggling and forwarded-header case. Specs: the supervisor spec (SUPV) gains the front door, configuration, upgrades, status and compatibility sections (a supervisor and a server of one minor release work together in any mix of patches; the supervisor's api routes change incompatibly only between minor releases). Tell infra (Y3) and V14 about the actuator's state endpoint, the plain-HTTP actuator address, and that Envoy's hop to the supervisor can be HTTP/2 by declaring `appProtocol: kubernetes.io/h2c` on its Service port.

## Supervisor: process control through a release manifest and the actuator · B18

Each platform restates today which processes a Tamanu server runs, with which commands, how many of each, in what order, and how an upgrade proceeds: `pm2.config.cjs` on Windows, ops' Podman quadlets on Linux, infra's Kubernetes renderer, and V14's Seedling definitions. Ship that description with each release instead, platform-neutral, and define the actuator contract each platform implements to drive it at run time, so the supervisor and the platform meet in one place.

The description covers the server's parts (`database`, `api`, `sync`, `tasks`, `fhir`; the frontends are the supervisor's own): each part's command, scaling bounds, what it depends on, and the upgrade steps (stop the parts, migrate, start them, replace the supervisor). V14's Seedling bundles are then built from it rather than restating it. This card owns the description and the contract; each platform adopts them on its own card, and a deployment moves once its platform has an actuator.

The contract, versioned, described by an OpenAPI file in this repository, HTTP and JSON (a Unix socket would only work with the actuator in the supervisor's pod; gRPC would add protobuf tooling to both sides for a handful of calls):

- `GET /v1/state`: whether the actuator controls the parts, each part's desired (`up`, `down`) and observed (`starting`, `ready`, `stopping`, `stopped`, `failed`) state, whether an upgrade is in progress, the lease's holder, and every supervisor report that has not expired
- `PUT /v1/state`: the desired state of some parts. It returns at once and the actuator applies it in the background; the supervisor polls until each part is ready or stopped. Desired state rather than commands, so a repeated request cannot leave the server half started
- `POST`, `PUT`, `DELETE /v1/lease`: take, renew and release the lease that lets one supervisor act at a time. Each taking carries a token larger than any before it, across actuator restarts, sent as `Tamanu-Lease-Token`, and a change of state with an older token is refused with `409`. The actuator grants the time asked for; the supervisor takes it for 30 seconds, renews every 10, and stops acting if it cannot renew within 20 of the last renewal
- the supervisor authenticates with the same bearer token it uses with the api's supervisor routes, which the platform also gives the actuator
- a part a platform does not run reports ready whenever it is asked to be up; an actuator that does not control the parts still reports them and upgrades, and its server never sleeps

Every supervisor passes traffic, holder or not, so supervisors can be replaced or run several at once with no gap; only the holder acts. On `SIGTERM` the holder releases the lease at once and keeps passing traffic while connections drain. The supervisor keeps no state of its own: a new holder reads the phase from the parts' states (every part desired and observed down is asleep and stays so; anything else is woken). Upgrades now come from the description: the supervisor makes no api calls during one, and the platform replaces the supervisor before reporting an upgrade across minor releases finished.

## Supervisor: sleep and wake · C18

Let the supervisor stop a quiet server and start it again on use, through the actuator's control. Busy sites never go quiet and never sleep; working-hours sites and demo, dev and PR deployments spend most of their time asleep. The savings are largest on Kubernetes; it also means longer battery life on Tamanu Iti and quieter workloads elsewhere, and a deployment where it is not worth it leaves it off. Deployments on the old layout keep working unchanged. The api's side is in place: the task hold and busy check (#11700) and syncs that wait for a waking central (#11617).

Activity is every request through the supervisor except health probes, monitoring checks, probes of the supervisor itself and time synchronisation (`/`, `/api/public/ping` and `/api/timesync` from a non-browser). A request counts from its start until its response body has finished, so a long download or sync pull holds the server awake (the response body carries a guard that ends the count when dropped). Websocket upgrades are not activity. The idle time defaults to 30 minutes on a facility and 15 on central. An awake facility syncs with central every minute, and those requests reach central's supervisor, not the facility's, so central goes quiet only once every facility is asleep, knowing nothing about facilities. Data entered at one facility during a quiet period reaches the others when they are next used.

Going to sleep, as the lease holder:

1. Announce the phase. Every supervisor stops forwarding activity and handles it itself.
2. Wait until every supervisor follows the announcement with nothing in flight. An expired report is not waited for; giving up after a minute is a failed sleep.
3. Check the server runs the supervisor's own minor release (`GET /api/supervisor/status`).
4. Ask the api for the hold (`POST /api/supervisor/tasks/hold`), which in one transaction holds scheduled tasks and answers busy if a task is running or a FHIR job is queued or started. Busy releases the hold, and the supervisor asks again every minute while still idle.
5. Stop tasks and fhir.
6. On a facility, the final sync (`POST /api/supervisor/final-sync`). One that does not complete, such as with central unreachable, cancels the sleep, so a facility with sync disabled never sleeps.
7. Stop sync and the api.
8. Stop the database last.

Activity at any supervisor, or a failed step, cancels the sleep and wakes the server from wherever it got to. A stop request already sent is let finish, so it cannot land after the wake's start. A failure is reported, and the sleep tried again after the next idle time.

Waking: activity at any supervisor of a sleeping server starts a wake; one without the lease reports it at once and the holder starts it.

1. Start the database and wait until it is ready.
2. Start the other parts, forwarding to each as it becomes ready.
3. Release the hold (`DELETE /api/supervisor/tasks/hold`). A failed release never blocks the wake, since the hold expires by itself.

While it wakes:

- API paths get `503` with `Retry-After`
- a browser opening a page gets the waking page, which reloads itself once the server is up
- websocket upgrades get `503` and do not start a wake
- the frontends' files are served throughout
- a stalled wake is retried with backoff
- a login at a facility that central answers with the waking response falls back to the facility's own login
- an upgrade beginning mid-sleep or mid-wake stops the sequence, and the server wakes once the upgrade ends

Supervisors coordinate through the actuator's reports (`PUT /v1/reports/{instance}`):

- each reports how long it has gone without activity, never relying on another's clock, its requests in flight, and whether a wake was asked for
- every 10 seconds, and at once on a change, each report lasting 30
- the holder's report announces the phase as a lease token and sequence pair, so a new holder's first announcement beats every earlier one; every other report says which announcement it follows
- every supervisor reads the actuator every second

Repeating any step after a retry or restart leaves the server as doing it once. The supervisor needs no database connection and no storage: busy, final sync and release all come from the api. Its memory has a fixed ceiling, so the platform can reserve it.

Telegram: with a webhook configured, Telegram's requests to central are activity and wake it; with polling, messages to the bot wait at Telegram until central next wakes. Brings back the sleep and wake spec (SLPWK), without its scheduled tasks section, and the waking page (`waking.html` in the web app's error pages).

## Scheduled tasks that sleep, catch up and wake the server when due · D18

Give every scheduled task in `packages/central-server/app/tasks/` and `packages/facility-server/app/tasks/` a declaration of whether it can sleep. A task that can is skipped while the server sleeps and runs once on the next wake for a due time that passed meanwhile; one that cannot exposes its next due time (its cron's next fire, or the database for `ReportRequestScheduler`) so the supervisor wakes the server for it. A task wakes the server unless it declares it can sleep, so a missed declaration costs uptime rather than a skipped run. Only tasks whose output leaves the system on time are expected to wake it (scheduled reports, vaccination reminders, patient communications); generators, dischargers, queue processors and cleaners can sleep. Automatic discharge (`OutpatientDischarger`, `DeceasedPatientDischarger`) runs on central. If every facility task can sleep, facilities need no timed wakes at all.

Last-ran bookkeeping reuses the task run state from #11700. The bed fee charger must not drop days across a sleep. A timed wake brings up the database and tasks (plus the api on central; a facility's ends with the final sync, like any facility sleep) and ends once the due tasks have run and the queues they fed are empty. Tests: a catch-up runs once, bed fees across a sleep, a timed wake ends with empty queues. Brings back SLPWK's scheduled tasks section.

## Supervisor: health, server bundles and support docs for sleeping servers · E18

Make a sleeping server read as healthy rather than down: the supervisor's status says asleep, and Canopy's stale-sync check reads it (Canopy's side is outside this repository). Ship Linux and Windows supervisor binaries in the server bundles (`cd-package-servers.yml`), for bare-metal deployments. Update the support pack for sleeping servers: `docs/runbooks/sync-facility-stale.md` and `docs/healthchecks.md`, so on-call can tell a sleeping server from a broken one.

## Mobile: say a sync is waiting for central to wake · F18

While a sync waits in line behind a waking central (a `503` with `Retry-After` before the sync session opens), the mobile sync screen says it is waiting for central to wake up, in place of "Sync in queue". Built on the branch `feat/L13/mobile-waking-central-message`, and held until product confirms the wording. `MobileSyncManager` is under the sync code-owned paths, so it stays a small PR of its own.

## Web app: show a waking server itself · G18

Have the web app read `Retry-After` on a `503` from a waking or upgrading server and show that state itself, so a page can load straight into a sleeping server and wait, rather than the supervisor answering a browser with its own waking page.

## Supervisor: speak cleartext HTTP/2 to the api · H18

Once the api serves cleartext HTTP/2 (Y17), have the supervisor speak it to the api's instances, keeping HTTP/1.1 for websockets, which take a connection each and share nothing between clients. HTTP/2 frames every request explicitly, which takes the shared pool of HTTP/1.1 connections, where request smuggling lives, out of the path between the supervisor and the api. HTTP/1.1 hardening stays for the websocket path.

## Retire the old frontend layout and helmet in the servers · J18

Once every BES deployment runs behind the supervisor, remove the layout where the frontend images serve a frontend alone for a platform that routes to the server's parts itself, and remove helmet from central's api and the facility's api and sync process, since the supervisor sets those headers on the api's responses. A deployment outside BES still on the old layout implements an actuator for its platform to upgrade further.
