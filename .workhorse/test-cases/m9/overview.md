# M9 — Browser performance telemetry test cases

Scenarios that verify the [Browser performance telemetry](../../../specs/platform/browser-telemetry.md) spec (`BTEL`). Ticked cases are covered by an automated test on this branch; unticked cases are coverage still owed (manual verification or a test not yet written).

## Navigation timing (network-quiet)

- [x] A navigation with no API requests settles after the quiet window (verifies spec: BTEL) — `navigationTracker.test.js`
- [x] A navigation stays open while a foreground request is in flight, then settles once it completes and the quiet window elapses (verifies spec: BTEL) — `navigationTracker.test.js`
- [x] Background/polling requests don't block a navigation from settling (verifies spec: BTEL) — `navigationTracker.test.js`
- [x] Navigating away before a navigation settles abandons it, with outcome `abandoned` (verifies spec: BTEL) — `navigationTracker.test.js`
- [x] A navigation that never goes quiet is ended by the cap, with outcome `capped` (verifies spec: BTEL) — `navigationTracker.test.js`
- [ ] Loading a real data-heavy page (e.g. the Tasks dashboard) produces one navigation trace whose children are its API request spans (manual / e2e)

## Path and parameter genericisation

- [x] An endpoint path masks id-like segments into a generic route pattern and extracts the values as params (verifies spec: BTEL) — `genericiseApiPath.test.js`

## Reporting

- [x] The ingest endpoint accepts an unauthenticated batch and stores the spans (verifies spec: BTEL) — facility `telemetry.test.js`
- [x] An authenticated batch records the user on each span (verifies spec: BTEL) — facility `telemetry.test.js`
- [x] A malformed batch is rejected and nothing is stored (verifies spec: BTEL) — facility `telemetry.test.js`
- [x] An oversized batch (over the max) is rejected (verifies spec: BTEL) — facility `telemetry.test.js`
- [ ] Events are batched in the browser and sent on the interval (manual / e2e)
- [ ] The telemetry POST is not itself recorded as a span — no self-describing loop (verifies spec: BTEL) — unit test owed
- [ ] A failed/rejected send is swallowed and never disrupts the app or surfaces an error (verifies spec: BTEL) — manual / unit owed
- [ ] Patient-portal telemetry posts to central and is stored there (verifies spec: BTEL) — central integration test owed

## Raw store and retention

- [x] The prune task removes spans older than the retention period and keeps recent ones (verifies spec: BTEL) — `CleanupBrowserTelemetry.test.js`
- [x] The prune task reads its schedule and retention period from settings (verifies spec: BTEL) — `CleanupBrowserTelemetry.test.js`
- [ ] The raw table does not sync to central and is not written to the changelog (verifies spec: BTEL) — guard test owed (enforced by config today)

## Settings

- [ ] When telemetry is disabled, the clients collect and send nothing (verifies spec: BTEL) — unit / manual owed
- [ ] The enabled flag reaches the web clients via the front-end settings (verifies spec: BTEL) — manual owed
- [ ] Telemetry defaults to on (verifies spec: BTEL) — settings test owed

## Pre-login

- [ ] The login-screen navigation is captured and attributed to the device alone (no user) (verifies spec: BTEL) — manual / e2e owed
