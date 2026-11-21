---
base: default
---

# Supervisor: the layers after frontend mode

L13 stops at the supervisor's first layer: a Rust server replacing Caddy in the frontend and patient portal images (#11712). The cards below carry it the rest of the way, landing in order where one builds on another. Every layer leaves existing deployments working unchanged: a deployment moves onto a layer when its platform is ready. The design decisions for the Rust supervisor (stack, no TLS, Caddy's secure defaults made explicit, request smuggling hardening, logging, security headers) are in L13's plan, kept on the branch `archive/l13-supervisor-plan`. The earlier Go build of the whole supervisor, with its specs for sleep and wake (SLPWK) and its actuator contract, is on `archive/l13-supervisor-go`, as the reference for its behaviour.

## Supervisor: route the server's traffic

Bring the api's routes under the supervisor, so the frontend image becomes the server's entrypoint and carries both frontends: the proxy to the api's instances (least connections, a retry on a failed connect, websockets, the request smuggling hardening), rate limits per client address behind the platform's trusted proxies, path normalisation and the refusal of `/api/supervisor`, helmet's headers on the api's responses where the api sent none, error and upgrading pages, the status server, and logging that never carries query strings. The only actuator call is reading whether an upgrade is in progress, which is all Seedling's upgrades (V14) need; no lease. Enforce the content security policy that #11712 only reports: run Postgres, central, a facility server and both apps locally behind the supervisor, walk each app's main flows with Playwright, collect every report, adjust the policy (the patient portal evaluates a string as JavaScript on load), then send it as `Content-Security-Policy`. Brings back the supervisor spec's routing sections, and tells infra (Y3) and V14 about the contract file, the plain-HTTP actuator address, and `appProtocol: kubernetes.io/h2c` for Envoy's hop. Deployments can start moving to the new layout; the old one keeps working.

## Supervisor: process control through a release manifest and the actuator

Ship with each release a platform-neutral description of the server's processes (command, scaling bounds, what each depends on, the upgrade steps), in place of the copies each platform keeps today in `pm2.config.cjs`, ops' Podman quadlets, infra's Kubernetes renderer and V14's Seedling definitions, and define the actuator contract each platform implements to drive them at run time: desired and observed state per part, the upgrade sequence, and the lease that lets one supervisor act while several pass traffic. This card owns the description and the contract; each platform adopts them on its own card. A deployment moves once its platform has an actuator, and keeps working as it is until then.

## Supervisor: sleep and wake

Let the supervisor stop a quiet server and wake it on use, on top of the actuator's control: idle time (30 minutes on a facility, 15 on central), waking and upgrading responses, the sleep and wake sequence (task hold, a facility's final sync, parts stopped in order, database last), reports between supervisors and the sleep barrier, and a new lease holder reading the phase from the parts' states. The api's side is already in place (#11700, the task hold and the busy check), and syncs already wait for a waking central (#11617). Brings back SLPWK without its scheduled tasks section. The savings are largest on Kubernetes; it also means longer battery life on Tamanu Iti and quieter workloads elsewhere, and a deployment where it is not worth it leaves it off.

## Scheduled tasks that sleep, catch up and wake the server when due

Give every scheduled task on central and the facility a declaration of whether it can sleep: a task that can is skipped while the server sleeps and runs once on the next wake, and one that cannot exposes its next due time so the supervisor can wake the server for it (a cron's next fire, or the database for the report request scheduler). A task wakes the server unless it declares otherwise, so a missed declaration costs uptime rather than a skipped run. Only tasks whose output leaves the system on time are expected to wake the server; the bed fee charger must not drop days across a sleep. A timed wake brings up the database and tasks (plus the api on central, and ends with the final sync on a facility), and ends once due tasks have run and the queues they fed are empty. Reuses the task run state from #11700, and brings back SLPWK's scheduled tasks section.

## Supervisor: health, server bundles and support docs for sleeping servers

Make a sleeping server read as healthy rather than down: the supervisor's status says asleep, and Canopy's stale-sync check reads it (Canopy's side is outside this repository). Ship Linux and Windows supervisor binaries in the server bundles (`cd-package-servers.yml`). Update the support pack for sleeping servers: `docs/runbooks/sync-facility-stale.md` and `docs/healthchecks.md`.

## Mobile: say a sync is waiting for central to wake

While a sync waits in line behind a waking central, the mobile sync screen says it is waiting for central to wake up, in place of "Sync in queue". Built on the branch `feat/L13/mobile-waking-central-message`, and held until product confirms the wording. `MobileSyncManager` is under the sync code-owned paths, so it stays a small PR of its own.

## Web app: show a waking server itself

Have the web app read `Retry-After` on a `503` from a waking server and show that it is waking, so a page can load straight into a sleeping server rather than the supervisor answering with its waking page.

## Supervisor: speak cleartext HTTP/2 to the api

Once the api serves cleartext HTTP/2 (Y17), have the supervisor speak it to the api's instances, keeping HTTP/1.1 for websockets, which take a connection each. This takes the shared pool of HTTP/1.1 connections, where request smuggling lives, out of the path between the supervisor and the api.

## Retire the old frontend layout and helmet in the servers

Once every BES deployment runs behind the supervisor, remove the layout where the frontend images serve a frontend alone for a platform that routes to the server's parts itself, and remove helmet from central's api and the facility's api and sync process, since the supervisor sets those headers. A deployment outside BES still on the old layout implements an actuator for its platform to upgrade further.
