# Tamanu supervisor

The supervisor is the front door of a Tamanu server: a build of [Caddy](https://caddyserver.com)
carrying Tamanu's own modules, through which all of the server's HTTP traffic passes. It routes each
request to the part that serves it (api, web or patient portal), and answers requests itself while
the server is asleep, waking or being upgraded. Its behaviour is specified in
[`specs/platform/supervisor/`](../../specs/platform/supervisor/).

This is a Go module, not an npm workspace.

## Building

```sh
go build -ldflags "-X github.com/beyondessential/tamanu/packages/supervisor/internal/buildinfo.Version=2.70.0" ./cmd/supervisor
go test ./...
```

The `-X` flag sets the release the supervisor belongs to. A build without it is a development build:
it reports its release as `dev`, and puts a server to sleep without checking the server's database
is migrated to the same release.

The image is the root Dockerfile's `supervisor` target, stamped with the release in the root
`package.json`. It runs as a non-root user, with `/var/lib/tamanu-supervisor` as a volume for
`TAMANU_SUPERVISOR_DATA_DIR`. From the repository root:

```sh
docker build --target supervisor -t tamanu-supervisor .
```

No `xcaddy` is needed: `cmd/supervisor` imports Caddy's standard modules, `caddy-ratelimit` and
Tamanu's modules, then runs Caddy's own command line.

## Running

Run with no arguments, the binary runs `caddy tamanu-supervisor`, which reads its configuration from
the environment, builds Caddy's configuration in memory and runs it. There is no config file, and
Caddy's admin API is disabled. Caddy's other commands (`version`, `list-modules` and so on) stay
available.

A missing or malformed variable stops the supervisor from starting, with an error naming the
variable. A blank value counts as unset, and an unknown `TAMANU_SUPERVISOR_` variable is an error.

| Variable | Default | Meaning |
| --- | --- | --- |
| `TAMANU_SUPERVISOR_ROLE` | required | `central` or `facility` |
| `TAMANU_SUPERVISOR_LISTEN` | `:8080` | Address for the server's traffic |
| `TAMANU_SUPERVISOR_PORTAL_LISTEN` | none | Central only: address for the patient portal's traffic. Needs `PORTAL_UPSTREAMS` |
| `TAMANU_SUPERVISOR_STATUS_LISTEN` | `127.0.0.1:8081` | Address for the read-only status server |
| `TAMANU_SUPERVISOR_API_UPSTREAMS` | required | Comma-separated `host:port` list of api instances |
| `TAMANU_SUPERVISOR_WEB_UPSTREAMS` | required | Comma-separated `host:port` list of web frontend instances |
| `TAMANU_SUPERVISOR_PORTAL_UPSTREAMS` | none | Central only: comma-separated `host:port` list of patient portal instances. Needs `PORTAL_LISTEN` |
| `TAMANU_SUPERVISOR_ACTUATOR_URL` | none | The platform's actuator. Without one the server never sleeps |
| `TAMANU_SUPERVISOR_IDLE_TIME` | `30m` facility, `15m` central | Time without activity before the server sleeps, as a Go duration |
| `TAMANU_SUPERVISOR_API_TOKEN` | none | Credential for the api's supervisor routes. Required with an actuator |
| `TAMANU_SUPERVISOR_DATA_DIR` | none | Where the supervisor keeps its state. Required with an actuator |
| `TAMANU_SUPERVISOR_TRUSTED_PROXIES` | none | Comma-separated CIDR ranges of the platform's proxies, whose `X-Forwarded-For` is believed for rate limiting and passed on to the parts |

The supervisor serves plain HTTP/1.1 and cleartext HTTP/2 only. TLS and hostnames belong to the
platform in front of it.

To see the Caddy configuration the environment produces, without running it:

```sh
supervisor tamanu-supervisor --print-config
```

The api token never appears in it: the configuration names the variable instead.

## Status

The status server answers `GET /status` with the server's state (awake, going to sleep, asleep or
waking), each part's readiness, whether an upgrade is in progress, the last sleep or wake failure,
requests in flight, when the server last had activity, and the supervisor's release. `GET /health`
answers with the supervisor's own health. Neither wakes the server or counts as activity.

## Sleep and wake

With an actuator that controls the server's parts, the supervisor puts the server to sleep once it
has had no activity for the idle time, and wakes it when a request that counts as activity arrives.
Without an actuator, or with one that does not control the parts, it only routes traffic.

Going to sleep, in order: check the server runs the supervisor's release (`GET
/api/supervisor/status`), hold scheduled tasks unless the server is busy (`POST
/api/supervisor/hold`), stop `tasks` and `fhir`, on a facility sync with central once more (`POST
/api/supervisor/final-sync`), stop `sync`, `api`, `web` and `portal`, then stop the `database`. A
busy server stays awake and is asked again a minute later. Activity cancels a sleep, and a failed
step cancels it and is reported; either way the server wakes from wherever the sleep reached.

Waking starts the `database`, then the other parts, forwarding requests to each part once the
actuator reports it ready, then releases the hold (`DELETE /api/supervisor/hold`). A wake that
stalls is retried.

How far a sleep or wake got is kept in `supervisor-state.json` in the data directory, so a
supervisor that restarts continues from there. One that starts on an asleep server from another
release wakes it.

While the actuator reports an upgrade in progress, every request gets the upgrading response and
the supervisor neither sleeps nor wakes the server. It wakes the server once the upgrade ends.

## Actuator contract

The platform implements the actuator contract,
[`actuator/v1.openapi.yaml`](actuator/v1.openapi.yaml): `GET /v1/state` reports whether the actuator
controls the parts, whether an upgrade is in progress, and each part's desired and observed state,
and `PUT /v1/state` sets the desired state (`up` or `down`) of the parts it names, returning at once.

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
| `internal/persist` | The state file in the data directory |
| `internal/buildinfo` | The release the supervisor was built for |
| `cmd/fake-actuator` | The fake actuator, for running locally |
