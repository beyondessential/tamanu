---
id: SUPV
---

# Supervisor

The supervisor is a small, always-on process that sits in front of every Tamanu server, central and each facility server. It is the server's front door: all of the server's HTTP traffic enters through it. Where the platform provides an actuator, the supervisor also lets the rest of the server shut down while nobody is using it, and wakes it on real demand (see `platform/supervisor/sleep-and-wake.md`). While central's database is down, central's supervisor answers sync checks and serves logins itself (see `platform/supervisor/serving-while-asleep.md`).

The supervisor is part of Tamanu and ships with each Tamanu release. It knows nothing about the platform it runs on. Kubernetes, Linux and Windows deployments differ only in the actuator they provide, or don't provide, and in the configuration they give the supervisor.

## Front door

- [ ] The supervisor runs Caddy as a child process that it starts and manages, and all of the server's HTTP traffic passes through that Caddy.
- [ ] The routing for a Tamanu server (its paths, the parts each path goes to, rate limits, and error and waking pages) is Tamanu's, and ships with each release as part of the supervisor.
- [ ] The supervisor's Caddy serves plain HTTP/1.1 and cleartext HTTP/2 on a single address. TLS, certificates, hostnames and any web application firewall belong to the platform, which forwards to that address.
- [ ] The addresses of the server's parts (api, web, sync and the others) come from configuration, as do the actuator's address, the supervisor's own listening address and the idle time (see `platform/supervisor/sleep-and-wake.md#activity`).
- [ ] While the server is awake, the supervisor routes each request to the part that serves it. While the server is asleep or waking, it handles requests itself.
- [ ] The supervisor changes where requests go while it runs, without dropping connections in flight.
- [ ] Websocket upgrade requests reach the parts that serve them while the server is awake.

## Platforms

- [ ] The actuator is the platform's component that starts and stops the server's parts. The supervisor finds it through configuration and talks to it only through the actuator contract (see `platform/supervisor/sleep-and-wake.md#actuator-contract`).
- [ ] A supervisor with no actuator configured never puts its server to sleep and only routes traffic. This is how a platform keeps a server always on.
- [ ] The supervisor runs PostgreSQL as a child process too, on central only, and only when an actuator is configured.
- [ ] The supervisor finds the Caddy and PostgreSQL programs it runs through configuration. The supervisor's container image bundles both, and on Linux and Windows the installation provides them.
- [ ] The same supervisor, from the same release, runs unchanged on Kubernetes, Linux and Windows.

## Database access

- [ ] The supervisor connects to its server's database with its own role, not the application's.
- [ ] On every server, that role can read the database's migration state, which the supervisor checks before putting the server to sleep.
- [ ] On central, that role can also read the tables copied at sleep, and write `devices`, `refresh_tokens` and `user_login_attempts` for the hand-back (see `platform/supervisor/serving-while-asleep.md`).
- [ ] On a facility server, that role can also read the facility's central address, device id and sync credentials. The supervisor is given the facility's key file, so it can decrypt the sync password.
- [ ] The role has no access beyond what this section lists.

## Resilience

- [ ] The supervisor's memory use has a fixed ceiling, so the platform can reserve that much memory for it and it is never killed for exceeding it.
- [ ] The supervisor keeps its state on durable storage that it owns: its PostgreSQL data, the copy of login's tables and what was written to it, and the values it held at sleep. That state survives the supervisor restarting and, on Kubernetes, being rescheduled.
- [ ] When the supervisor starts, it asks the actuator for the state of each part and continues from what it finds. A hand-back that had not finished is finished.
- [ ] A supervisor that starts on an asleep server whose state was made by the same release keeps it asleep, and serves it as before the restart.
- [ ] A supervisor that starts on an asleep server whose state was made by a different release wakes the server. This is how a rollout of a new release reaches the database (see `platform/supervisor/sleep-and-wake.md#rollouts`).
- [ ] Repeating any step of a sleep or a wake, after a retry or a restart, leaves the server in the same state as doing it once.

## Status

- [ ] The supervisor reports, over HTTP, whether the server is awake, asleep or waking, the state of each part, and any failure of its last sleep or wake.
- [ ] The supervisor reports whether the database is clear for other writers: true once a hand-back has finished, or when there was nothing to hand back. A rollout's migrations wait on this before they run.
- [ ] The supervisor's own health is reported separately from the server's, so a probe of the supervisor neither wakes the server nor counts as activity.
