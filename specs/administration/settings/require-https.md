---
id: RHT
---

# Require HTTPS

Tamanu servers can be configured to reject client requests that do not arrive over HTTPS.
This lets a deployment that terminates TLS guarantee that no client traffic is served over plain HTTP, while still allowing deployments that secure the connection by other means to serve HTTP.
The control is the `security.requireHttps` setting.

## Setting and scopes

`security.requireHttps` is a boolean that exists at the global, central, and per-facility scopes, and has no default — when unset at every scope, HTTPS is not required.

The effective value for a server follows the normal settings cascade: a value set for the central server or for a facility takes precedence over the global value, and the global value applies where no more specific value is set.
The global value therefore acts as the default for every server: setting it on enables the requirement everywhere at once, and a central or facility value can still override it in either direction.
Leaving the global value unset lets each server's central or facility value decide independently.

A central server enforces its central (or inherited global) value; a facility server enforces its facility (or inherited global) value.
A facility server that hosts more than one facility requires HTTPS when the requirement is in effect for any facility it hosts, because the transport is fixed before the request is associated with a facility.

## Enforcement

When the requirement is in effect, a request that did not arrive over HTTPS is rejected with `403 Forbidden` before it reaches any route handler.
The connectivity index route remains reachable over plain HTTP regardless of the setting, so health checks continue to work.

A request counts as HTTPS when it arrives over a direct TLS connection, or when a trusted reverse proxy reports the original client protocol as HTTPS via the `X-Forwarded-Proto` header.
A proxy is trusted according to the server's `proxy.trusted` configuration.
A deployment that terminates TLS at a proxy must therefore have that proxy trusted and forwarding `X-Forwarded-Proto`, otherwise every request appears to be plain HTTP and is rejected once the requirement is enabled.

## Enabling guard

The requirement can only be turned on from a request that is itself HTTPS.
An attempt to set `security.requireHttps` to a truthy value over a non-HTTPS connection is rejected, and the value is not stored.
This proves that HTTPS reaches the server before the requirement becomes mandatory, so enabling it cannot lock every client out.
The guard validates the connection used to change the setting; it does not by itself prove that HTTPS reaches a different server whose facility-scoped value is being changed remotely.
