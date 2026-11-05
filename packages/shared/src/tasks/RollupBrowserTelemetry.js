import { QueryTypes } from 'sequelize';

import {
  FACT_BROWSER_TELEMETRY_ROLLED_UP_TO,
  FACT_BROWSER_TELEMETRY_ROLLUP_BUCKET_MINUTES,
  TELEMETRY_HISTOGRAM_BAND_COUNT,
  TELEMETRY_HISTOGRAM_BAND_UPPER_BOUNDS_MS,
  TELEMETRY_NAV_OUTCOMES,
  TELEMETRY_SPAN_KINDS,
} from '@tamanu/constants';

import { ScheduledTask } from './ScheduledTask';
import { log } from '../services/logging';
import { floorToBucket, nextBucket } from '../utils/browserTelemetryBuckets';

// A bucket is rolled up only once no further spans can be recorded into it. A
// span's `created_at` is stamped when its ingest transaction starts, so an
// insert that began just before the bucket ended can still be committing; this
// margin comfortably covers that.
const CLOSED_BUCKET_GRACE_MS = 2 * 60 * 1000;

// Constants interpolated into the SQL below (never user input).
const BAND_BOUNDS_SQL = `ARRAY[${TELEMETRY_HISTOGRAM_BAND_UPPER_BOUNDS_MS.join(', ')}]::integer[]`;
const { NAVIGATION, REQUEST } = TELEMETRY_SPAN_KINDS;
const { SETTLED, CAPPED, ABANDONED } = TELEMETRY_NAV_OUTCOMES;

// The bucket's raw spans, each with the id of the trend row it rolls into, its
// response class (requests only), and whether its duration is a complete load
// that belongs in the duration statistics: abandoned navigations and requests
// cut off by their navigation are counted but not timed.
//
// Spans of a kind the collector does not produce are ignored. A span sent twice
// (same trace and span id) counts once.
//
// The trend row id is derived from the row's key, so rolling the bucket up
// again lands on the same row.
const BUCKET_SPANS_CTE = `
  bucket_spans AS (
    SELECT DISTINCT ON (s.trace_id, s.span_id)
      s.*,
      md5(json_build_array(
        :bucketStartEpoch, :bucketMinutes,
        s.interface, s.facility_id, s.kind, s.route, s.method, s.app_version
      )::text)::uuid::text AS trend_id,
      CASE
        WHEN s.kind <> '${REQUEST}' THEN NULL
        WHEN s.outcome IS NOT NULL THEN 'cut_off'
        WHEN s.status_code IS NULL THEN 'no_response'
        WHEN s.status_code < 400 THEN 'successful'
        WHEN s.status_code < 500 THEN 'client_error'
        ELSE 'server_error'
      END AS response_class,
      (s.kind = '${REQUEST}' AND s.outcome IS NULL)
        OR (s.kind = '${NAVIGATION}' AND s.outcome IN ('${SETTLED}', '${CAPPED}')) AS is_timed
    FROM logs.browser_telemetry_spans s
    WHERE s.created_at >= :bucketStart
      AND s.created_at < :bucketEnd
      AND s.deleted_at IS NULL
      AND s.kind IN ('${NAVIGATION}', '${REQUEST}')
    ORDER BY s.trace_id, s.span_id, s.created_at
  )
`;

// Path parameter values are record ids and are kept; query parameters keep only
// their names, since their values can hold patient-identifying search terms.
const pathParametersSql = alias => `
  CASE WHEN jsonb_typeof(${alias}.parameters -> 'path') = 'object'
    THEN ${alias}.parameters -> 'path'
    ELSE '{}'::jsonb
  END`;
const queryParameterNamesSql = alias => `
  CASE WHEN jsonb_typeof(${alias}.parameters -> 'query') = 'object'
    THEN ARRAY(SELECT name FROM jsonb_object_keys(${alias}.parameters -> 'query') AS name ORDER BY name)
    ELSE '{}'::text[]
  END`;

