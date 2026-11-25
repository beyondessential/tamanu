import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import {
  FACT_BROWSER_TELEMETRY_ROLLED_UP_TO,
  FACT_BROWSER_TELEMETRY_ROLLUP_BUCKET_MINUTES,
} from '@tamanu/constants';
import { CleanupBrowserTelemetry } from '@tamanu/shared/tasks/CleanupBrowserTelemetry';
import { RollupBrowserTelemetry } from '@tamanu/shared/tasks/RollupBrowserTelemetry';

import { createTestContext } from '../utilities';

// spec: BTEL, BTAG
// Central keeps its models on the store rather than the context, so the browser
// telemetry tasks shared with facility servers are run here against central's own
// task context.

const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;

describe('Browser telemetry tasks on central', () => {
  let ctx;
  let models;
  let spanSeq = 0;

  const createAdminSpan = receivedAt => {
    spanSeq += 1;
    return models.BrowserTelemetrySpan.create({
      traceId: `central-trace-${spanSeq}`,
      spanId: `central-span-${spanSeq}`,
      kind: 'request',
      route: 'admin/users',
      parameters: { path: {}, query: {} },
      method: 'GET',
      statusCode: 200,
      durationMs: 120,
      interface: 'admin',
      deviceId: 'device-1',
      appVersion: '2.70.0',
      userId: 'user-1',
      facilityId: null,
      occurredAt: receivedAt,
      createdAt: receivedAt,
    });
  };

  beforeAll(async () => {
    ctx = await createTestContext();
    models = ctx.store.models;
  });

  afterAll(() => ctx.close());

  beforeEach(async () => {
    await models.BrowserTelemetrySpan.destroy({ where: {}, force: true });
    await models.BrowserTelemetryTrend.destroy({ where: {}, force: true });
    await models.LocalSystemFact.destroy({
      where: {
        key: [FACT_BROWSER_TELEMETRY_ROLLED_UP_TO, FACT_BROWSER_TELEMETRY_ROLLUP_BUCKET_MINUTES],
      },
      force: true,
    });
  });

  it('rolls up admin panel telemetry into trend rows with no facility', async () => {
    await createAdminSpan(new Date(Date.now() - 3 * HOUR_MS));

    await new RollupBrowserTelemetry(ctx).run();

    const trends = await models.BrowserTelemetryTrend.findAll({ raw: true });
    expect(trends).toHaveLength(1);
    expect(trends[0]).toMatchObject({
      interface: 'admin',
      facilityId: null,
      route: 'admin/users',
      eventCount: 1,
    });
  });

  it('prunes raw telemetry past the retention period', async () => {
    const oldSpan = await createAdminSpan(new Date(Date.now() - 40 * DAY_MS));
    const recentSpan = await createAdminSpan(new Date(Date.now() - HOUR_MS));

    await new CleanupBrowserTelemetry(ctx).run();

    expect(await models.BrowserTelemetrySpan.findByPk(oldSpan.id)).toBeNull();
    expect(await models.BrowserTelemetrySpan.findByPk(recentSpan.id)).not.toBeNull();
  });
});
