---
id: SETTINGS
---

# Settings

Runtime configuration lives in settings: named values stored in the database, scoped to where they apply, and edited by administrators in the admin panel. A value that no administrator has set resolves to a default declared in the settings schema. A server takes all of its configuration from settings and environment variables and runs without a configuration file.

## Scopes and resolution

Settings are declared at three scopes: global (applies to every server), central (the central server), and facility (a facility server).

A server resolves a setting through a cascade in descending priority. The central server takes its central value, then the global value, then the schema default. A facility server takes its facility value, then the global value, then the schema default. The global value therefore acts as the default for every server, and a central or facility value overrides it for that server.

A setting subtree may be declared at both the global scope and a more specific scope. Resolution deep-merges the scopes, so a facility can override individual keys while inheriting the rest of the subtree from global, and the central server sees only the global values.

## Editing and when changes take effect

Administrators edit settings in the admin panel, which validates a value against its schema and rejects an invalid one before it is saved.

A saved change applies to subsequent reads without a server restart. A setting marked as requiring a restart is instead read once when the process starts, and a change to it takes effect only after the server restarts.

Resetting a setting removes its stored value at that scope; it then resolves to the inherited or default value, and that reversion applies live like any other change.

## Permissions

Reading and changing settings require the `Setting` permission. A high-risk setting can be changed only by an administrator with full (manage-all) permission, and the editor flags it as high-risk.

## Exposure to clients

A setting is sent to the web application or the patient portal only when its schema marks it as exposed to that client. Secret settings and settings meant only for the server are never sent to any client (see `secret-encryption.md`).

## Configuration sources

Everything an operator can tune is a setting. Everything a server must know before settings are available comes from its environment: the database connection, the server's facility identity, cryptographic key material, and network ports.

The environment also carries deployment controls that are not settings, including the primary timezone (`TZ`), the trusted-proxy list (`PROXY_TRUSTED`, defaulting to loopback), the path checked for free disk space (`DISK_PATH`, defaulting to `/tmp`), console logging (`NO_COLOR`, level, timestamps, and destination), the authentication secrets, the canonical host name, and whether database migrations run at startup.
