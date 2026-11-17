---
id: SUPV
---

# Supervisor

Applies to the supervisor, the small always-on process that sits in front of every Tamanu server as its front door and, where the platform provides an actuator, lets the rest of the server [sleep while nobody is using it and wake on use](sleep-and-wake.md).

## Front door

- The supervisor is a build of Caddy carrying Tamanu's own modules, and all of the server's HTTP traffic passes through it.
- The routing for a Tamanu server (its paths, the parts each path goes to, rate limits, and error, waking and upgrading pages) is Tamanu's. The supervisor builds it from its role and the addresses of the server's parts, and it ships with each release.
- The supervisor serves the web app, and on central the patient portal, itself, from the files of its own release. They stay available while the server sleeps, wakes or has a part down.
- When a part does not answer, the supervisor answers with Tamanu's own error pages.
- The supervisor serves plain HTTP/1.1 and cleartext HTTP/2 on fixed addresses: one for the server, and on central a second for the patient portal. Requests to the patient portal's address get the patient portal, apart from its API paths, which go to the api.
- TLS, certificates, hostnames and any web application firewall belong to the platform, which forwards to the supervisor's addresses. The supervisor never needs to know a hostname.
- While the server is awake, the supervisor routes each request to the part that serves it. While the server is asleep or waking, it handles requests itself.
- Every request passes through the supervisor's own check before it reaches a part, so the supervisor changes where requests go without reloading its configuration or dropping connections in flight.
- Websocket upgrade requests reach the parts that serve them while the server is awake.

## Configuration

- The supervisor is configured entirely by environment variables: its role, its listening addresses, the address of each of the server's parts, the actuator's address, the [idle time](sleep-and-wake.md#activity), and the credential it uses with the api.
- A part that runs as several instances, such as the api, is given as a list of addresses, and the supervisor spreads requests across them.
- The configuration names the proxies in front of the supervisor that it trusts to report the client's address. Rate limits apply to each client by that address, so that every request arriving through the platform's proxy does not share one limit.
- A missing or malformed variable stops the supervisor from starting, with an error naming the variable.

## Platforms

- The supervisor is part of Tamanu and ships with each Tamanu release.
- The supervisor knows nothing about the platform it runs on: Kubernetes, Linux and Windows deployments differ only in the actuator they provide, or do not provide, and in the configuration they give the supervisor.
- The actuator is the platform's component that starts and stops the server's parts and reports on them. The supervisor finds it through configuration and talks to it only through the [actuator contract](sleep-and-wake.md#actuator-contract). It is the supervisor's only connection outwards.
- A supervisor with no actuator configured, or whose actuator does not control the server's parts, never puts its server to sleep and only routes traffic. This is how a platform keeps a server always on.
- The same supervisor, from the same release, runs unchanged on Kubernetes, Linux and Windows.
- The supervisor's container image carries the web app and the patient portal of its release, so there is no separate image for them.

## Talking to the server

- The supervisor talks only to its server's api and to the actuator. It has no connection to the server's database.
- What the supervisor needs to know about the server (whether it is busy and which release it runs) and the facility's final sync it asks of the api, on routes that only the supervisor can call.
- The supervisor authenticates to those routes with a credential from its configuration. With no credential configured on the server, those routes refuse every request.

## Upgrades

- The actuator reports when an upgrade of the server is in progress. The supervisor reads that when it starts, and follows it while it runs.
- While an upgrade is in progress, the supervisor answers every request itself with an upgrading response: a page saying the server is being upgraded for a browser, and `503 Service Unavailable` with a `Retry-After` header for an API request.
- While an upgrade is in progress, the supervisor neither puts the server to sleep nor wakes it, and makes no calls to the api.

> [!NOTE]
> The `Retry-After` header puts a sync that meets an upgrading central [in line](../../sync/waking-central.md), as it does for a waking one, so a planned upgrade does not show as failed syncs.

## Resilience

- The supervisor's memory use has a fixed ceiling, so the platform can reserve that much memory for it and it is never killed for exceeding it.
- The supervisor keeps how far its last sleep or wake got with the actuator, so it needs no storage of its own, and a supervisor that replaces it on any host continues from there.
- When the supervisor starts, it asks the actuator for the state of each part and its saved state, and continues from what it finds.
- A supervisor that starts on an asleep server keeps it asleep when the saved state was made by a supervisor of the same release line, and wakes it otherwise.
- With an actuator, only one supervisor of a server acts at a time: the one holding the actuator's lease. A supervisor serves requests only while it holds the lease, and one that starts while another holds it waits until the lease is released or expires.
- A supervisor that is stopped releases the lease straight away, so the one replacing it can take over without waiting for the lease to expire.
- Repeating any step of a sleep or a wake, after a retry or a restart, leaves the server in the same state as doing it once.

## Compatibility

- A release line is a minor version, such as 2.69, whose releases differ only in their patch version.
- Every supervisor and server of one release line work together, in any mix of patch releases.
- The supervisor's routes on the api, and the state it saves with the actuator, change incompatibly only between release lines.
- Upgrading the supervisor or the server, within a release line or to the next, never needs the other stopped or downgraded first. A supervisor reads the state saved by a supervisor of the release line before its own.
- Downgrading may need the whole server stopped and started again.
- Restarting the supervisor alone, such as to bring in a fix to the web app, leaves the server asleep or awake as it was.
- In an upgrade across release lines, the platform replaces the supervisor before it reports the upgrade finished, so a supervisor never calls the api of another release line.

## Status

- The supervisor reports, over HTTP, whether the server is awake, asleep or waking, the state of each part, whether an upgrade is in progress, and any failure of its last sleep or wake.
- A server that is asleep reports as asleep rather than as down, so monitoring can tell a sleeping server from a broken one.
- The supervisor's own health is reported separately from the server's, so a probe of the supervisor neither wakes the server nor counts as activity.
- The status only reports. Nothing changes the supervisor's state through it.
