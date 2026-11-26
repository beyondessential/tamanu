---
id: BTEL
---

# Browser performance telemetry

Applies to the web clients measuring how the application performs from the user's seat — how long each page takes to become usable, and how long every API request takes — and to storing those raw measurements on the Tamanu server the client talks to; rolling them up into statistics that are kept long-term and reported to central is specified in [Browser telemetry aggregation](browser-telemetry-aggregation.md), which reads the raw store described here as its source.

## What is measured

- Every API request is recorded as a request span, whether or not it belongs to a navigation, so the latency of any endpoint (including suggesters, form submissions, and background requests) can be analysed.
- An API request span records the request's HTTP method, path, response status, and duration.
- An in-app navigation produces a trace whose root is a navigation span; each API request issued while that navigation is loading is a child span of it.
- A request issued when no navigation is loading is recorded as a standalone request span — its own trace, with no navigation parent.
- A navigation span's duration is the page-load time, from navigation start until [the page settles](#determining-when-a-page-has-loaded).
- Measurement is done in the browser with OpenTelemetry.
- Telemetry is collected on all three web interfaces: the clinical web app, the admin panel, and the patient portal.
- The receiving server is the one the client already talks to: the facility server for the clinical client, and central for the admin panel and the patient portal.
- When telemetry is enabled, collection begins from the initial application load, before the user has signed in, so the login screen and the navigations leading up to sign-in are measured like any other page.
- Collecting and reporting telemetry never blocks the application or surfaces an error to the user; it is best-effort, and any failure in the telemetry path is swallowed.

> [!NOTE]
> Measuring with spans rather than pre-aggregated metrics keeps each request and navigation as an individual record that can be drilled into, and leaves bucketing to the downstream aggregation step.

## Determining when a page has loaded

- A page is considered loaded when the burst of API activity triggered by navigating to it has gone quiet.
- Navigation start is the moment the in-app route changes.
- A navigation is settled once no navigational API request has been in flight for a short quiet window, and the navigation span ends at the point activity went quiet.
- Background and polling requests (those that recur independently of navigating, such as live-updating queries and server-alive checks) are excluded from the quiet calculation, so a page with ongoing background activity still settles.
- If the user navigates away before the page settles, the in-progress navigation is abandoned rather than recorded as a completed load, and its measurement is not attributed to the next route.
- A navigation that never goes quiet is ended by a hard time cap, and recorded as having hit the cap.
- A navigational request still in flight when its navigation is abandoned or capped is ended with it, and records that it was cut off by the navigation's outcome.

> [!NOTE]
> Quiet API activity measures when the page's data is ready, which is a close and low-noise proxy for when the page becomes usable.

## What each event records

- Each event records the trace it belongs to, so a navigation and its request spans can be tied together, and whether it is a navigation or a request.
- Each event records the generic route pattern (for example `/patients/:patientId/encounter/:encounterId`) as its grouping key, and records the resolved parameters separately — the path parameters (such as `patientId` and `encounterId`) apart from the query parameters — so the downstream step groups by pattern and can still drill into a specific patient, encounter, or search without parsing a concrete path.
- A navigation event records its outcome: settled normally, abandoned, or capped.
- A request made while a navigation is loading records the route pattern of that navigation.
- Each event records the interface it came from (clinical web, admin, or patient portal), the application version, the device, and the time it occurred. The interface is determined by the receiving server's ingest endpoint — each is reached by exactly one interface — rather than reported by the client.
- Each event records the facility of the server that received it and when that server received it. A server hosting several facilities attributes every event to its primary facility, and events received by central carry no facility.
- The device is identified by the client's stable per-workstation identifier, which persists across logins and sessions on that browser, so a consistently slow machine or location can be isolated independently of which user was signed in.
- An event records the user and session once a user has signed in; an event produced before sign-in, or after signing out, is attributed to the device alone.
- A session lasts for one sign-in: each sign-in starts a new session, even for the same user on the same page load.
- Parameter values, including query parameters, are recorded as-is; no patient-identifying information is stripped in the browser.

> [!NOTE]
> Each event carries enough context to both bucket it by page downstream and drill into a single slow request. Record identifiers appearing in paths are UUIDs and carry no patient-identifying meaning; query parameters may contain patient-identifying values such as a search term, which is acceptable because the raw events never leave the server that received them, and query values are stripped from anything reported onward.

## Reporting to the server

- Events are batched in the browser and sent to the server on a regular interval.
- The browser sends telemetry only to the server it is already talking to, never directly to any third-party service.
- The server accepts telemetry from clients that have not yet authenticated, so pre-login activity is recorded; an authenticated batch additionally carries the user.
- A failed or rejected send discards that batch without retrying indefinitely and without disrupting the application.

## Raw store

- Received telemetry events are written to a single flat table, one row per span, with a trace identifier tying a navigation's rows together.
- The table sits in the `logs` schema, alongside the other local-only operational logs, and is local to the receiving server: per facility for the clinical client, and on central for the admin panel and the patient portal.
- The raw telemetry table does not sync to central and is not recorded in the changelog.
- A scheduled job on each server holding raw telemetry — facility and central alike — removes rows older than the configured retention period.
- The retention period applies to raw events only; the [aggregates rolled up from them](browser-telemetry-aggregation.md) are kept separately.

## Settings

- A setting turns browser telemetry on or off, defaulting to on; when off, the clients collect and send nothing. Until a client has read the setting it collects, matching the default.
- The enablement setting is exposed to every web client, including the patient portal.
- A single server-wide setting defines the retention period, defaulting to one month; the scheduled prune on each server holding raw telemetry (facility and central) applies it.
- The retention setting is read only by the servers.

> [!NOTE]
> Telemetry is governed by settings so operators can control it without a redeploy. The settings are server-wide rather than per facility because every web client collects telemetry and they do not all talk to a facility server.
