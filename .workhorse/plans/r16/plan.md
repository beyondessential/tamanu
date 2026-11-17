# Faith dependency refresh

## Where things stand

- `@passcod/faith` 1.0.1 is already the facility server's dependency on `release/2.68`, `release/2.69` and `main`, from #11494. It is the latest npm release.
- `release/2.63` to `release/2.67` ship 0.5.0.
- Faith ships a prebuilt native binary built from the Cargo.lock at its release tag, so the Rust dependency stack can only move with a faith release. An npm override cannot reach it.
- The 0.5.0 and 1.0.1 lockfiles resolve the same versions for the whole TLS, HTTP and DNS stack. The 0.5.0 → 1.0.1 bump moved faith's own crates only.
- Faith's unreleased `main` moves rustls-webpki forward and nothing else in that stack.

## What the facility server's agent exercises

Sync calls faith's `fetch` with the default agent, reading bodies with `.json()` and `.text()`. That default agent:

- resolves names with Hickory (not the system resolver), without DNSSEC validation
- upgrades to HTTP/3 when the central server advertises it through Alt-Svc
- verifies certificates with rustls and the platform verifier
- decodes compressed responses (gzip, deflate, brotli, zstd)
- has the HTTP cache and cookies switched off

## Steps

- [ ] Faith: refresh the Cargo.lock within semver and publish a release. Minimum versions wanted: rustls 0.23.46, rustls-webpki 0.103.16, webpki-root-certs 1.0.10, h2 0.4.16, hickory-proto, hickory-net and hickory-resolver 0.26.2, quinn-proto 0.11.19, quinn-udp 0.5.16, bytes 1.11.1, tokio 1.51.6, zstd 0.13.4, zstd-safe 7.4.0
- [ ] Bump `@passcod/faith` in `packages/facility-server/package.json` to that release and regenerate the lockfile with CI's npm
- [ ] Run the faith fetch tests (`packages/facility-server/__tests__/sync/faithFetch.test.js`) and a sync against a local central server
- [ ] Carry the bump forward to `main`
- [ ] Decide whether `release/2.63` to `release/2.67` take the same bump