const ROLL_UP_TRENDS_SQL = `
  WITH ${BUCKET_SPANS_CTE},
  band_counts AS (
    -- Bands are inclusive of their upper bound; durations are whole milliseconds.
    SELECT trend_id, width_bucket(duration_ms - 1, ${BAND_BOUNDS_SQL}) AS band, count(*)::integer AS n
    FROM bucket_spans
    WHERE is_timed
    GROUP BY 1, 2
  ),
  histograms AS (
    SELECT trends.trend_id, array_agg(coalesce(band_counts.n, 0) ORDER BY bands.band) AS duration_histogram
    FROM (SELECT DISTINCT trend_id FROM bucket_spans) trends
    CROSS JOIN generate_series(0, ${TELEMETRY_HISTOGRAM_BAND_COUNT - 1}) AS bands(band)
    LEFT JOIN band_counts ON band_counts.trend_id = trends.trend_id AND band_counts.band = bands.band
    GROUP BY trends.trend_id
  )
  INSERT INTO browser_telemetry_trends (
    id, bucket_start, bucket_minutes, interface, facility_id, kind, route, method, app_version,
    event_count, successful_count, client_error_count, server_error_count, no_response_count,
    cut_off_count, settled_count, capped_count, abandoned_count, timed_count, total_duration_ms,
    duration_histogram, p50_duration_ms, p95_duration_ms, p99_duration_ms, max_duration_ms
  )
  SELECT
    s.trend_id, :bucketStart, :bucketMinutes,
    s.interface, s.facility_id, s.kind, s.route, s.method, s.app_version,
    count(*),
    count(*) FILTER (WHERE s.response_class = 'successful'),
    count(*) FILTER (WHERE s.response_class = 'client_error'),
    count(*) FILTER (WHERE s.response_class = 'server_error'),
    count(*) FILTER (WHERE s.response_class = 'no_response'),
    count(*) FILTER (WHERE s.response_class = 'cut_off'),
    count(*) FILTER (WHERE s.kind = '${NAVIGATION}' AND s.outcome = '${SETTLED}'),
    count(*) FILTER (WHERE s.kind = '${NAVIGATION}' AND s.outcome = '${CAPPED}'),
    count(*) FILTER (WHERE s.kind = '${NAVIGATION}' AND s.outcome = '${ABANDONED}'),
    count(*) FILTER (WHERE s.is_timed),
    coalesce(sum(s.duration_ms) FILTER (WHERE s.is_timed), 0),
    h.duration_histogram,
    -- percentile_disc is the nearest-rank method.
    percentile_disc(0.5) WITHIN GROUP (ORDER BY s.duration_ms) FILTER (WHERE s.is_timed),
    percentile_disc(0.95) WITHIN GROUP (ORDER BY s.duration_ms) FILTER (WHERE s.is_timed),
    percentile_disc(0.99) WITHIN GROUP (ORDER BY s.duration_ms) FILTER (WHERE s.is_timed),
    max(s.duration_ms) FILTER (WHERE s.is_timed)
  FROM bucket_spans s
  JOIN histograms h ON h.trend_id = s.trend_id
  GROUP BY
    s.trend_id, s.interface, s.facility_id, s.kind, s.route, s.method, s.app_version,
    h.duration_histogram
  ON CONFLICT (id) DO UPDATE SET
    event_count = EXCLUDED.event_count,
    successful_count = EXCLUDED.successful_count,
    client_error_count = EXCLUDED.client_error_count,
    server_error_count = EXCLUDED.server_error_count,
    no_response_count = EXCLUDED.no_response_count,
    cut_off_count = EXCLUDED.cut_off_count,
    settled_count = EXCLUDED.settled_count,
    capped_count = EXCLUDED.capped_count,
    abandoned_count = EXCLUDED.abandoned_count,
    timed_count = EXCLUDED.timed_count,
    total_duration_ms = EXCLUDED.total_duration_ms,
    duration_histogram = EXCLUDED.duration_histogram,
    p50_duration_ms = EXCLUDED.p50_duration_ms,
    p95_duration_ms = EXCLUDED.p95_duration_ms,
    p99_duration_ms = EXCLUDED.p99_duration_ms,
    max_duration_ms = EXCLUDED.max_duration_ms,
    deleted_at = NULL
`;

