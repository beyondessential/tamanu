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

## Technical design notes

**Tables.** Two new tables in the `public` schema (not `logs`, since they sync): `browser_telemetry_trends` and `browser_telemetry_slow_events`, both `PUSH_TO_CENTRAL`, following `UserLoginAttempt`. They must not reach mobile. `facility_id` is null for central's own rollups (admin panel and patient portal).

- Trend key: `(bucket_start, bucket_minutes, interface, facility_id, kind, route, method, app_version)`, with a unique index on it
- Slow events reference their trend row. The child requests of a slow navigation sit in the same table as rows with `parent_slow_event_id` and a `start_offset_ms` (offset from the navigation's `occurred_at`; the offset is reliable because both times come from the same client clock). This keeps them as typed columns instead of a JSON blob
- `path_parameters` jsonb (UUIDs only) and `query_parameter_names` text[]

**Histogram.** Store it as `integer[]` against a band-boundary constant in `@tamanu/constants`. Changing that constant breaks combinability, so it gets the same "public contract" comment treatment as the AI prompt protocol. Confirmed boundaries (ms): 50, 100, 200, 300, 500, 750, 1000, 1500, 2000, 3000, 5000, 7500, 10000, 15000, 20000, 30000, 60000, then open-ended.

**Bucketing and watermark.** Bucket by `created_at` (server receipt). The existing `browser_telemetry_spans_created_at` index serves the range scan. A bucket closes at `bucket_end + grace`, a short grace that covers commit lag on in-flight ingest. Keep the watermark in `local_system_facts` and advance it in the same transaction as each bucket's inserts, so the job is exactly-once and resumable. On first run, process from the oldest raw row. One transaction per bucket keeps transactions short.

**SQL.** Do one `GROUP BY` over the bucket's raw rows for counts and sums, `percentile_disc` for the headline stats, and `width_bucket` against the bands for the histogram. Select slow events with `row_number() over (partition by <trend key> order by duration_ms desc)`, union the threshold rows, then cap. Pull a slow navigation's children by `trace_id`, and a slow request's navigation route through `parent_id`.

**Raw retention interplay.** The rollup runs often (every 15 minutes by default) and only lags by one bucket, so it finishes well within the 30-day raw retention. Nothing extra is needed beyond the prune not touching the aggregate tables.

**Settings** (global `telemetry` group, server-wide):

- `aggregation.bucketMinutes`: default 60, must divide 1440
- `aggregation.slowestPerRow`: default 5
- `aggregation.navigationSlowThresholdMs`: default 5000
- `aggregation.requestSlowThresholdMs`: default 2000
- `aggregation.slowEventCapPerRow`: default 20

The rollup schedule is `rollupBrowserTelemetry` in both `facility.ts` and `central.ts` scheduled tasks. The user has confirmed these defaults.

**Bucket-size changes.** When the bucket size changes, the next bucket starts at the first boundary of the new size that is at or after the watermark. Each row carries `bucket_minutes`.

## Build steps

- [ ] Constants: histogram band boundaries, response-class names
- [ ] Migration and models for trends and slow events (public schema, push to central, excluded from mobile sync)
- [ ] Settings: aggregation group in global telemetry; schedule entries on facility and central
- [ ] `RollupBrowserTelemetry` scheduled task in `packages/shared/src/tasks`, registered on facility and central
- [ ] Rollup SQL: trend rows, histogram and headline percentiles
- [ ] Rollup SQL: slow-event selection, child requests, query-value stripping
- [ ] Watermark handling, including first-run backfill and bucket-size change
- [ ] Sync: confirm the tables push from facility to central and do not reach mobile
- [ ] dbt source models for the new tables, with `path_parameters` masked
- [ ] Tests: rollup unit and integration tests, sync push test
