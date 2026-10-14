---
id: BTEL
---

# Browser performance telemetry

The web clients measure how the application performs from the user's seat — how long each page takes to become usable, and how long the individual API requests behind it take — and record those measurements on the facility server for later analysis. Measurement is done in the browser with OpenTelemetry; the raw events are stored locally on the facility server and pruned on a retention schedule.

This spec covers collecting the measurements and storing the raw events. Rolling the raw events up into summary statistics, anonymising them, and reporting them onward (to central and Canopy) are handled separately; the raw store described here is the source those steps read from.

## What is measured

Each in-app navigation is recorded as one OpenTelemetry trace: a navigation span covering the whole page load, with a child span for every API request made during it. Measuring with traces (rather than pre-aggregated metrics) keeps each navigation and request as an individual record that can be drilled into, and leaves bucketing to the downstream aggregation step.

- [ ] Every in-app navigation produces one trace whose root is a navigation span; each API request issued during that navigation is a child span of it.
- [ ] A navigation span's duration is the page-load time — from navigation start until the page settles (see [Determining when a page has loaded](#determining-when-a-page-has-loaded)).
- [ ] An API request span records the request's HTTP method, path, response status, and duration.
- [ ] Telemetry is collected on all three web interfaces: the clinical web app, the admin panel, and the patient portal.
- [ ] Collecting and reporting telemetry never blocks the application or surfaces an error to the user; it is best-effort, and any failure in the telemetry path is swallowed.

## Determining when a page has loaded

A page is considered loaded when the burst of API activity triggered by navigating to it has gone quiet — the measurement reflects when the page's data is ready, which is a close and low-noise proxy for when the page becomes usable.

- [ ] Navigation start is the moment the in-app route changes.
- [ ] A navigation is settled once no navigational API request has been in flight for a short quiet window, and the navigation span ends at the point activity went quiet.
- [ ] Background and polling requests (those that recur independently of navigating, such as live-updating queries and server-alive checks) are excluded from the quiet calculation, so a page with ongoing background activity still settles.
- [ ] If the user navigates away before the page settles, the in-progress navigation is abandoned rather than recorded as a completed load, and its measurement is not attributed to the next route.
- [ ] A navigation that never goes quiet is ended by a hard time cap, and recorded as having hit the cap.

## What each event records

Each event carries enough context to both bucket it by page downstream and drill into a single slow request. Record identifiers that appear in paths are UUIDs and carry no patient-identifying meaning; query parameters may contain patient-identifying values (such as a search term), which is acceptable here because the raw events never leave the facility server and are anonymised before they are reported onward.

- [ ] Each event records the trace it belongs to, so a navigation and its request spans can be tied together, and whether it is a navigation or a request.
- [ ] Each event records the full request or route path including query parameters, and the matched route pattern (for example `/patients/:patientId/encounter/:encounterId`), so the downstream step can group by page without re-deriving the pattern.
- [ ] A navigation event records its outcome: settled normally, abandoned, or capped.
- [ ] Each event records the interface it came from (clinical web, admin, or patient portal), the application version, the device, the session, the user, and the time it occurred.
- [ ] Paths and query parameters are recorded as-is; no patient-identifying information is stripped in the browser.

## Reporting to the facility server

Collected events are held in the browser and sent in batches to the facility server the client is connected to, on a regular interval. The browser reports only to its own facility server, never directly to any remote server.

- [ ] Events are batched in the browser and sent to the facility server on a regular interval.
- [ ] The browser sends telemetry only to its own facility server.
- [ ] A failed or rejected send discards that batch without retrying indefinitely and without disrupting the application.

## Raw store on the facility server

The facility server writes received events into a single flat table — one row per span — in the `logs` schema, alongside the other local-only operational logs. The table is high-volume and local to the facility.

- [ ] Received telemetry events are written to a single flat table, one row per span, with a trace identifier tying a navigation's rows together.
- [ ] The raw telemetry table does not sync to central and is not recorded in the changelog.
- [ ] A scheduled job removes raw telemetry rows older than the configured retention period.

## Settings

Telemetry is governed by facility settings so operators can control it without a redeploy. The enablement flag is exposed to the web clients so a client knows whether to collect at all.

- [ ] A facility setting turns browser telemetry on or off; when off, the clients collect and send nothing.
- [ ] The enablement setting is exposed to the web clients.
- [ ] A facility setting defines the raw-event retention period, defaulting to one month.