// For each trend row: the slowest timed events up to `slowestPerRow`, plus every
// timed event over its kind's threshold, never more than `cap`. Ranking by
// duration makes both sets a prefix of the ranking, so the cap keeps the slowest.
// Each kept navigation also keeps every request made while it was loading.
const ROLL_UP_SLOW_EVENTS_SQL = `
  WITH ${BUCKET_SPANS_CTE},
  ranked AS (
    SELECT
      s.*,
      row_number() OVER (PARTITION BY s.trend_id ORDER BY s.duration_ms DESC, s.span_id) AS slowness_rank
    FROM bucket_spans s
    WHERE s.is_timed
  ),
  kept AS (
    INSERT INTO browser_telemetry_slow_events (
      id, trend_id, trace_id, span_id, kind, route, navigation_route, method, status_code,
      outcome, duration_ms, occurred_at, received_at, interface, facility_id, app_version,
      device_id, user_id, path_parameters, query_parameter_names
    )
    SELECT
      md5(json_build_array(r.trend_id, r.trace_id, r.span_id)::text)::uuid::text,
      r.trend_id, r.trace_id, r.span_id, r.kind, r.route, r.navigation_route, r.method,
      r.status_code, r.outcome, r.duration_ms, r.occurred_at, r.created_at, r.interface,
      r.facility_id, r.app_version, r.device_id, r.user_id,
      ${pathParametersSql('r')},
      ${queryParameterNamesSql('r')}
    FROM ranked r
    WHERE r.slowness_rank <= :slowEventCapPerRow
      AND (
        r.slowness_rank <= :slowestPerRow
        OR r.duration_ms > CASE r.kind
          WHEN '${NAVIGATION}' THEN :navigationSlowThresholdMs
          ELSE :requestSlowThresholdMs
        END
      )
    ON CONFLICT (id) DO UPDATE SET
      navigation_route = EXCLUDED.navigation_route,
      status_code = EXCLUDED.status_code,
      outcome = EXCLUDED.outcome,
      duration_ms = EXCLUDED.duration_ms,
      user_id = EXCLUDED.user_id,
      path_parameters = EXCLUDED.path_parameters,
      query_parameter_names = EXCLUDED.query_parameter_names,
      deleted_at = NULL
    RETURNING id, kind, trace_id, span_id, occurred_at
  )
  INSERT INTO browser_telemetry_slow_event_requests (
    id, slow_event_id, span_id, route, method, status_code, outcome, duration_ms,
    start_offset_ms, path_parameters, query_parameter_names
  )
  SELECT DISTINCT ON (navigation.id, request.span_id)
    md5(json_build_array(navigation.id, request.span_id)::text)::uuid::text,
    navigation.id, request.span_id, request.route, request.method, request.status_code,
    request.outcome, request.duration_ms,
    round(extract(epoch FROM request.occurred_at - navigation.occurred_at) * 1000)::integer,
    ${pathParametersSql('request')},
    ${queryParameterNamesSql('request')}
  FROM kept navigation
  JOIN logs.browser_telemetry_spans request
    ON request.trace_id = navigation.trace_id
    AND request.parent_id = navigation.span_id
    AND request.kind = '${REQUEST}'
    AND request.deleted_at IS NULL
  WHERE navigation.kind = '${NAVIGATION}'
  ORDER BY navigation.id, request.span_id, request.created_at
  ON CONFLICT (id) DO UPDATE SET
    status_code = EXCLUDED.status_code,
    outcome = EXCLUDED.outcome,
    duration_ms = EXCLUDED.duration_ms,
    start_offset_ms = EXCLUDED.start_offset_ms,
    path_parameters = EXCLUDED.path_parameters,
    query_parameter_names = EXCLUDED.query_parameter_names,
    deleted_at = NULL
`;

// spec: BTAG
// Rolls raw browser telemetry spans up into long-lived aggregates: a trend row
// per page or endpoint per bucket, and the slowest events behind each. Runs on
// every server holding raw telemetry (facilities, and central for the admin
// panel and patient portal), whether or not collection is currently enabled.
//
// Buckets are by `created_at` (when this server received the span), never the
// browser-reported `occurred_at`. Progress is recorded in local system facts and
// advanced in the same transaction as each bucket's aggregates, so each raw span
// still held is counted exactly once across missed runs, restarts and failures.
// Spans pruned before they are rolled up (CleanupBrowserTelemetry) go uncounted.
export class RollupBrowserTelemetry extends ScheduledTask {
  getName() {
    return 'RollupBrowserTelemetry';
  }

