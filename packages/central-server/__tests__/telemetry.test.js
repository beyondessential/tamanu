import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { TELEMETRY_MAX_BATCH_SIZE } from '@tamanu/constants';

import { createTestContext } from './utilities';

// spec: BTEL
// Central ingests browser telemetry from the web clients that talk to it — the
// admin panel on /v1/public/telemetry. Rows carry no facility, since central has
// no single one.
const ENDPOINT = '/v1/public/telemetry';

function makeSpan(overrides = {}) {
  return {
    traceId: 'trace-central-1',
    spanId: 'span-nav-1',
    parentId: null,
    kind: 'navigation',
    route: '/admin/:param1',
    parameters: { path: { param1: 'users' }, query: {} },
    method: null,
    statusCode: null,
    durationMs: 640,
    outcome: 'settled',
    deviceId: 'admin-test',
    sessionId: 'session-1',
    appVersion: '0.0.0',
    userId: null,
    occurredAt: new Date().toISOString(),
    ...overrides,
  };
}

describe('Browser telemetry ingest (central)', () => {
  let ctx;
  let baseApp;
  let models;

  beforeAll(async () => {
    ctx = await createTestContext();
    baseApp = ctx.baseApp;
    models = ctx.store.models;
  });

  beforeEach(async () => {
    await models.BrowserTelemetrySpan.destroy({ where: {}, force: true });
  });

  afterAll(async () => ctx.close());

  it('accepts an unauthenticated batch and stores the spans without a facility', async () => {
    const response = await baseApp.post(ENDPOINT).send({
      spans: [
        makeSpan(),
        makeSpan({
          spanId: 'span-req-1',
          parentId: 'span-nav-1',
          kind: 'request',
          route: '/user/:param1',
          method: 'GET',
          statusCode: 200,
          durationMs: 90,
          outcome: null,
        }),
      ],
    });
    expect(response).toHaveSucceeded();

    const rows = await models.BrowserTelemetrySpan.findAll({ order: [['spanId', 'ASC']] });
    expect(rows).toHaveLength(2);

    const [navigation, request] = rows;
    expect(navigation.kind).toBe('navigation');
    expect(navigation.route).toBe('/admin/:param1');
    expect(navigation.outcome).toBe('settled');
    expect(navigation.parentId).toBe(null);
    // central has no single facility, so rows are stored without one
    expect(navigation.facilityId).toBe(null);
    // the interface is stamped by the endpoint (central public mount = admin)
    expect(navigation.interface).toBe('admin');

    expect(request.kind).toBe('request');
    expect(request.parentId).toBe('span-nav-1');
    expect(request.statusCode).toBe(200);
  });

  it('records the user when the batch carries one', async () => {
    const response = await baseApp
      .post(ENDPOINT)
      .send({ spans: [makeSpan({ userId: 'user-42' })] });
    expect(response).toHaveSucceeded();

    const [row] = await models.BrowserTelemetrySpan.findAll();
    expect(row.userId).toBe('user-42');
  });

  it('rejects a malformed batch and stores nothing', async () => {
    const response = await baseApp
      .post(ENDPOINT)
      .send({ spans: [{ ...makeSpan(), traceId: '' }] });
    expect(response).toHaveRequestError();

    expect(await models.BrowserTelemetrySpan.count()).toBe(0);
  });

  it('rejects an oversized batch', async () => {
    const spans = Array.from({ length: TELEMETRY_MAX_BATCH_SIZE + 1 }, (_unused, index) =>
      makeSpan({ spanId: `span-${index}` }),
    );
    const response = await baseApp.post(ENDPOINT).send({ spans });
    expect(response).toHaveRequestError();

    expect(await models.BrowserTelemetrySpan.count()).toBe(0);
  });
});
