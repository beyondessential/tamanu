import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { TELEMETRY_MAX_BATCH_SIZE } from '@tamanu/constants';

import { createTestContext } from '../utilities';

// spec: BTEL
// The patient portal talks to central, so its telemetry lands on the portal's
// own public mount. Mounted ahead of the portal auth middleware so navigations
// before sign-in are captured; rows carry no facility.
const ENDPOINT = '/api/portal/public/telemetry';

function makeSpan(overrides = {}) {
  return {
    traceId: 'trace-portal-1',
    spanId: 'span-nav-1',
    parentId: null,
    kind: 'navigation',
    route: '/surveys/:param1',
    parameters: { path: { param1: 'abc12345678901234' }, query: {} },
    method: null,
    statusCode: null,
    durationMs: 512,
    outcome: 'settled',
    interface: 'patient-portal',
    deviceId: 'portal-test',
    sessionId: 'session-1',
    appVersion: '0.0.0',
    userId: null,
    occurredAt: new Date().toISOString(),
    ...overrides,
  };
}

describe('Patient portal telemetry ingest', () => {
  let ctx;
  let baseApp;
  let models;

  beforeAll(async () => {
    ctx = await createTestContext();
    baseApp = ctx.baseApp;
    models = ctx.store.models;
    // The whole portal router is 501 unless the feature is on.
    await models.Setting.set('features.patientPortal', true);
  });

  beforeEach(async () => {
    await models.BrowserTelemetrySpan.destroy({ where: {}, force: true });
  });

  afterAll(async () => ctx.close());

  it('accepts an unauthenticated batch and stores the spans without a facility', async () => {
    const response = await baseApp.post(ENDPOINT).send({ spans: [makeSpan()] });
    expect(response).toHaveSucceeded();

    const [row] = await models.BrowserTelemetrySpan.findAll();
    expect(row.interface).toBe('patient-portal');
    expect(row.route).toBe('/surveys/:param1');
    expect(row.facilityId).toBe(null);
  });

  it('rejects a malformed batch and stores nothing', async () => {
    const response = await baseApp
      .post(ENDPOINT)
      .send({ spans: [{ ...makeSpan(), occurredAt: 'not-a-date' }] });
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
