import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  FACT_BROWSER_TELEMETRY_ROLLED_UP_TO,
  FACT_BROWSER_TELEMETRY_ROLLUP_BUCKET_MINUTES,
  TELEMETRY_HISTOGRAM_BAND_COUNT,
} from '@tamanu/constants';
import { globalDefaults } from '@tamanu/settings';
import { RollupBrowserTelemetry } from '@tamanu/shared/tasks/RollupBrowserTelemetry';
import { floorToBucket } from '@tamanu/shared/utils/browserTelemetryBuckets';

import { createTestContext } from '../utilities';

// spec: BTAG

const HOUR_MS = 60 * 60 * 1000;
const MINUTE_MS = 60 * 1000;

// A histogram with the given counts at the given band indexes, zero elsewhere.
const histogram = countsByBand => {
  const bands = new Array(TELEMETRY_HISTOGRAM_BAND_COUNT).fill(0);
  for (const [band, count] of Object.entries(countsByBand)) bands[band] = count;
  return bands;
};

describe('RollupBrowserTelemetry', () => {
  let ctx;
  let models;
  let sequelize;
  let aggregationSettings;
  // A closed hourly bucket a few hours back, and the one after it.
  let bucketStart;
  let nextBucketStart;
  let spanSeq = 0;

  const runRollup = () =>
    new RollupBrowserTelemetry({
      ...ctx,
      globalSettings: {
        get: async path => {
          expect(path).toBe('telemetry.aggregation');
          return aggregationSettings;
        },
      },
    }).run();

  // A raw span received a few minutes into the given bucket.
  const createSpan = ({
    receivedAt = new Date(bucketStart.getTime() + 10 * MINUTE_MS),
    ...overrides
  } = {}) => {
    spanSeq += 1;
    return models.BrowserTelemetrySpan.create({
      traceId: `trace-${spanSeq}`,
      spanId: `span-${spanSeq}`,
      kind: 'request',
      route: 'patient/:patientId',
      parameters: { path: { patientId: 'patient-1' }, query: {} },
      method: 'GET',
      statusCode: 200,
      durationMs: 100,
      interface: 'clinical',
      deviceId: 'device-1',
      appVersion: '2.70.0',
      userId: 'user-1',
      facilityId: 'balwyn',
      occurredAt: receivedAt,
      createdAt: receivedAt,
      ...overrides,
    });
  };

  // LocalSystemFact.delete soft-deletes, which would collide with the next write
  // of the same key, so progress is cleared outright.
  const clearProgress = () =>
    models.LocalSystemFact.destroy({
      where: {
        key: [FACT_BROWSER_TELEMETRY_ROLLED_UP_TO, FACT_BROWSER_TELEMETRY_ROLLUP_BUCKET_MINUTES],
      },
      force: true,
    });

  const findTrends = where =>
    models.BrowserTelemetryTrend.findAll({ where, order: [['bucketStart', 'ASC']] });

  beforeAll(async () => {
    ctx = await createTestContext();
    models = ctx.models;
    sequelize = models.BrowserTelemetrySpan.sequelize;
  });

  afterAll(() => ctx.close());

  beforeEach(async () => {
    await models.BrowserTelemetrySpan.destroy({ where: {}, force: true });
    await models.BrowserTelemetryTrend.destroy({ where: {}, force: true });
    await models.BrowserTelemetrySlowEvent.destroy({ where: {}, force: true });
    await models.BrowserTelemetrySlowEventRequest.destroy({ where: {}, force: true });
    await clearProgress();
    aggregationSettings = { ...globalDefaults.telemetry.aggregation };
    bucketStart = floorToBucket(new Date(Date.now() - 5 * HOUR_MS), 60);
    nextBucketStart = new Date(bucketStart.getTime() + HOUR_MS);
  });

  describe('trend rows', () => {
    it('summarises requests by response class, keeping cut-off requests out of the durations', async () => {
      await createSpan({ durationMs: 100, statusCode: 200 });
      await createSpan({ durationMs: 250, statusCode: 404 });
      await createSpan({ durationMs: 600, statusCode: 503 });
      await createSpan({ durationMs: 50, statusCode: null });
      await createSpan({ durationMs: 900, statusCode: null, outcome: 'abandoned' });

      await runRollup();

      const [trend] = await findTrends({ kind: 'request' });
      expect(trend).toMatchObject({
        bucketMinutes: 60,
        interface: 'clinical',
        facilityId: 'balwyn',
        route: 'patient/:patientId',
        method: 'GET',
        appVersion: '2.70.0',
        eventCount: 5,
        successfulCount: 1,
        clientErrorCount: 1,
        serverErrorCount: 1,
        noResponseCount: 1,
        cutOffCount: 1,
        timedCount: 4,
        // Nearest-rank over 50, 100, 250, 600.
        p50DurationMs: 100,
        p95DurationMs: 600,
        p99DurationMs: 600,
        maxDurationMs: 600,
      });
      expect(new Date(trend.bucketStart)).toEqual(bucketStart);
      expect(Number(trend.totalDurationMs)).toBe(1000);
      // Bands are inclusive of their upper bound: 50 is in the first band.
      expect(trend.durationHistogram).toEqual(histogram({ 0: 1, 1: 1, 3: 1, 5: 1 }));
    });

    it('counts navigations by outcome, timing capped loads but not abandoned ones', async () => {
      const navigation = {
        kind: 'navigation',
        route: '/patients/:patientId',
        method: null,
        statusCode: null,
      };
      await createSpan({ ...navigation, durationMs: 1200, outcome: 'settled' });
      await createSpan({ ...navigation, durationMs: 30000, outcome: 'capped' });
      await createSpan({ ...navigation, durationMs: 400, outcome: 'abandoned' });

      await runRollup();

      const [trend] = await findTrends({ kind: 'navigation' });
      expect(trend).toMatchObject({
        method: null,
        eventCount: 3,
        settledCount: 1,
        cappedCount: 1,
        abandonedCount: 1,
        successfulCount: 0,
        timedCount: 2,
        maxDurationMs: 30000,
      });
      expect(Number(trend.totalDurationMs)).toBe(31200);
      expect(trend.durationHistogram).toEqual(histogram({ 7: 1, 15: 1 }));
    });

    it('keys rows by bucket, route, method and application version', async () => {
      await createSpan();
      await createSpan({ appVersion: '2.71.0' });
      await createSpan({ method: 'POST' });
      await createSpan({ route: 'encounter/:encounterId' });
      await createSpan({ receivedAt: new Date(nextBucketStart.getTime() + 5 * MINUTE_MS) });

      await runRollup();

      const trends = await findTrends({});
      expect(trends).toHaveLength(5);
      expect(trends.every(trend => trend.eventCount === 1)).toBe(true);
      expect(
        trends.filter(trend => new Date(trend.bucketStart).getTime() === nextBucketStart.getTime()),
      ).toHaveLength(1);
    });

    it('buckets by when the server received a span, not the time the browser reported', async () => {
      await createSpan({ occurredAt: new Date(bucketStart.getTime() - 3 * HOUR_MS) });

      await runRollup();

      const [trend] = await findTrends({});
      expect(new Date(trend.bucketStart)).toEqual(bucketStart);
    });

    it('leaves a bucket that has not closed for a later run', async () => {
      await createSpan();
      await createSpan({ receivedAt: new Date() });

      await runRollup();

      const trends = await findTrends({});
      expect(trends).toHaveLength(1);
      expect(new Date(trends[0].bucketStart)).toEqual(bucketStart);
    });
  });

  describe('progress', () => {
    it('does nothing, and records nothing, when there is no raw telemetry', async () => {
      await runRollup();

      expect(await models.LocalSystemFact.get(FACT_BROWSER_TELEMETRY_ROLLED_UP_TO)).toBeNull();
      expect(await models.BrowserTelemetryTrend.count()).toBe(0);
    });

    it('rolls up from the oldest raw span on its first run and records how far it got', async () => {
      const oldestBucketStart = new Date(bucketStart.getTime() - 2 * HOUR_MS);
      await createSpan({ receivedAt: new Date(oldestBucketStart.getTime() + 10 * MINUTE_MS) });

      await runRollup();

      expect(await models.BrowserTelemetryTrend.count()).toBe(1);
      expect(await models.LocalSystemFact.get(FACT_BROWSER_TELEMETRY_ROLLED_UP_TO)).toBe(
        new Date(oldestBucketStart.getTime() + HOUR_MS).toISOString(),
      );
      expect(await models.LocalSystemFact.get(FACT_BROWSER_TELEMETRY_ROLLUP_BUCKET_MINUTES)).toBe(
        '60',
      );
    });

    it('counts each span once across runs', async () => {
      await createSpan();
      await runRollup();
      // Received into a bucket already rolled up, so never counted again.
      await createSpan();
      await runRollup();

      const trends = await findTrends({});
      expect(trends).toHaveLength(1);
      expect(trends[0].eventCount).toBe(1);
    });

    it('skips straight past a stretch with no spans', async () => {
      const longAgo = floorToBucket(new Date(Date.now() - 20 * 24 * HOUR_MS), 60);
      await createSpan({ receivedAt: new Date(longAgo.getTime() + 10 * MINUTE_MS) });
      await createSpan();
      const transactions = vi.spyOn(sequelize, 'transaction');

      await runRollup();
      const transactionCount = transactions.mock.calls.length;
      transactions.mockRestore();

      // One transaction per bucket holding spans, not one per empty hour between.
      expect(transactionCount).toBe(2);
      const trends = await findTrends({});
      expect(trends.map(trend => new Date(trend.bucketStart))).toEqual([longAgo, bucketStart]);
    });

    it('rolls up again from the past day when its progress is ahead of the clock', async () => {
      // As after the server's clock ran fast and was corrected.
      await models.LocalSystemFact.set(
        FACT_BROWSER_TELEMETRY_ROLLED_UP_TO,
        new Date(Date.now() + 24 * HOUR_MS).toISOString(),
      );
      await models.LocalSystemFact.set(FACT_BROWSER_TELEMETRY_ROLLUP_BUCKET_MINUTES, '60');
      await createSpan();

      await runRollup();

      const [trend] = await findTrends({});
      expect(new Date(trend.bucketStart)).toEqual(bucketStart);
      const rolledUpTo = new Date(
        await models.LocalSystemFact.get(FACT_BROWSER_TELEMETRY_ROLLED_UP_TO),
      );
      expect(rolledUpTo.getTime()).toBeLessThan(Date.now());
    });

    it('updates rather than duplicates its aggregates when a bucket is rolled up again', async () => {
      await createSpan({ durationMs: 9000 });
      await runRollup();
      const [firstTrend] = await findTrends({});
      const [firstSlowEvent] = await models.BrowserTelemetrySlowEvent.findAll();

      // As after a restore from backup: the progress is lost but the raw spans remain.
      await clearProgress();
      await runRollup();

      const trends = await findTrends({});
      expect(trends).toHaveLength(1);
      expect(trends[0].id).toBe(firstTrend.id);
      expect(trends[0].eventCount).toBe(1);
      const slowEvents = await models.BrowserTelemetrySlowEvent.findAll();
      expect(slowEvents.map(event => event.id)).toEqual([firstSlowEvent.id]);
    });

    it('rolls up with a new bucket size from its first boundary', async () => {
      await createSpan();
      await runRollup();

      // Roll the second hour again, now with 15-minute buckets.
      await models.LocalSystemFact.set(
        FACT_BROWSER_TELEMETRY_ROLLED_UP_TO,
        nextBucketStart.toISOString(),
      );
      await models.BrowserTelemetryTrend.destroy({ where: {}, force: true });
      await createSpan({ receivedAt: new Date(nextBucketStart.getTime() + 20 * MINUTE_MS) });
      aggregationSettings.bucketMinutes = 15;

      await runRollup();

      const [trend] = await findTrends({});
      expect(trend.bucketMinutes).toBe(15);
      expect(new Date(trend.bucketStart)).toEqual(
        new Date(nextBucketStart.getTime() + 15 * MINUTE_MS),
      );
      expect(await models.LocalSystemFact.get(FACT_BROWSER_TELEMETRY_ROLLUP_BUCKET_MINUTES)).toBe(
        '15',
      );
    });

    it('finishes buckets of the previous size until the first boundary of a larger one', async () => {
      // An hour boundary that is not a two-hour boundary, at least five hours back.
      const oddHour = new Date(
        floorToBucket(new Date(Date.now() - 7 * HOUR_MS), 120).getTime() + HOUR_MS,
      );
      await models.LocalSystemFact.set(FACT_BROWSER_TELEMETRY_ROLLED_UP_TO, oddHour.toISOString());
      await models.LocalSystemFact.set(FACT_BROWSER_TELEMETRY_ROLLUP_BUCKET_MINUTES, '60');
      await createSpan({ receivedAt: new Date(oddHour.getTime() + 10 * MINUTE_MS) });
      await createSpan({ receivedAt: new Date(oddHour.getTime() + 70 * MINUTE_MS) });
      aggregationSettings.bucketMinutes = 120;

      await runRollup();

      const trends = await findTrends({});
      expect(
        trends.map(trend => [new Date(trend.bucketStart).getTime(), trend.bucketMinutes]),
      ).toEqual([
        [oddHour.getTime(), 60],
        [oddHour.getTime() + HOUR_MS, 120],
      ]);
    });
  });

  describe('slow events', () => {
    beforeEach(() => {
      aggregationSettings = {
        ...aggregationSettings,
        slowEventCapPerRow: 3,
        requestSlowThresholdMs: 1000,
        navigationSlowThresholdMs: 5000,
      };
    });

    const slowEventDurations = async route => {
      const events = await models.BrowserTelemetrySlowEvent.findAll({
        where: { route },
        order: [['durationMs', 'DESC']],
      });
      return events.map(event => event.durationMs);
    };

    it('keeps the events over the threshold, slowest first up to the cap', async () => {
      for (const durationMs of [100, 1000, 1500, 2500, 3500, 4500]) {
        await createSpan({ route: 'slow/:id', durationMs });
      }
      for (const durationMs of [1001, 1200]) {
        await createSpan({ route: 'some-slow/:id', durationMs });
      }

      await runRollup();

      expect(await slowEventDurations('slow/:id')).toEqual([4500, 3500, 2500]);
      expect(await slowEventDurations('some-slow/:id')).toEqual([1200, 1001]);
    });

    it('keeps nothing for a route whose events are all within the threshold', async () => {
      for (const durationMs of [10, 20, 1000]) {
        await createSpan({ route: 'fast/:id', durationMs });
      }

      await runRollup();

      expect(await slowEventDurations('fast/:id')).toEqual([]);
      expect(await findTrends({ route: 'fast/:id' })).toHaveLength(1);
    });

    it('never keeps abandoned navigations or cut-off requests', async () => {
      await createSpan({
        route: 'slow/:id',
        durationMs: 99999,
        outcome: 'capped',
        statusCode: null,
      });
      await createSpan({
        kind: 'navigation',
        route: '/slow',
        method: null,
        statusCode: null,
        durationMs: 99999,
        outcome: 'abandoned',
      });

      await runRollup();

      expect(await models.BrowserTelemetrySlowEvent.count()).toBe(0);
    });

    it('keeps path values and query names, never query values', async () => {
      const span = await createSpan({
        durationMs: 3000,
        navigationRoute: '/patients/:patientId',
        parameters: {
          path: { patientId: 'patient-9' },
          query: { search: 'Jane Citizen', page: 2 },
        },
      });

      await runRollup();

      const [event] = await models.BrowserTelemetrySlowEvent.findAll();
      const trend = await models.BrowserTelemetryTrend.findOne();
      expect(event).toMatchObject({
        trendId: trend.id,
        kind: 'request',
        route: 'patient/:patientId',
        navigationRoute: '/patients/:patientId',
        method: 'GET',
        statusCode: 200,
        durationMs: 3000,
        interface: 'clinical',
        facilityId: 'balwyn',
        appVersion: '2.70.0',
        deviceId: 'device-1',
        userId: 'user-1',
        pathParameters: { patientId: 'patient-9' },
        queryParameterNames: ['page', 'search'],
      });
      expect(new Date(event.receivedAt)).toEqual(new Date(span.createdAt));
      expect(JSON.stringify(event.toJSON())).not.toContain('Jane');
    });

    it('keeps every request made while a slow navigation was loading', async () => {
      const startedAt = new Date(bucketStart.getTime() + 10 * MINUTE_MS);
      await createSpan({
        traceId: 'trace-slow-page',
        spanId: 'nav-slow',
        kind: 'navigation',
        route: '/patients/:patientId',
        method: null,
        statusCode: null,
        durationMs: 8000,
        outcome: 'settled',
        occurredAt: startedAt,
      });
      await createSpan({
        traceId: 'trace-slow-page',
        parentId: 'nav-slow',
        spanId: 'req-slow',
        route: 'patient/:patientId/encounters',
        durationMs: 7000,
        parameters: { path: { patientId: 'patient-1' }, query: { q: 'secret' } },
        occurredAt: new Date(startedAt.getTime() + 100),
      });
      await createSpan({
        traceId: 'trace-slow-page',
        parentId: 'nav-slow',
        spanId: 'req-cut-off',
        route: 'patient/:patientId/allergies',
        durationMs: 7900,
        statusCode: null,
        outcome: 'capped',
        occurredAt: new Date(startedAt.getTime() + 300),
      });

      await runRollup();

      const navigation = await models.BrowserTelemetrySlowEvent.findOne({
        where: { kind: 'navigation' },
      });
      const requests = await models.BrowserTelemetrySlowEventRequest.findAll({
        where: { slowEventId: navigation.id },
        order: [['startOffsetMs', 'ASC']],
      });
      expect(requests.map(request => request.get({ plain: true }))).toMatchObject([
        {
          spanId: 'req-slow',
          route: 'patient/:patientId/encounters',
          statusCode: 200,
          outcome: null,
          durationMs: 7000,
          startOffsetMs: 100,
          pathParameters: { patientId: 'patient-1' },
          queryParameterNames: ['q'],
        },
        {
          spanId: 'req-cut-off',
          statusCode: null,
          outcome: 'capped',
          durationMs: 7900,
          startOffsetMs: 300,
        },
      ]);
    });

    it('rolls up a slow navigation whose request is dated weeks away', async () => {
      const startedAt = new Date(bucketStart.getTime() + 10 * MINUTE_MS);
      await createSpan({
        traceId: 'trace-bad-clock',
        spanId: 'nav-bad-clock',
        kind: 'navigation',
        route: '/patients',
        method: null,
        statusCode: null,
        durationMs: 9000,
        outcome: 'settled',
        occurredAt: startedAt,
      });
      await createSpan({
        traceId: 'trace-bad-clock',
        parentId: 'nav-bad-clock',
        spanId: 'req-bad-clock',
        occurredAt: new Date(startedAt.getTime() + 40 * 24 * HOUR_MS),
      });

      await runRollup();

      const [request] = await models.BrowserTelemetrySlowEventRequest.findAll();
      expect(request.startOffsetMs).toBe(2147483647);
      expect(await models.LocalSystemFact.get(FACT_BROWSER_TELEMETRY_ROLLED_UP_TO)).not.toBeNull();
    });
  });
});
