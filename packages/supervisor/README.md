# Tamanu supervisor

The supervisor is the front door of a Tamanu server: a build of [Caddy](https://caddyserver.com)
carrying Tamanu's own modules, through which all of the server's HTTP traffic passes. It routes each
request to the part that serves it (api, web or patient portal), and answers requests itself while
the server is asleep, waking or being upgraded. Its behaviour is specified in
[`specs/platform/supervisor/`](../../specs/platform/supervisor/).

This is a Go module, not an npm workspace.

## Building

```sh
go build ./cmd/supervisor
go test ./...
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
waking), each part's readiness, whether an upgrade is in progress, and the last sleep or wake
failure, and `GET /health` with the supervisor's own health. Neither wakes the server or counts as
activity.

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
