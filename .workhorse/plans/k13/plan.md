# K13: Aggregate browser performance statistics

Roll the raw `logs.browser_telemetry_spans` rows (M9, spec BTEL) up into long-lived aggregates (spec BTAG). The Canopy alerts in N9 read these aggregates.

## Decisions from the interview

- Duration stats are a fixed-band histogram plus exact p50/p95/p99/max per row, so percentiles can be combined across any range
- Trend data is hourly by default (bucket size is a setting) and kept forever
- Facility aggregates are pushed to central; raw data never leaves its server
- Slow events are the top N per trend row plus anything over a per-kind threshold, capped per row; N, the thresholds and the cap are settings
- Slow events keep path parameter values and query parameter names only (no query values), plus device and user
- Slow events are kept forever
- Abandoned navigations are counted but kept out of the duration stats; capped ones are included at their capped duration
- Defaults: 5s navigation and 2s request slow thresholds, slowest 5 and a cap of 20 per row, histogram bands as below
- Collection (`telemetry.enabled`) is on by default from this card, now that it has passed testing. The web and portal clients collect until they have read the setting, matching the default

## Technical design notes

**Tables.** Three new tables in the `public` schema (not `logs`, since they sync), all `PUSH_TO_CENTRAL` following `UserLoginAttempt`, and listed in `NON_LOGGED_TABLES` so their re-rolls stay out of the changelog. Mobile never pulls push-only tables. `facility_id` is null for central's own rollups (admin panel and patient portal).

- `browser_telemetry_trends`: keyed by `(bucket_start, bucket_minutes, interface, facility_id, kind, route, method, app_version)`
- `browser_telemetry_slow_events`: reference their trend row by `trend_id`
- `browser_telemetry_slow_event_requests`: the requests behind a slow navigation, with `start_offset_ms` from the navigation's `occurred_at` (reliable, as both times come from the same client clock). A separate table keeps typed columns rather than a parent/child mix in one table
- `path_parameters` jsonb and `query_parameter_names` text[]
- No database foreign keys between them, since each pushes to central independently

**Deterministic ids.** Every aggregate id is an md5-derived uuid of what it describes (the trend key; trend id plus trace and span; slow event id plus span), and every insert is `ON CONFLICT (id) DO UPDATE`. Rolling a bucket up again, including after a facility restore, lands on the same rows locally and on central.

**Histogram.** `integer[]` against `TELEMETRY_HISTOGRAM_BAND_UPPER_BOUNDS_MS` in `@tamanu/constants`, commented as a permanent contract. Bands are inclusive of their upper bound, computed as `width_bucket(duration_ms - 1, bounds)` over whole milliseconds. Bounds (ms): 50, 100, 200, 300, 500, 750, 1000, 1500, 2000, 3000, 5000, 7500, 10000, 15000, 20000, 30000, 60000, then open-ended.

**Bucketing and progress.** Bucket by `created_at` (server receipt). The existing `browser_telemetry_spans_created_at` index serves the range scan. A bucket is rolled up once its end is at least two minutes past, covering ingest transactions still committing. Progress is two local system facts, the rolled-up-to time and the bucket size in use, advanced in the same transaction as each bucket's aggregates. On first run, start from the bucket holding the oldest raw row. Facts are only ever written together; a missing or invalid size throws rather than looping on a zero-length bucket.

**Bucket-size changes.** `nextBucket` uses the new size once the rolled-up-to time sits on one of its boundaries, and the previous size until then. Every allowed size divides a day, so midnight UTC is always a shared boundary.

**Cut-off requests and navigation route.** The browser marks a request cut off by its navigation (abandoned or capped) by setting the request span's `outcome` to the navigation's outcome. It also stamps each navigational request with the navigation's route (new raw column `navigation_route`). Stamping avoids joining to a navigation span that reaches the server after its requests.

**SQL.** Two statements per bucket, sharing a `bucket_spans` CTE that dedupes repeated spans (`DISTINCT ON (trace_id, span_id)`) and ignores unknown kinds:

- Trends: `GROUP BY` for counts, `percentile_disc` (nearest-rank) for headline stats, and the histogram built from `width_bucket`
- Slow events: `row_number()` by duration per trend, keeping `rank <= cap AND (rank <= N OR duration > threshold)`, inserted with `RETURNING`. Kept navigations then pull their child requests from the raw table by `trace_id` and `parent_id`

**Raw retention interplay.** The rollup runs every 15 minutes by default and only lags by one bucket, so it finishes well within the 30-day raw retention. Spans pruned before rollup go uncounted (agreed).

**Settings** (global `telemetry.aggregation`, server-wide, read on every run through `context.globalSettings`: `settings.global` on facility, the central reader on central):

- `bucketMinutes`: default 60, must divide 1440
- `slowestPerRow`: default 5
- `navigationSlowThresholdMs`: default 5000
- `requestSlowThresholdMs`: default 2000
- `slowEventCapPerRow`: default 20

The rollup schedule is `rollupBrowserTelemetry` in both `facility.ts` and `central.ts` scheduled tasks.

**Follow-ups outside this card.**

- Converting the remaining call sites that pass concrete paths (for example `procedure/${id}`) to `route()`. Until then their concrete paths become trend keys, as agreed
- A server hosting several facilities attributes everything to its primary facility, as agreed

## Build steps

- [x] Spec review fixes folded into BTAG and BTEL
- [x] Constants: histogram band boundaries, progress facts
- [x] Browser: mark cut-off requests and stamp navigation route; ingest and raw column for it
- [x] Migration and models for trends, slow events and slow-event requests (public schema, push to central, not changelogged)
- [x] Settings: aggregation group in global telemetry; schedule entries on facility and central
- [x] `RollupBrowserTelemetry` scheduled task in `packages/shared/src/tasks`, registered on facility and central
- [x] Rollup SQL: trend rows, histogram and headline percentiles
- [x] Rollup SQL: slow-event selection, child requests, query-value stripping
- [x] Progress handling, including first-run backfill and bucket-size change
- [x] dbt source models for the new tables and raw column
- [x] Tests: bucket unit tests, tracker unit tests, rollup and ingest integration tests
- [x] Sync: central push test for all three tables; existing facility and central sync suites pass
