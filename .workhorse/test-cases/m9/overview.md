# M9 — Browser performance telemetry test cases

Scenarios that verify the [Browser performance telemetry](../../../specs/platform/browser-telemetry.md) spec (`BTEL`). Ticked cases are covered by an automated test on this branch; unticked cases are coverage still owed (manual verification or a test not yet written).

## Navigation timing (network-quiet)

- [x] A navigation with no API requests settles after the quiet window (verifies spec: BTEL) — `navigationTracker.test.js`
- [x] A navigation stays open while a foreground request is in flight, then settles once it completes and the quiet window elapses (verifies spec: BTEL) — `navigationTracker.test.js`
- [x] Background/polling requests don't block a navigation from settling (verifies spec: BTEL) — `navigationTracker.test.js`
- [x] Navigating away before a navigation settles abandons it, with outcome `abandoned` (verifies spec: BTEL) — `navigationTracker.test.js`
- [x] A navigation that never goes quiet is ended by the cap, with outcome `capped` (verifies spec: BTEL) — `navigationTracker.test.js`
- [ ] Loading a real data-heavy page (e.g. the Tasks dashboard) produces one navigation trace whose children are its API request spans (manual / e2e)
- [ ] Signing in starts a fresh navigation for the page that renders behind the login screen, so the post-login load is measured rather than dropped (verifies spec: BTEL) — unit test owed
- [ ] Selecting a facility likewise starts a fresh navigation (verifies spec: BTEL) — unit test owed

## Request capture (all requests, not just navigation)

- [x] An API request made during a navigation is recorded as a child span of it (verifies spec: BTEL) — `navigationTracker.test.js`
- [x] An API request made with no navigation active (suggester load, idle poll) is recorded as a standalone request span with no navigation parent (verifies spec: BTEL) — `navigationTracker.test.js`
- [x] An API request made after its navigation has already settled (e.g. a form submission) is still recorded as a standalone span (verifies spec: BTEL) — `navigationTracker.test.js`
- [ ] A slow suggester / form submit / background poll appears as a request span with method, route, status, and duration (manual / e2e)

## Route patterns and parameters

- [x] A request span records the exact `route()` template and its named params, with no inference (verifies spec: BTEL) — `navigationTracker.test.js`
- [x] A request to a plain-string endpoint (not migrated to `route()`) records its concrete path verbatim — the client never guesses which segments are ids (verifies spec: BTEL) — `navigationTracker.test.js`
- [ ] A navigation to an id-bearing page records the matched route pattern from the app's route table with named params (e.g. `/patients/:category/:patientId/encounter/:encounterId`) (verifies spec: BTEL) — manual / e2e owed
- [ ] A navigation to a static page records its path as-is (verifies spec: BTEL) — manual / e2e owed

## Reporting

- [x] The ingest endpoint accepts an unauthenticated batch and stores the spans (verifies spec: BTEL) — facility `telemetry.test.js`
- [x] An authenticated batch records the user on each span (verifies spec: BTEL) — facility `telemetry.test.js`
- [x] A malformed batch is rejected and nothing is stored (verifies spec: BTEL) — facility `telemetry.test.js`
- [x] An oversized batch (over the max) is rejected (verifies spec: BTEL) — facility `telemetry.test.js`
- [ ] Events are batched in the browser and sent on the interval (manual / e2e)
- [ ] The routine interval flush does not set `keepalive` (only the unload flush does), and the unload flush is bounded so it stays under the browser's 64 KiB keepalive cap (verifies spec: BTEL) — unit test owed
- [ ] An exported batch never exceeds the size the ingest endpoint accepts (verifies spec: BTEL) — unit test owed
- [ ] The telemetry POST is not itself recorded as a span — no self-describing loop (verifies spec: BTEL) — unit test owed
- [ ] A failed/rejected send is swallowed and never disrupts the app or surfaces an error (verifies spec: BTEL) — manual / unit owed
- [x] Central accepts an unauthenticated batch from a central-connected client (admin) and stores spans with no facility (verifies spec: BTEL) — central `telemetry.test.js`
- [x] Central records the user on an authenticated batch, and rejects malformed and oversized batches (verifies spec: BTEL) — central `telemetry.test.js`
- [x] The patient-portal's own mount (`portal/public/telemetry`) stores spans on central with no facility, and rejects malformed/oversized batches (verifies spec: BTEL) — central `patientPortalApi/telemetry.test.js`
- [x] A batch whose `occurredAt` is not a datetime is rejected rather than reaching the database (verifies spec: BTEL) — central `patientPortalApi/telemetry.test.js`
- [x] The facility stamps its own configured facility id on each row (verifies spec: BTEL) — facility `telemetry.test.js`
- [x] Each ingest endpoint stamps the interface server-side — clinical (facility), admin (central public mount), patient-portal (central portal mount) — rather than trusting the client (verifies spec: BTEL) — facility + central `telemetry.test.js`, `patientPortalApi/telemetry.test.js`
- [x] An authenticated batch is accepted and records its reported user (verifies spec: BTEL) — facility `telemetry.test.js`

## Raw store and retention

- [x] The prune task removes spans older than the retention period and keeps recent ones (verifies spec: BTEL) — `CleanupBrowserTelemetry.test.js`
- [x] Rows are aged by when the server received them, so a client reporting a far-future `occurredAt` cannot evade retention (verifies spec: BTEL) — `CleanupBrowserTelemetry.test.js`
- [ ] Central runs the prune task too, so telemetry stored there (admin, portal) does not grow unbounded (verifies spec: BTEL) — registered in central's task list; a central-side test is owed
- [ ] The prune removes a very large backlog in bounded batches rather than one long transaction (verifies spec: BTEL) — volume test owed
- [x] The prune task reads its schedule and retention period from settings (verifies spec: BTEL) — `CleanupBrowserTelemetry.test.js`
- [ ] The raw table does not sync to central and is not written to the changelog (verifies spec: BTEL) — guard test owed (enforced by config today)

## Settings

- [ ] When telemetry is disabled, the clients collect and send nothing (verifies spec: BTEL) — unit / manual owed
- [ ] The patient portal honours the setting once its settings load (verifies spec: BTEL) — unit test owed
- [ ] The enabled flag reaches the web clients via the front-end settings (verifies spec: BTEL) — manual owed
- [ ] Telemetry defaults to on (verifies spec: BTEL) — settings test owed

## Pre-login

- [ ] The login-screen navigation is captured and attributed to the device alone (no user) (verifies spec: BTEL) — manual / e2e owed
