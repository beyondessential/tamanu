---
id: RHT
---

# Require HTTPS

Applies to the `security.requireHttps` setting, by which a Tamanu server rejects client requests that do not arrive over HTTPS.

## Borrowed terms

- [`X-Forwarded-Proto`](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/X-Forwarded-Proto): HTTP request header by which a proxy reports the protocol the original client used to reach it.

## Setting and scopes

- `security.requireHttps` is a boolean that exists at the global, central, and per-facility scopes, and has no default — when unset at every scope, HTTPS is not required.
- The effective value for a server follows the normal [settings cascade](overview.md#scopes-and-resolution): a value set for the central server or for a facility takes precedence over the global value, and the global value applies where no more specific value is set.
- The global value therefore acts as the default for every server: setting it on enables the requirement everywhere at once, and a central or facility value can still override it in either direction.
- Leaving the global value unset lets each server's central or facility value decide independently.
- A central server enforces its central (or inherited global) value; a facility server enforces its facility (or inherited global) value.
- A facility server that hosts more than one facility requires HTTPS when the requirement is in effect for any facility it hosts.

> [!NOTE]
> The transport is fixed before a request is associated with a facility, so a server hosting several facilities cannot apply the requirement to only some of them.

## Enforcement

- When the requirement is in effect, a request that did not arrive over HTTPS is rejected with `403 Forbidden` before it reaches any route handler.
- WebSocket connections are gated the same way: a handshake that did not arrive over HTTPS is refused when the requirement is in effect.
- The connectivity index route remains reachable over plain HTTP regardless of the setting, so health checks continue to work.
- A request counts as HTTPS when it arrives over a direct TLS connection, or when a trusted reverse proxy reports the original client protocol as HTTPS via the `X-Forwarded-Proto` header.
- A proxy is trusted according to the server's `proxy.trusted` configuration.
- A deployment that terminates TLS at a proxy therefore has that proxy trusted and forwarding `X-Forwarded-Proto`; without that, every request appears to be plain HTTP and is rejected once the requirement is enabled.

> [!NOTE]
> Requiring HTTPS lets a deployment that terminates TLS guarantee that no client traffic is served over plain HTTP, while deployments that secure the connection by other means can still serve HTTP.

## Enabling guard

- The requirement can only be turned on from a request that is itself HTTPS.
- An attempt to set `security.requireHttps` to a truthy value over a non-HTTPS connection is rejected, and the value is not stored.
- The guard validates the connection used to change the setting; it does not by itself prove that HTTPS reaches a different server whose facility-scoped value is being changed remotely.

> [!NOTE]
> Enabling the requirement only over HTTPS proves that HTTPS reaches the server before the requirement becomes mandatory, so turning it on cannot lock every client out.
