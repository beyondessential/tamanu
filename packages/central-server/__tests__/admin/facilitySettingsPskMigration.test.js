import {
  FACT_CENTRAL_HOST,
  FACT_DEVICE_ID,
  FACT_SYNC_EMAIL,
  FACT_SYNC_PASSWORD,
  FACT_SETTINGS_PSK,
} from '@tamanu/constants';

import { createTestContext } from '../utilities';
// The real migration step that runs on a facility upgrade.
import { STEPS as FACILITY_PSK_STEPS } from '../../../upgrade/src/steps/1785200000000-provisionFacilitySettingsPsk';

// End-to-end for provisionFacilitySettingsPsk: the step's own code (login ->
// GET /admin/settingsPsk -> store) runs against a LIVE central — real DB, real
// login route, real permission check, real PSK. Only the facility's local k/v
// store is faked (it's a trivial LocalSystemFact/Secret shim). The step calls
// global.fetch with absolute URLs; we route those through supertest so the whole
// server side is exercised without binding a port. This is the half the mocked
// upgrade unit test can't cover.
const [facilityPskStep] = FACILITY_PSK_STEPS;

describe('provisionFacilitySettingsPsk against a live central', () => {
  let ctx;
  let realFetch;

  beforeAll(async () => {
    ctx = await createTestContext();
  });
  afterAll(async () => ctx.close());
  beforeEach(() => {
    realFetch = global.fetch;
  });
  afterEach(() => {
    global.fetch = realFetch;
  });

  // Route the step's absolute-URL fetch calls through the real express app.
  const routeFetchThroughApp = () => {
    global.fetch = async (url, opts = {}) => {
      const { pathname } = new URL(url);
      const method = (opts.method || 'GET').toUpperCase();
      let res;
      if (method === 'POST') {
        res = await ctx.baseApp.post(pathname).send(opts.body ? JSON.parse(opts.body) : undefined);
      } else {
        const req = ctx.baseApp.get(pathname);
        if (opts.headers) req.set(opts.headers);
        res = await req;
      }
      return {
        ok: res.status >= 200 && res.status < 300,
        status: res.status,
        json: async () => res.body,
      };
    };
  };

  const makeFacility = ({ centralHost, email, password, deviceId }) => {
    const facts = new Map([
      [FACT_CENTRAL_HOST, centralHost],
      [FACT_SYNC_EMAIL, email],
      [FACT_DEVICE_ID, deviceId],
    ]);
    const secrets = new Map([[FACT_SYNC_PASSWORD, password]]);
    return {
      secrets,
      args: {
        serverType: 'facility',
        models: {
          LocalSystemFact: { get: async k => facts.get(k) ?? null },
          LocalSystemSecret: {
            get: async k => secrets.get(k) ?? null,
            setIfAbsent: async (k, v) => {
              if (!secrets.has(k)) secrets.set(k, v);
            },
          },
        },
        log: { info: () => {}, warn: () => {} },
      },
    };
  };

  it('pulls the deployment PSK from central using its sync credentials', async () => {
    const deviceId = 'facility-migration-device';

    // central provisions the facility's sync credentials (+ mints the PSK)
    const admin = await ctx.baseApp.asRole('admin');
    const provision = await admin
      .post('/api/admin/syncCredentials')
      .send({ deviceId, facilityIds: ['facility-migration'] });
    expect(provision).toHaveSucceeded();
    const { email, password, settingsPsk } = provision.body;

    // facility, configured but with no PSK yet, runs the real migration step
    routeFetchThroughApp();
    const facility = makeFacility({
      centralHost: 'https://central.test/',
      email,
      password,
      deviceId,
    });

    expect(await facilityPskStep.check(facility.args)).toBe(true);
    await facilityPskStep.run(facility.args);

    // it fetched and stored central's PSK, byte-for-byte
    expect(facility.secrets.get(FACT_SETTINGS_PSK)).toBe(settingsPsk);
  });

  it('is a no-op when the facility already has a PSK (no login attempted)', async () => {
    const facility = makeFacility({
      centralHost: 'https://central.test/',
      email: 'sync@already.has',
      password: 'pw',
      deviceId: 'device-has-psk',
    });
    facility.secrets.set(FACT_SETTINGS_PSK, 'ab'.repeat(32));

    let called = false;
    global.fetch = async () => {
      called = true;
      throw new Error('should not be called');
    };
    await facilityPskStep.run(facility.args);
    expect(called).toBe(false);
    expect(facility.secrets.get(FACT_SETTINGS_PSK)).toBe('ab'.repeat(32));
  });
});
