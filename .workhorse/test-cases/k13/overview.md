# Aggregate browser performance statistics: test cases

Scenarios for the browser telemetry rollup (spec: BTAG) and the browser and ingest changes it depends on (spec: BTEL). Automated cases live in `packages/facility-server/__tests__/tasks/RollupBrowserTelemetry.test.js`, `packages/shared/__tests__/utils/browserTelemetryBuckets.test.js` and `packages/ui-components/src/telemetry/__tests__/navigationTracker.test.js`, with the central push in `packages/central-server/__tests__/sync/CentralSyncManager.addIncomingChanges.test.js`.

## Rolling up

- [x] With no raw telemetry, the rollup does nothing and records no progress (verifies spec: BTAG)
- [x] The first run rolls up from the bucket holding the oldest raw span, through every closed bucket (verifies spec: BTAG)
- [x] Spans are bucketed by when the server received them, not the browser-reported time (verifies spec: BTAG)
- [x] A bucket that has not closed is left for a later run (verifies spec: BTAG)
- [x] A span received into a bucket already rolled up is not counted again (verifies spec: BTAG)
- [x] A long stretch with no spans is skipped rather than rolled up bucket by bucket
- [x] With progress ahead of the clock (a fast clock since corrected), recent buckets are rolled up again and new spans counted (verifies spec: BTAG)
- [x] A larger bucket size waits for its first boundary, finishing buckets of the previous size end to end (verifies spec: BTAG)
- [x] With progress lost (as after a restore) but raw spans present, rolling up again updates trend rows and slow events rather than duplicating them (verifies spec: BTAG)
- [x] Bucket boundaries are measured from midnight UTC (verifies spec: BTAG)
- [x] A smaller bucket size applies from the next boundary; a larger one waits for its first boundary, with no gap (verifies spec: BTAG)
- [x] The rollup rolls up with a new bucket size from its first boundary end to end (verifies spec: BTAG)
- [ ] A bucket-size setting that does not divide a day is rejected in the settings editor (verifies spec: BTAG)
- [ ] A settings change (e.g. thresholds) applies on the next run without restarting the server (verifies spec: BTAG)
- [ ] The rollup still runs with telemetry collection switched off (verifies spec: BTAG)
- [ ] Raw spans pruned before being rolled up are simply absent from the aggregates (verifies spec: BTAG)

## Trend rows

- [x] Requests are counted by response class, with cut-off requests counted but kept out of the duration statistics (verifies spec: BTAG)
- [x] Navigations are counted by outcome, with capped loads timed at their capped duration and abandoned loads untimed (verifies spec: BTAG)
- [x] Histogram bands are inclusive of their upper bound, and percentiles use the nearest-rank method (verifies spec: BTAG)
- [x] Rows are keyed separately by bucket, route, method and application version (verifies spec: BTAG)
- [ ] Rows rolled up on central for the admin panel and patient portal carry no facility (verifies spec: BTAG)

## Slow events

- [x] The slowest N plus everything over the threshold are kept, limited by the cap, keeping the slowest (verifies spec: BTAG)
- [x] A fast route still keeps its slowest N (verifies spec: BTAG)
- [x] Abandoned navigations and cut-off requests are never kept (verifies spec: BTAG)
- [x] Path parameter values and query parameter names are kept; query values never are (verifies spec: BTAG)
- [x] A slow request keeps the route of the page that was loading (verifies spec: BTAG)
- [x] A slow navigation keeps every request made while it loaded, with start offsets and cut-off outcomes (verifies spec: BTAG)
- [x] A request dated weeks from its navigation is clamped rather than failing the bucket

## Browser and ingest

- [x] A request still in flight when its navigation is abandoned or capped is ended with it and records that outcome; a late settle is ignored (verifies spec: BTEL)
- [x] A navigational request carries its navigation's route; a standalone request carries none (verifies spec: BTEL)
- [x] The ingest stores the navigation route sent with a request (verifies spec: BTEL)
- [ ] On a fresh deployment with the telemetry setting untouched, the web client and patient portal collect from the first load, including the login screen; switching the setting off stops them (verifies spec: BTEL)

## Storage and reporting

- [x] Central accepts and stores trend rows, slow events and slow-event requests pushed from a facility (verifies spec: BTAG)
- [ ] Aggregates created on a facility push to central on the next real sync, and are not pulled by other facilities or mobile (verifies spec: BTAG)
- [ ] Aggregates are untouched by the raw telemetry prune (verifies spec: BTAG)
- [ ] Smoke: with telemetry enabled on a deployed facility, trend rows appear on central within a sync of a bucket closing
