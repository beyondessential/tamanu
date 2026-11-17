# Tamanu supervisor

The supervisor is the front door of a Tamanu server: a build of [Caddy](https://caddyserver.com)
carrying Tamanu's own modules. Its behaviour is specified in
[Supervisor](../../specs/platform/supervisor/overview.md) and
[Sleep and wake](../../specs/platform/supervisor/sleep-and-wake.md).

This is a Go module, not an npm workspace.

## Building

```sh
go build -ldflags "-X github.com/beyondessential/tamanu/packages/supervisor/internal/buildinfo.Version=2.70.0" ./cmd/supervisor
go test ./...
```

The `-X` flag sets the release the supervisor belongs to. A build without it reports its release as
`dev`, and skips the check that the server runs the same release line before sleeping.

The supervisor's image is the release's frontend image, the root Dockerfile's `frontend` target,
stamped with the release in the root `package.json`. It carries the built web app at `/srv/web`, with
Tamanu's error pages, and the patient portal at `/srv/patient-portal`, and sets
`TAMANU_SUPERVISOR_WEB_ROOT` and `TAMANU_SUPERVISOR_PORTAL_ROOT` to them. It runs as a non-root
user. From the repository root:

```sh
docker build --target frontend -t tamanu-frontend .
```

The binary is installed as `/usr/bin/caddy`, the image's entrypoint. By default the image runs
`caddy run` with the web app's `Caddyfile.docker`, serving the web app alone at `/app` on port 3000,
for deployments that route to the server's parts themselves. The `patient-portal` target does the
same for the patient portal. To run the supervisor instead, give the image the command
`tamanu-supervisor` and its environment. A deployment runs one or the other in front of a server,
never both.

No `xcaddy` is needed: `cmd/supervisor` imports Caddy's standard modules, `caddy-ratelimit` and
Tamanu's modules, then runs Caddy's own command line.

## Running

`supervisor tamanu-supervisor` builds Caddy's configuration from the environment in memory and runs
it, with Caddy's admin API disabled. Caddy's other commands (`run`, `version`, `list-modules` and so
on) stay available, and the binary runs any Caddyfile that Caddy's standard modules can.

A blank value counts as unset, and an unknown `TAMANU_SUPERVISOR_` variable is an error.

| Variable | Default | Meaning |
| --- | --- | --- |
| `TAMANU_SUPERVISOR_ROLE` | required | `central` or `facility` |
| `TAMANU_SUPERVISOR_LISTEN` | `:8080` | Address for the server's traffic |
| `TAMANU_SUPERVISOR_PORTAL_LISTEN` | none | Central only: address for the patient portal's traffic. Needs `PORTAL_ROOT` |
| `TAMANU_SUPERVISOR_STATUS_LISTEN` | `127.0.0.1:8081` | Address for the read-only status server |
| `TAMANU_SUPERVISOR_API_UPSTREAMS` | required | Comma-separated `host:port` list of api instances |
| `TAMANU_SUPERVISOR_WEB_ROOT` | required | Directory of the built web app. Tamanu's error pages are read from its `resources/errors` |
| `TAMANU_SUPERVISOR_PORTAL_ROOT` | none | Directory of the built patient portal. Required with `PORTAL_LISTEN`, and ignored without it |
| `TAMANU_SUPERVISOR_ACTUATOR_URL` | none | The platform's actuator. Without one the server never sleeps |
| `TAMANU_SUPERVISOR_IDLE_TIME` | `30m` facility, `15m` central | Time without activity before the server sleeps, as a Go duration |
| `TAMANU_SUPERVISOR_API_TOKEN` | none | Credential for the api's supervisor routes. Required with an actuator |
| `TAMANU_SUPERVISOR_TRUSTED_PROXIES` | none | Comma-separated CIDR ranges of the platform's proxies, whose `X-Forwarded-For` is believed for rate limiting and passed on to the parts |

To see the Caddy configuration the environment produces, without running it:

```sh
supervisor tamanu-supervisor --print-config
```

The api token never appears in it: the configuration names the variable instead.

## Status

The status server answers `GET /status`, `GET /health` and `GET /ready`, as JSON. `/health` is the
supervisor's own health, for a liveness probe. `/ready` answers `200` once the supervisor knows
what to do with requests, for a readiness probe: at once without an actuator, and with one once it
has read the actuator's state, whether or not it holds the lease. Until then it answers `503`.
`/status` says whether this supervisor holds the lease or follows the holder, and which
announcement it made or follows.

## Sleep and wake

The steps of a sleep call the api's supervisor routes in this order: `GET /api/supervisor/status`
(the release check, run first), `POST /api/supervisor/tasks/hold`, and on a facility `POST
/api/supervisor/final-sync`. A wake ends with `DELETE /api/supervisor/tasks/hold`. How far a sleep or wake
got is saved with the actuator.

## Actuator contract

The platform implements the actuator contract, [`actuator/v1.openapi.yaml`](actuator/v1.openapi.yaml),
specified in [Sleep and wake](../../specs/platform/supervisor/sleep-and-wake.md#actuator-contract).
The supervisor takes the lease for 30 seconds, renews it every 10, and stops acting if it cannot
renew it within 20 of the last renewal. Every supervisor reads the actuator's state every second,
and reports every 10 seconds, each report lasting 30. It also reports at once on a new
announcement and, while the server is not awake, on a wake request or when its last request in
flight finishes. On `SIGTERM` or `SIGINT` it releases the lease at once and goes on passing traffic
while it drains. A supervisor that cannot reach the actuator keeps to the last phase and part
readiness it read.

For running the supervisor locally, `cmd/fake-actuator` keeps the parts in memory:

```sh
go run ./cmd/fake-actuator -listen 127.0.0.1:7000 -delay 2s
TAMANU_SUPERVISOR_ACTUATOR_URL=http://127.0.0.1:7000 ...
curl -X PUT -d true http://127.0.0.1:7000/fake/upgrading
```

The server's side of the api token is its own `SUPERVISOR_TOKEN` variable, which must match
`TAMANU_SUPERVISOR_API_TOKEN`.

## Layout

| Package | Holds |
| --- | --- |
| `cmd/supervisor` | The binary |
| `internal/command` | The `tamanu-supervisor` command |
| `internal/config` | Reading and checking the environment |
| `internal/routes` | Generating Caddy's configuration: routes, servers and apps |
| `internal/app` | The `tamanu` Caddy app, owner of the run-time state, and the status handler |
| `internal/gate` | The `tamanu_gate` handler at the head of every route |
| `internal/state` | The run-time state the gate reads and the sleep and wake machinery writes |
| `internal/pages` | The waking, upgrading and unavailable responses |
| `internal/errorpage` | The `tamanu_error_page` handler for parts that cannot be reached |
| `internal/machine` | The sleep and wake state machine |
| `internal/actuator` | The actuator contract's client, and a fake actuator |
| `internal/apiclient` | The client for the api's supervisor routes, and a fake api for tests |
| `internal/persist` | The saved state's document |
| `internal/buildinfo` | The release the supervisor was built for |
| `cmd/fake-actuator` | The fake actuator, for running locally |
