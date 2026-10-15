import { describe, expect, it, beforeAll, beforeEach, afterAll } from 'vitest';

import { TELEMETRY_MAX_BATCH_SIZE } from '@tamanu/constants';

import { createTestContext } from './utilities';

// spec: BTEL
function makeSpan(overrides = {}) {
  return {
    traceId: 'trace-1',
    spanId: 'span-nav-1',
    parentId: null,
    kind: 'navigation',
    route: '/patients/:param1',
    parameters: { path: { param1: 'abc-123' }, query: {} },
    method: null,
    statusCode: null,
    durationMs: 842,
    outcome: 'settled',
    interface: 'clinical',
    deviceId: 'web-test',
    sessionId: 'session-1',
    appVersion: '0.0.0',
    userId: null,
    occurredAt: new Date().toISOString(),
    ...overrides,
  };
}

describe('Browser telemetry ingest', () => {
  let ctx;
  let baseApp;
  let models;

  beforeAll(async () => {
    ctx = await createTestContext();
    baseApp = ctx.baseApp;
    models = ctx.models;
  });

  beforeEach(async () => {
    await models.BrowserTelemetrySpan.destroy({ where: {}, force: true });
  });

  afterAll(() => ctx.close());

  it('accepts an unauthenticated batch and stores the spans', async () => {
    const response = await baseApp.post('/api/public/telemetry').send({
      spans: [
        makeSpan(),
        makeSpan({
          spanId: 'span-req-1',
          parentId: 'span-nav-1',
          kind: 'request',
          route: '/patient/:param1',
          method: 'GET',
          statusCode: 200,
          durationMs: 120,
          outcome: null,
        }),
      ],
    });
    expect(response).toHaveSucceeded();

    const rows = await models.BrowserTelemetrySpan.findAll({ order: [['span_id', 'ASC']] });
    expect(rows).toHaveLength(2);
    const nav = rows.find(r => r.kind === 'navigation');
    expect(nav.route).toBe('/patients/:param1');
    expect(nav.parameters).toEqual({ path: { param1: 'abc-123' }, query: {} });
    // facility is stamped server-side, never from the client payload
    expect(nav.facilityId !== undefined).toBe(true);
    const request = rows.find(r => r.kind === 'request');
    expect(request.parentId).toBe('span-nav-1');
    expect(request.statusCode).toBe(200);
  });

  it('records the user when the batch carries one', async () => {
    await baseApp
      .post('/api/public/telemetry')
      .send({ spans: [makeSpan({ userId: 'user-42' })] });

    const [row] = await models.BrowserTelemetrySpan.findAll();
    expect(row.userId).toBe('user-42');
  });

  it('rejects a malformed batch', async () => {
    const response = await baseApp
      .post('/api/public/telemetry')
      .send({ spans: [{ kind: 'navigation' }] });
    expect(response).toHaveRequestError();

    const count = await models.BrowserTelemetrySpan.count();
    expect(count).toBe(0);
  });

  it('rejects an oversized batch', async () => {
    const spans = Array.from({ length: TELEMETRY_MAX_BATCH_SIZE + 1 }, (_, i) =>
      makeSpan({ spanId: `span-${i}` }),
    );
    const response = await baseApp.post('/api/public/telemetry').send({ spans });
    expect(response).toHaveRequestError();

    const count = await models.BrowserTelemetrySpan.count();
    expect(count).toBe(0);
  });
});
