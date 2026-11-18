# Faith dependency refresh

## Where things stand

- `release/2.68` and `main` carry `@passcod/faith` 1.0.1, from #11494. This branch moves to 1.1.0.
- `release/2.63` to `release/2.67` ship 0.5.0.
- Faith ships a prebuilt native binary built from the Cargo.lock at its release tag, so the Rust dependency stack can only move with a faith release. An npm override cannot reach it.
- The 0.5.0 and 1.0.1 lockfiles resolve the same versions for the whole TLS, HTTP and DNS stack. The 0.5.0 → 1.0.1 bump moved faith's own crates only.
- 1.1.0 refreshes that stack within semver.
- 1.1.0 was installed past the repo's `min-release-age` gate, as it is a release by faith's own author made for this card.

## What the facility server's agent exercises

Sync calls faith's `fetch` with the default agent, reading bodies with `.json()` and `.text()`. That default agent:

- resolves names with Hickory (not the system resolver), without DNSSEC validation
- upgrades to HTTP/3 when the central server advertises it through Alt-Svc
- verifies certificates with rustls and the platform verifier
- decodes compressed responses (gzip, deflate, brotli, zstd)
- has the HTTP cache and cookies switched off

From 1.1.0 the default agent also checks certificates against Mozilla's OneCRL and CRLite, fetched in the background and cached under `XDG_CACHE_HOME` (`%LOCALAPPDATA%` on Windows). Until data has arrived, connections go ahead unchecked, so a facility server that cannot reach Mozilla keeps syncing. Tamanu keeps faith's defaults.

## Steps

- [x] Faith: refresh the Cargo.lock within semver and publish a release (1.1.0). Minimum versions wanted: rustls 0.23.46, rustls-webpki 0.103.16, webpki-root-certs 1.0.10, h2 0.4.16, hickory-proto, hickory-net and hickory-resolver 0.26.2, quinn-proto 0.11.19, quinn-udp 0.5.16, bytes 1.11.1, tokio 1.51.6, zstd 0.13.4, zstd-safe 7.4.0
- [x] Bump `@passcod/faith` in `packages/facility-server/package.json` to that release and regenerate the lockfile with CI's npm
- [x] Check 1.1.0's `fetch`, `.json()`, `.text()` and `ERROR_CODES` against real servers (the repo's faith fetch test mocks the module)
- [ ] Run a sync against a local central server
- [ ] Carry the bump forward to `main`
- [ ] Decide whether `release/2.63` to `release/2.67` take the same bump
