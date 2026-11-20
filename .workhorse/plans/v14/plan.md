# Production Seedling definitions

## Dependencies

- **Supervisor specs (L13):** the Seedling definitions specs assume the supervisor specs return to `main` before this card merges, carrying the upgrading response in `specs/platform/supervisor/overview.md#upgrades`. Whether the platform's "upgrade finished" signal stays is filed on L13.
- **T16:** a facility server stops when its primary timezone differs from central's. That check is what lets both definitions keep the timezone as an ordinary parameter defaulting to UTC, and it carries the sync and facility setup spec changes.
- **Seedling gates (seedling/H6, landed):** the readiness check and the upgrade are built on gates. Gates replaced change handlers and the install action, so neither definition declares an `on_change` handler or an install action. Seedling/J6 was cancelled because gate holds already give it what it was for.

## Gates

Each definition declares its gates in this order, which is also the order Seedling runs them when several are due at once.

- **`readiness`:** keyed on the database URL and crypto key. No body, and a check Job that connects with the database URL and decrypts the stored secrets with the crypto key. Every Deployment, the supervisor included, is ordered after it, so a changed URL or key makes them stale but they keep running on the old value until the check passes. Seedling stores only a digest of the key, but the check Job's error output is shown on the fault, so it must not print the URL's password. The check declares an `interval`, around five minutes. A failed interval check invalidates the gate: running parts stay up, since Seedling never stops a running dependant because a target isn't ready, but a part that restarts waits.
- **`announce`:** keyed on the version, ordered after `readiness`, no exclusive selection. Its body pulls the new release's images with `rt.warm_images`, then tells the supervisor an upgrade has started. Pulling first keeps a failed pull from leaving the supervisor showing its upgrading response over a server still running the old release. With `last` unit (a new install) there is no supervisor yet, so the body skips the notice.
- **`upgrade`:** keyed on the version, ordered after `announce`, with every Deployment but the supervisor as its exclusive selection. Its body runs the new release's `upgrade` subcommand in a Job from the new server image. Its check runs `just-migrate list --pending --check`, which exits non-zero when migrations are pending.
- **`certificates`:** keyed on the hostnames of the `https` URLs (canonical, and the portal's when set). Its body calls `rt.warm_certs(app).ready()`. Nothing is ordered after it, so a certificate that can't be issued raises `gate_failed` without holding the server back. Seedling reports the app as installing, not set up, until every gate is satisfied, including this one.
- The parts are ordered after `upgrade`, and the supervisor after `upgrade` and the parts, so Seedling replaces the supervisor only once the new parts are ready, and leaves the old one serving its upgrading response while `upgrade` keeps failing.

`announce` splits from `upgrade` because Seedling stops a gate's exclusive selection before its body runs: a single gate could tell the supervisor only after the parts had already gone.

The Retry upgrade action is gone: Seedling retries a failed gate on its own, and an operator runs a gate at once through `/apps/gates/run`.