  constructor(context) {
    const { schedule, jitterTime, enabled } = context.schedules.rollupBrowserTelemetry;
    super(schedule, log, jitterTime, enabled);
    this.models = context.models;
    this.sequelize = context.models.BrowserTelemetrySpan.sequelize;
    // A reader for server-wide settings, read on every run so changes apply
    // without a restart.
    this.settings = context.globalSettings;
  }

  async run() {
    const aggregationSettings = await this.settings.get('telemetry.aggregation');
    const { LocalSystemFact } = this.models;

    const progress = await this.#readProgress(aggregationSettings.bucketMinutes);
    if (!progress) return;

    let { rolledUpTo, bucketMinutes: previousBucketMinutes } = progress;
    const closedBefore = Date.now() - CLOSED_BUCKET_GRACE_MS;
    let bucketsRolledUp = 0;

    for (;;) {
      const bucket = nextBucket(
        rolledUpTo,
        previousBucketMinutes,
        aggregationSettings.bucketMinutes,
      );
      if (bucket.end.getTime() > closedBefore) break;

      await this.sequelize.transaction(async () => {
        await this.#rollUpBucket(bucket, aggregationSettings);
        await LocalSystemFact.set(FACT_BROWSER_TELEMETRY_ROLLED_UP_TO, bucket.end.toISOString());
        await LocalSystemFact.set(
          FACT_BROWSER_TELEMETRY_ROLLUP_BUCKET_MINUTES,
          String(bucket.bucketMinutes),
        );
      });

      rolledUpTo = bucket.end;
      previousBucketMinutes = bucket.bucketMinutes;
      bucketsRolledUp += 1;
    }

    if (bucketsRolledUp > 0) {
      log.debug('RollupBrowserTelemetry: rolled up telemetry buckets', {
        bucketsRolledUp,
        rolledUpTo: rolledUpTo.toISOString(),
      });
    }
  }

  // Where the rollup got to, or, on the first run, the start of the bucket
  // holding the oldest raw span still held, so data collected before the rollup
  // was deployed is not lost. Null when there is nothing to roll up yet.
  async #readProgress(bucketMinutes) {
    const { LocalSystemFact, BrowserTelemetrySpan } = this.models;
    const rolledUpTo = await LocalSystemFact.get(FACT_BROWSER_TELEMETRY_ROLLED_UP_TO);
    if (rolledUpTo) {
      const previousBucketMinutes = Number(
        await LocalSystemFact.get(FACT_BROWSER_TELEMETRY_ROLLUP_BUCKET_MINUTES),
      );
      // Both facts are written in the same transaction, so this only fails if
      // they were edited by hand; rolling up with a zero-length bucket would
      // never advance.
      if (!(previousBucketMinutes > 0)) {
        throw new Error('RollupBrowserTelemetry: recorded bucket size is missing or invalid');
      }
      return { rolledUpTo: new Date(rolledUpTo), bucketMinutes: previousBucketMinutes };
    }

    const oldestReceivedAt = await BrowserTelemetrySpan.min('createdAt');
    if (!oldestReceivedAt) return null;
    return {
      rolledUpTo: floorToBucket(new Date(oldestReceivedAt), bucketMinutes),
      bucketMinutes,
    };
  }

  async #rollUpBucket(bucket, aggregationSettings) {
    const replacements = {
      bucketStart: bucket.start.toISOString(),
      bucketEnd: bucket.end.toISOString(),
      bucketStartEpoch: bucket.start.getTime() / 1000,
      bucketMinutes: bucket.bucketMinutes,
      slowestPerRow: aggregationSettings.slowestPerRow,
      slowEventCapPerRow: aggregationSettings.slowEventCapPerRow,
      navigationSlowThresholdMs: aggregationSettings.navigationSlowThresholdMs,
      requestSlowThresholdMs: aggregationSettings.requestSlowThresholdMs,
    };
    await this.sequelize.query(ROLL_UP_TRENDS_SQL, { replacements, type: QueryTypes.INSERT });
    await this.sequelize.query(ROLL_UP_SLOW_EVENTS_SQL, {
      replacements,
      type: QueryTypes.INSERT,
    });
  }
}
