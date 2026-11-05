---
id: BTAG
---

# Browser telemetry aggregation

Each server holding raw browser telemetry (see `platform/browser-telemetry.md`) rolls it up on a schedule into aggregated statistics that are kept for the long run. The aggregates serve two kinds of analysis: longer-term trends in how each page and endpoint performs, and acute issues where a particular record, device or code path is slow. They are the source for alerting and trend analysis, and the only form of browser telemetry that leaves the server that received it.

Two kinds of aggregate are produced for each time bucket: **trend rows**, summarising every event for a page or endpoint, and **slow events**, keeping the detail of the worst individual events.

## Rolling up

- [ ] A scheduled job on each server holding raw telemetry (each facility, and central for the admin panel and the patient portal) rolls the raw events up into aggregates.
- [ ] Events are bucketed by when the server received them, not by the time the browser reported, so a client with a wrong clock cannot misplace its events.
- [ ] Buckets sit on fixed boundaries measured from midnight UTC, and the bucket size divides a day evenly, so buckets from different servers line up.
- [ ] A bucket is rolled up once no further events can still be recorded into it, and its aggregates are available shortly after.
- [ ] The job records how far it has rolled up and resumes from there, so each raw event still held is counted exactly once, including after a missed run, a restart or a failure partway through.
- [ ] Raw events that reach the retention period before being rolled up are removed by the raw prune uncounted.
- [ ] On its first run the job rolls up all raw events still held, so data collected before aggregation was deployed is not lost.
- [ ] The job runs whether or not collection is enabled, so events received before collection was switched off are still rolled up.
- [ ] A bucket with no events for a page or endpoint produces no rows for it.
- [ ] A change to the bucket size takes effect from the first boundary of the new size; until then buckets of the previous size continue, so no stretch of time is skipped or counted twice. Each aggregate records its bucket's start and length.
- [ ] Rolling up a bucket again, such as after a server is restored from a backup, updates the aggregates it produces rather than duplicating them, and leaves other aggregates for that bucket in place, so central keeps its record of a period whose raw events the restored server no longer holds.
- [ ] If the server's clock ran ahead and was then corrected, the job rolls up recent buckets again, so events received after the correction are still counted.

## Trend rows

A trend row summarises every event for one page or endpoint in one bucket. Rows are keyed so that a slowdown can be isolated to a facility, an interface, or a release.

- [ ] Each bucket has one trend row per combination of interface, facility, event kind (navigation or request), route pattern, HTTP method (requests only) and application version.
- [ ] Trend rows for the admin panel and the patient portal carry no facility.
- [ ] Events are grouped by the route pattern exactly as recorded; the rollup does not infer patterns from concrete paths.
- [ ] A trend row records the number of events.
- [ ] A request trend row counts its requests by response class: successful (status below 400), client error (400 to 499), server error (500 and above), no response (the request failed before a response arrived), and cut off (still in flight when the navigation it belonged to was abandoned or capped).
- [ ] A navigation trend row counts its navigations by outcome: settled, capped and abandoned.
- [ ] Duration statistics cover every request except those cut off, and every settled or capped navigation; a capped navigation contributes its capped duration. Abandoned navigations and cut-off requests are counted but kept out of the duration statistics, because their time is not a complete load.
- [ ] A trend row records the total duration, so a mean can be computed for any combination of rows.
- [ ] A trend row records its durations as a histogram: counts of events falling in each of a fixed set of duration bands.
- [ ] The duration bands have upper bounds of 50, 100, 200, 300, 500, 750, 1000, 1500, 2000, 3000, 5000, 7500, 10000, 15000, 20000, 30000 and 60000 milliseconds, each inclusive, with a final band for anything slower.
- [ ] The bands are the same on every row, every server and every version, so rows can be added together to compute percentiles over any time range, facility or release.
- [ ] A trend row also records the median, 95th and 99th percentile and maximum duration, computed exactly from that bucket's events using the nearest-rank method.

## Slow events

Slow events keep enough detail to trace an acute issue to the record, device or user involved, while carrying nothing patient-identifying beyond record identifiers.

- [ ] For each trend row, the job keeps as slow events the slowest events up to a configured number, plus every event over the configured slow threshold for its kind, with the total kept for one trend row limited by a configured cap. When more events qualify than the cap allows, the slowest are kept.
- [ ] Navigations and requests each have their own slow threshold.
- [ ] Abandoned navigations and cut-off requests are never kept as slow events.
- [ ] A slow event records the time the browser reported for it and the time the server received it, its duration, its route pattern, method and response status (for a request) or outcome (for a navigation), the interface, facility, application version, device and user, along with the trend row it belongs to.
- [ ] A slow event records its path parameter values, so a slow load can be traced to the specific patient, encounter or other record it was for.
- [ ] A slow event records the names of its query parameters but never their values, since query values can hold patient-identifying search terms.
- [ ] A slow request made while a page was loading records the route pattern of that navigation, so an endpoint that is only slow on one page can be told apart.
- [ ] A slow navigation keeps every request made while it was loading, each with its route pattern, method, response status or whether it was cut off, duration, path parameter values, query parameter names, and when it started relative to the navigation, so the request that held the page up can be identified. These requests belong to the slow navigation and do not count toward the cap.

## Storage and reporting

- [ ] Aggregates produced on a facility are pushed to central, so central holds the whole deployment's aggregates in one place; aggregates produced on central are stored there directly.
- [ ] Raw telemetry never leaves the server that received it; only aggregates are pushed.
- [ ] Aggregates are kept indefinitely and are not removed by the raw telemetry prune.

## Settings

Aggregation settings apply server-wide, like the other telemetry settings, since both facility and central servers roll up. They are read only by the servers, and the job reads them on every run, so a change applies without a restart.

- [ ] A setting defines the bucket size, defaulting to one hour; a size that does not divide a day evenly is rejected.
- [ ] A setting defines how many of the slowest events are kept for each trend row, defaulting to five.
- [ ] Separate settings define the slow threshold for navigations, defaulting to five seconds, and for requests, defaulting to two seconds.
- [ ] A setting defines the cap on slow events kept for each trend row, defaulting to twenty.
