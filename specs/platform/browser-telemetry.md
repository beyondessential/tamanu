---
id: BTEL
---

# Browser performance telemetry

The web clients measure how the application performs from the user's seat — how long each page takes to become usable, and how long every API request takes — and record those measurements on the Tamanu server the client talks to for later analysis. For the clinical client that is its facility server; for the admin panel and the patient portal, which both talk to central, it is the central server. Measurement is done in the browser with OpenTelemetry; the raw events are stored locally on the receiving server and pruned on a retention schedule.

This spec covers collecting the measurements and storing the raw events. Rolling the raw events up into summary statistics, anonymising them, and reporting them onward (to central and Canopy) are handled separately; the raw store described here is the source those steps read from.

## What is measured

Every API request is timed, and each in-app navigation is timed as a page load. These are recorded as OpenTelemetry spans: a request span for every API call, and a navigation span covering each page load. A request made while a page is loading is tied to that navigation's trace; a request made at any other time — a type-ahead suggester, a form submission, a background poll — stands on its own. Measuring with spans (rather than pre-aggregated metrics) keeps each request and navigation as an individual record that can be drilled into, and leaves bucketing to the downstream aggregation step.

- [ ] Every API request is recorded as a request span, whether or not it belongs to a navigation, so the latency of any endpoint (including suggesters, form submissions, and background requests) can be analysed.
- [ ] An API request span records the request's HTTP method, path, response status, and duration.
- [ ] An in-app navigation produces a trace whose root is a navigation span; each API request issued while that navigation is loading is a child span of it.
- [ ] A request issued when no navigation is loading is recorded as a standalone request span — its own trace, with no navigation parent.
- [ ] A navigation span's duration is the page-load time — from navigation start until the page settles (see [Determining when a page has loaded](#determining-when-a-page-has-loaded)).
- [ ] Telemetry is collected on all three web interfaces: the clinical web app, the admin panel, and the patient portal.
- [ ] When telemetry is enabled, collection begins from the initial application load, before the user has signed in, so the login screen and the navigations leading up to sign-in are measured like any other page.
- [ ] Collecting and reporting telemetry never blocks the application or surfaces an error to the user; it is best-effort, and any failure in the telemetry path is swallowed.

## Determining when a page has loaded

A page is considered loaded when the burst of API activity triggered by navigating to it has gone quiet — the measurement reflects when the page's data is ready, which is a close and low-noise proxy for when the page becomes usable.

- [ ] Navigation start is the moment the in-app route changes.
- [ ] A navigation is settled once no navigational API request has been in flight for a short quiet window, and the navigation span ends at the point activity went quiet.
- [ ] Background and polling requests (those that recur independently of navigating, such as live-updating queries and server-alive checks) are excluded from the quiet calculation, so a page with ongoing background activity still settles.
- [ ] If the user navigates away before the page settles, the in-progress navigation is abandoned rather than recorded as a completed load, and its measurement is not attributed to the next route.
- [ ] A navigation that never goes quiet is ended by a hard time cap, and recorded as having hit the cap.

## What each event records

Each event carries enough context to both bucket it by page downstream and drill into a single slow request. Record identifiers that appear in paths are UUIDs and carry no patient-identifying meaning; query parameters may contain patient-identifying values (such as a search term), which is acceptable here because the raw events never leave the server that received them and are anonymised before they are reported onward.

- [ ] Each event records the trace it belongs to, so a navigation and its request spans can be tied together, and whether it is a navigation or a request.
- [ ] Each event records the generic route pattern (for example `/patients/:patientId/encounter/:encounterId`) as its grouping key, and records the resolved parameters separately — the path parameters (such as `patientId` and `encounterId`) apart from the query parameters — so the downstream step groups by pattern and can still drill into a specific patient, encounter, or search without parsing a concrete path.
- [ ] A navigation event records its outcome: settled normally, abandoned, or capped.
- [ ] Each event records the interface it came from (clinical web, admin, or patient portal), the application version, the device, and the time it occurred. The interface is determined by the receiving server's ingest endpoint — each is reached by exactly one interface — rather than reported by the client.
- [ ] The device is identified by the client's stable per-workstation identifier, which persists across logins and sessions on that browser, so a consistently slow machine or location can be isolated independently of which user was signed in.
- [ ] An event records the user and session once a user has signed in; an event produced before sign-in is attributed to the device alone.
- [ ] Parameter values, including query parameters, are recorded as-is; no patient-identifying information is stripped in the browser.

## Reporting to the server

Collected events are held in the browser and sent in batches to the Tamanu server the client is connected to, on a regular interval. The browser reports only to its own server, never directly to any third-party service.

- [ ] Events are batched in the browser and sent to the server on a regular interval.
- [ ] The browser sends telemetry only to the server it is already talking to.
- [ ] The server accepts telemetry from clients that have not yet authenticated, so pre-login activity is recorded; an authenticated batch additionally carries the user.
- [ ] A failed or rejected send discards that batch without retrying indefinitely and without disrupting the application.

## Raw store

The receiving server writes events into a single flat table — one row per span — in the `logs` schema, alongside the other local-only operational logs. The table is high-volume and local to that server: per facility for the clinical client, and on central for the admin panel and the patient portal.

- [ ] Received telemetry events are written to a single flat table, one row per span, with a trace identifier tying a navigation's rows together.
- [ ] The raw telemetry table does not sync to central and is not recorded in the changelog.
- [ ] A scheduled job on each server holding raw telemetry — facility and central alike — removes rows older than the configured retention period.

## Settings

Telemetry is governed by settings so operators can control it without a redeploy. Because every web client collects it, and they do not all talk to a facility server, the telemetry settings (enablement and retention) apply server-wide rather than per facility. The enablement flag is exposed to the web clients so a client knows whether to collect at all; retention is read only by the servers.

- [ ] A setting turns browser telemetry on or off, defaulting to off; when off, the clients collect and send nothing. It is opt-in: an operator enables it per deployment.
- [ ] The enablement setting is exposed to every web client, including the patient portal.
- [ ] A single server-wide setting defines the retention period, defaulting to one month; the scheduled prune on each server holding raw telemetry (facility and central) applies it.
