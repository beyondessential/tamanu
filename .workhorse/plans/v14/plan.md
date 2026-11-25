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
- The frontend version isn't in any gate's key. With one set, an upgrade leaves the frontends' image alone, but they still roll once the gate succeeds, because a workload ordered after a gate carries its key in its spec hash. The check that the frontend version isn't behind the version lives in the frontend version's validator, which Seedling runs on every change while that parameter is set, so it also catches a version change.

While the parts are down, API and sync requests fail at Seedling's proxy, with no `Retry-After`, so facility syncs show as failed until the upgrade finishes. The supervisor, with an actuator, would answer for them later.

The Retry upgrade action is gone: Seedling retries a failed gate on its own, and an operator runs a gate at once through `/apps/gates/run`.

## First draft

`seedling/central/` and `seedling/facility/` are a first draft, written to read rather than run. Each bundle's `seedling.toml` lists its script files in order, and Seedling joins them into one script.

`helpers.rhai`, `params.rhai` and `gates.rhai` are shared by both bundles, as identical copies. A bundle can only read files beneath its own root, and the Seedling CLI refuses symlinks, so the files can't be shared any other way for now. `scripts/check-seedling-bundles.mjs`, which a workflow runs on every PR that touches `seedling/`, keeps the copies identical. Seedling/S6 looks at sharing code between bundles on Seedling's side.

The draft can't yet be checked without a running Seedling server. Seedling/T6 adds an offline check to the CLI, which Tamanu's CI would run beside the copy check. The canonical URLs take Seedling's `url-origin` kind. The database URL takes the `url` kind, which accepts the `user@/db?host=/dir` socket form Tamanu accepts, and `socket_dir` reads the socket directory from its parsed query.

Both bundles declare `seedling = ">0.12"`: they use gates, `std` helpers and the metadata table, none of which v0.12.0 has, and no later Seedling release exists yet.

The version parameter stays untyped, because a published build that is not a release carries a `sha-…` commit tag, which the `version-semver` kind refuses. Its validator parses the version itself. The frontend version takes the `version-semver` kind on a published definition, since only a release is accepted there.

Publishing writes the build into the `[metadata]` table of each bundle's `seedling.toml`, as `tag` (the image tag) and `version` (the Tamanu version from `package.json`), and the version parameter's default and the minor checks read it through `app.metadata()`.

### What the draft assumes that doesn't exist yet

Tamanu:
- **A `CRYPTO_KEY` environment variable** holding the key as 64 hex digits, read in place of `CRYPTO_KEY_FILE`. Today the key is read from a file holding 32 raw bytes (`readKeyFile` in `packages/shared/src/utils/crypto.js`), and Seedling's declared writes take a string or a bundle file, not the Blob `std::decode_hex` returns. The Seedling `random` kind generates a 64-hex-digit value, which is the reason for the hex form.
- **A `checkReadiness` subcommand** on both servers. It connects with `DATABASE_URL`, decrypts every stored secret with the key, exits non-zero naming which check failed, and never prints the password.
- **A `SYNC_API_URL` environment variable** on the facility, so the API reaches the sync part. Today the address is in config only (`sync.syncApiConnection`).
- **A `PATIENT_PORTAL_URL` environment variable** on central. Today it is in config only (`patientPortal.portalUrl`).

Authentication secrets: optional, and derived from the app seed with `std::random_bytes` when unset. Losing one only logs everyone out, so a new host or a seed rotation costs no more than a logout, and rotating the seed becomes the way to rotate them.

Trusted proxies: the parts trust `fc00::/7`. Seedling's pods are IPv6 only, within the host's unique local `/48`, and its proxy connects to the parts from its own address in that prefix.

## Explicitly rejected

- **Deriving the crypto key from the app seed.** A derived value is withheld from operators and changes when the app is registered afresh, such as on a new host, so a derived crypto key could never be carried to another host and would no longer decrypt the stored secrets. It stays a required `random`-kind parameter, which an operator generates or enters.
