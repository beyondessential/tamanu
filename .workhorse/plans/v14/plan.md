# Production Seedling definitions

## Dependencies

- **Supervisor (Smoother Upgrades support project):** the definitions run Tamanu's current layout, with no supervisor, because the supervisor's routing (#A18) won't ship before Seedling does. The card that moves deployments onto the supervisor changes these definitions in the same release. Once #B18's process description ships, the definitions read it from the bundle rather than restating the parts.
- **T16:** a facility server stops when its primary timezone differs from central's. That check is what lets both definitions keep the timezone as an ordinary parameter defaulting to UTC, and it carries the sync and facility setup spec changes.
- **Seedling gates (seedling/H6, landed):** the readiness check and the upgrade are built on gates. Gates replaced change handlers and the install action, so neither definition declares an `on_change` handler or an install action. Seedling/J6 was cancelled because gate holds already give it what it was for.

## Gates

Each definition declares its gates in this order, which is also the order Seedling runs them when several are due at once.

- **`readiness`:** keyed on the database URL and crypto key. No body, and a check Job that connects with the database URL and decrypts the stored secrets with the crypto key. Every part that connects to the database is ordered after it, so a changed URL or key makes them stale but they keep running on the old value until the check passes. Seedling stores only a digest of the key, but the check Job's error output is shown on the fault, so it must not print the URL's password. The check declares an `interval`, around five minutes. A failed interval check invalidates the gate: running parts stay up, since Seedling never stops a running dependant because a target isn't ready, but a part that restarts waits.
- **`upgrade`:** keyed on the version, ordered after `readiness`, with the parts that connect to the database as its exclusive selection. Its body runs the new release's `upgrade` subcommand in a Job from the new server image. Its check runs `just-migrate list --pending --check`, which exits non-zero when migrations are pending.
- **`certificates`:** keyed on the hostnames of the `https` URLs (canonical, and the portal's when set). Its body calls `rt.warm_certs(app).ready()`. Nothing is ordered after it, so a certificate that can't be issued raises `gate_failed` without holding the server back. Seedling reports the app as installing, not set up, until every gate is satisfied, including this one.
- The frontends (the web app, and on central the patient portal) are ordered after `upgrade` only, outside its exclusive selection, so they go on serving the previous release until the upgrade succeeds, then roll to the new one.

While the parts are down, API and sync requests fail at Seedling's proxy, with no `Retry-After`, so facility syncs show as failed until the upgrade finishes. The supervisor, with an actuator, would answer for them later.

The Retry upgrade action is gone: Seedling retries a failed gate on its own, and an operator runs a gate at once through `/apps/gates/run`.

## First draft

`seedling/central/` and `seedling/facility/` are a first draft, written to read rather than run. Each bundle's `seedling.toml` lists its script files in order, and Seedling joins them into one script.

`helpers.rhai`, `params.rhai` and `gates.rhai` are shared by both bundles, as identical copies. A bundle can only read files beneath its own root, and the Seedling CLI refuses symlinks, so the files can't be shared any other way for now. `scripts/check-seedling-bundles.mjs`, which a workflow runs on every PR that touches `seedling/`, keeps the copies identical. Seedling/S6 looks at sharing code between bundles on Seedling's side.

The draft can't yet be checked without a running Seedling server. Seedling/T6 adds an offline check to the CLI, which Tamanu's CI would run beside the copy check. Seedling/U6 adds URL and version helpers to BSL, which would replace most of `helpers.rhai`.

### What the draft assumes that doesn't exist yet

Tamanu:
- **A `CRYPTO_KEY` environment variable** holding the key as 64 hex digits, read in place of `CRYPTO_KEY_FILE`. Today the key is read from a file holding 32 raw bytes (`readKeyFile` in `packages/shared/src/utils/crypto.js`), and Seedling's declared writes take a string, not raw bytes. The Seedling `random` kind generates a 64-hex-digit value, which is the reason for the hex form.
- **A `checkReadiness` subcommand** on both servers. It connects with `DATABASE_URL`, decrypts every stored secret with the key, exits non-zero naming which check failed, and never prints the password.
- **A `SYNC_API_URL` environment variable** on the facility, so the API reaches the sync part. Today the address is in config only (`sync.syncApiConnection`).
- **A `PATIENT_PORTAL_URL` environment variable** on central. Today it is in config only (`patientPortal.portalUrl`).
- **A `published-version` file**, written into each bundle when it is published: the image tag on the first line, the Tamanu version it carries on the second. The version parameter's default and the minor check read it.

Trusted proxies: the parts trust `fc00::/7`. Seedling's pods are IPv6 only, within the host's unique local `/48`, and its proxy connects to the parts from its own address in that prefix.
