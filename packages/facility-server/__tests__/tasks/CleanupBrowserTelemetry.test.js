import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { createTestContext } from '../utilities';
import { CleanupBrowserTelemetry } from '@tamanu/shared/tasks/CleanupBrowserTelemetry';

// spec: BTEL
// Retention: raw telemetry is only needed until it has been aggregated, so the
// table must not grow without bound.

describe('CleanupBrowserTelemetry', () => {
  let ctx;
  let models;

  // Rows are aged by `createdAt` (server-stamped), not the browser-reported
  // `occurredAt`, so the fixtures set it explicitly.
  const createSpan = (spanId, createdAt, occurredAt = new Date()) =>
    models.BrowserTelemetrySpan.create({
      traceId: `trace-${spanId}`,
      spanId,
      kind: 'navigation',
      route: '/dashboard',
      parameters: {},
      durationMs: 100,
      outcome: 'settled',
      interface: 'clinical',
      deviceId: 'web-test',
      appVersion: '0.0.0',
      occurredAt,
      createdAt,
    });

  beforeAll(async () => {
    ctx = await createTestContext();
    models = ctx.models;
  });

  afterAll(() => ctx.close());

  beforeEach(async () => {
    await models.BrowserTelemetrySpan.destroy({ where: {}, force: true });
  });

  it('removes spans older than the retention period and keeps recent ones', async () => {
    const longAgo = new Date(Date.now() - 40 * 24 * 60 * 60 * 1000); // 40 days (> 30d default)
    const recent = new Date(Date.now() - 1 * 24 * 60 * 60 * 1000); // yesterday
    await createSpan('old-1', longAgo);
    await createSpan('old-2', longAgo);
    await createSpan('recent-1', recent);

    await new CleanupBrowserTelemetry(ctx).run();

    const remaining = await models.BrowserTelemetrySpan.findAll({ paranoid: false });
    expect(remaining.map(r => r.spanId)).toEqual(['recent-1']);
  });

  it('ages rows by when the server received them, not the time the client reported', async () => {
    const longAgo = new Date(Date.now() - 40 * 24 * 60 * 60 * 1000);
    // A client claiming its span happened far in the future must not be able to
    // keep the row alive past the retention horizon.
    const farFuture = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
    await createSpan('old-but-future-dated', longAgo, farFuture);

    await new CleanupBrowserTelemetry(ctx).run();

    expect(await models.BrowserTelemetrySpan.count({ paranoid: false })).toBe(0);
  });

  it('takes its schedule and retention from settings', () => {
    const task = new CleanupBrowserTelemetry(ctx);
    expect(task.getName()).toBe('CleanupBrowserTelemetry');
    expect(ctx.schedules.cleanupBrowserTelemetry).toBeTruthy();
    expect(task.retentionDays).toBe(30);
  });
});
