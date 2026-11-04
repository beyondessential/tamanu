---
id: BTAG
---

# Browser telemetry aggregation

Each server holding raw browser telemetry (see `platform/browser-telemetry.md`) rolls it up on a schedule into aggregated statistics that are kept for the long run. The aggregates serve two kinds of analysis: longer-term trends in how each page and endpoint performs, and acute issues where a particular record, device or code path is slow. They are what alerting and dashboards read, and the only form of browser telemetry that leaves the server that received it.

Two kinds of aggregate are produced for each time bucket: **trend rows**, summarising every event for a page or endpoint, and **slow events**, keeping the detail of the worst individual events.

## Rolling up

- [ ] A scheduled job on each server holding raw telemetry (each facility, and central for the admin panel and the patient portal) rolls the raw events up into aggregates.
- [ ] Events are bucketed by when the server received them, not by the time the browser reported, so a client with a wrong clock cannot misplace its events.
- [ ] Buckets sit on fixed boundaries that divide a day evenly, so buckets from different servers line up.
- [ ] A bucket is rolled up only once it has closed.
- [ ] The job records how far it has rolled up and resumes from there, so every raw event is counted exactly once, including after a missed run, a restart or a failure partway through.
- [ ] On its first run the job rolls up all raw events still held, so data collected before aggregation was deployed is not lost.
- [ ] A bucket with no events for a page or endpoint produces no rows for it.
- [ ] Changing the bucket size takes effect from the next bucket boundary; aggregates already produced keep the bucket they were rolled up with, and each records its bucket's start and length.

## Trend rows

A trend row summarises every event for one page or endpoint in one bucket. Rows are keyed so that a slowdown can be isolated to a facility, an interface, or a release.

- [ ] Each bucket has one trend row per combination of interface, facility, event kind (navigation or request), route pattern, HTTP method (requests only) and application version.
- [ ] Events are grouped by the route pattern exactly as recorded; the rollup does not infer patterns from concrete paths.
- [ ] A trend row records the number of events.
- [ ] A request trend row counts its requests by response class: successful, client error, server error, and no response.
- [ ] A navigation trend row counts its navigations by outcome: settled, capped and abandoned.
- [ ] Duration statistics cover every request, and every settled or capped navigation; a capped navigation contributes its capped duration. Abandoned navigations are counted but kept out of the duration statistics, because their time is not a page load.
- [ ] A trend row records the total duration, so a mean can be computed for any combination of rows.
- [ ] A trend row records its durations as a histogram: counts of events falling in each of a fixed set of duration bands, narrow for fast responses and progressively wider for slow ones, with an open-ended top band.
- [ ] The histogram bands are the same on every row, every server and every version, so rows can be added together to compute percentiles over any time range, facility or release.
- [ ] A trend row also records the median, 95th and 99th percentile and maximum duration, computed exactly from that bucket's events.

## Slow events

Slow events keep enough detail to trace an acute issue to the record, device or user involved, while carrying nothing patient-identifying beyond record identifiers.

- [ ] For each trend row, the job keeps as slow events the slowest events up to a configured number, plus every event over the configured slow threshold for its kind, with the total kept for one trend row limited by a configured cap.
- [ ] Navigations and requests each have their own slow threshold.
- [ ] Abandoned navigations are never kept as slow events.
- [ ] A slow event records when it occurred, its duration, its route pattern, method and response status (for a request) or outcome (for a navigation), the interface, facility, application version, device and user, along with the trend row it belongs to.
- [ ] A slow event records its path parameter values, so a slow load can be traced to the specific patient, encounter or other record it was for.
- [ ] A slow event records the names of its query parameters but never their values, since query values can hold patient-identifying search terms.
- [ ] A slow request made while a page was loading records the route pattern of that navigation, so an endpoint that is only slow on one page can be told apart.
- [ ] A slow navigation keeps every request made while it was loading, each with its route pattern, method, response status, duration, path parameter values, query parameter names, and when it started relative to the navigation, so the request that held the page up can be identified.

## Storage and reporting

- [ ] Aggregates produced on a facility are pushed to central, so central holds the whole deployment's aggregates in one place; aggregates produced on central are stored there directly.
- [ ] Raw telemetry never leaves the server that received it; only aggregates are pushed.
- [ ] Aggregates are kept indefinitely and are not removed by the raw telemetry prune.

## Settings

Aggregation settings apply server-wide, like the other telemetry settings, since both facility and central servers roll up.

- [ ] A setting defines the bucket size, defaulting to one hour.
- [ ] A setting defines how many of the slowest events are kept for each trend row.
- [ ] Separate settings define the slow threshold for navigations and for requests.
- [ ] A setting defines the cap on slow events kept for each trend row.
