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

The binary is installed as `/usr/bin/caddy`. The image's entrypoint is [`entrypoint.sh`](entrypoint.sh),
which by default runs `caddy run` with the web app's `Caddyfile.docker`, serving the web app alone at
`/app` on port 3000, for deployments that route to the server's parts themselves. The
`patient-portal` target does the same for the patient portal. To run the supervisor instead, give the
image the command `supervisor` and its environment. A deployment runs one or the other in front of a
server, never both. Any command other than `supervisor` goes to Caddy unchanged.

No `xcaddy` is needed: `cmd/supervisor` imports Caddy's standard modules, `caddy-ratelimit` and
Tamanu's modules, then runs Caddy's own command line.

## Running

The supervisor's routing is the Caddyfile shipped with it, [`caddy/supervisor.caddyfile`](caddy/supervisor.caddyfile),
or [`caddy/supervisor-portal.caddyfile`](caddy/supervisor-portal.caddyfile) on a central server with a
patient portal, in the image at `/etc/caddy/supervisor`. The `tamanu` global option holds the
supervisor's own settings, and the `tamanu_gate`, `tamanu_error_page` and `tamanu_status` directives
are its handlers. Caddy's admin API is off.

`supervisor` checks the environment for the obvious mistakes, printing each problem as the variable's
name and what is wrong with it, fills in the defaults, picks the Caddyfile and runs `caddy run` with
it. An empty variable counts as unset, and an unknown `TAMANU_SUPERVISOR_` variable is an error. It
does not check everything: the operator follows the contract below.

| Variable | Default | Meaning |
| --- | --- | --- |
| `TAMANU_SUPERVISOR_ROLE` | required | `central` or `facility` |
| `TAMANU_SUPERVISOR_LISTEN` | `:8080` | Address for the server's traffic |
| `TAMANU_SUPERVISOR_PORTAL_LISTEN` | none | Central only: address for the patient portal's traffic. Needs `PORTAL_ROOT` |
| `TAMANU_SUPERVISOR_STATUS_LISTEN` | `127.0.0.1:8081` | Address for the read-only status server |
| `TAMANU_SUPERVISOR_API_UPSTREAMS` | required | Space-separated `host:port` list of api instances |
| `TAMANU_SUPERVISOR_WEB_ROOT` | required | Directory of the built web app. Tamanu's error pages are read from its `resources/errors` |
| `TAMANU_SUPERVISOR_PORTAL_ROOT` | none | Directory of the built patient portal. Required with `PORTAL_LISTEN`, and ignored without it |
| `TAMANU_SUPERVISOR_ACTUATOR_URL` | none | The platform's actuator. Without one the server never sleeps |
| `TAMANU_SUPERVISOR_IDLE_TIME` | `30m` facility, `15m` central | Time without activity before the server sleeps, as a Go duration |
| `TAMANU_SUPERVISOR_API_TOKEN` | none | Credential for the api's supervisor routes. Required with an actuator |
| `TAMANU_SUPERVISOR_TRUSTED_PROXIES` | required | Space-separated CIDR ranges of the platform's proxies, whose `X-Forwarded-For` is believed for rate limiting and passed on to the parts |

The defaults are the entrypoint's. Addresses are `host:port` or `:port`. The entrypoint also sets
`_TAMANU_SUPERVISOR_PORT`, `_TAMANU_SUPERVISOR_PORTAL_PORT` and `_TAMANU_SUPERVISOR_STATUS_PORT` for
the Caddyfile, which takes each address's port from them and its host from `bind`.

To see the Caddy configuration the environment produces, without running it, give the command
`supervisor adapt` (or `supervisor validate` to also check the modules accept it). Outside the image,
run the entrypoint with `CADDY` naming the binary and `CADDYFILES` the `caddy` directory:

```sh
CADDY=./supervisor CADDYFILES=caddy TAMANU_SUPERVISOR_ROLE=facility ... sh entrypoint.sh supervisor adapt
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
/api/supervisor/final-sync`. A wake ends with `DELETE /api/supervisor/tasks/hold`. Nothing about a
sleep or wake is saved: a supervisor that takes the lease reads the phase from the state of each
part, as [Resilience](../../specs/platform/supervisor/overview.md#resilience) describes.

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

The server's side of the api token is its own `SUPERVISOR_TOKEN` variable, which must match
`TAMANU_SUPERVISOR_API_TOKEN`.

## Layout

| Path | Holds |
| --- | --- |
| `cmd/supervisor` | The binary |
| `entrypoint.sh` | The image's entrypoint, which checks the environment and runs the supervisor |
| `caddy` | The supervisor's Caddyfiles, and the smoke and entrypoint tests |
| `internal/app` | The `tamanu` Caddy app and its global option, owner of the run-time state, and the status handler |
| `internal/gate` | The `tamanu_gate` handler at the head of every route |
| `internal/state` | The run-time state the gate reads and the sleep and wake machinery writes |
| `internal/pages` | The waking, upgrading and unavailable responses |
| `internal/errorpage` | The `tamanu_error_page` handler for parts that cannot be reached |
| `internal/machine` | The sleep and wake state machine |
| `internal/actuator` | The actuator contract's client, and a fake actuator for tests |
| `internal/apiclient` | The client for the api's supervisor routes, and a fake api for tests |
| `internal/buildinfo` | The release the supervisor was built for |
