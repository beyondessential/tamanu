import { FACT_SETTINGS_PSK } from '@tamanu/constants';

import { createTestContext } from '../utilities';
// The real facility-side code that runs off the back of every sync session.
import { pullSettingsPsk } from '../../../facility-server/app/sync/pullSettingsPsk';

// End-to-end for pullSettingsPsk: the facility's own code runs against a LIVE
// central — real DB, real login route, real permission check, real PSK. Only the
// facility's local k/v store and its central connection are shimmed, the latter
// doing what CentralServerConnection does (log in on demand with the stored sync
// credentials, then call the endpoint with that token). This is the half the
// mocked unit test can't cover.
describe('pullSettingsPsk against a live central', () => {
  let ctx;

  beforeAll(async () => {
    ctx = await createTestContext();
  });
  afterAll(async () => ctx.close());

  const makeCentralServer = ({ email, password, deviceId }) => {
    let tokenPromise = null;
    const connect = () => {
      tokenPromise ??= (async () => {
        const login = await ctx.baseApp.post('/api/login').send({ email, password, deviceId });
        expect(login).toHaveSucceeded();
        return login.body.token;
      })();
      return tokenPromise;
    };
    return {
      fetch: async endpoint => {
        const token = await connect();
        const res = await ctx.baseApp
          .get(`/api/${endpoint}`)
          .set({ Authorization: `Bearer ${token}` });
        if (!res.status.toString().startsWith('2')) {
          throw new Error(`${endpoint} responded ${res.status}`);
        }
        return res.body;
      },
    };
  };

  const makeFacility = (secrets = {}) => {
    const secretStore = new Map(Object.entries(secrets));
    return {
      secretStore,
      models: {
        LocalSystemSecret: {
          get: async key => secretStore.get(key) ?? null,
          setIfAbsent: async (key, value) => {
            if (!secretStore.has(key)) secretStore.set(key, value);
          },
        },
      },
    };
  };

  it('pulls the deployment PSK from central using its sync credentials', async () => {
    const deviceId = 'facility-psk-pull-device';

    // central provisions the facility's sync credentials (+ mints the PSK)
    const admin = await ctx.baseApp.asRole('admin');
    const provision = await admin
      .post('/api/admin/syncCredentials')
      .send({ deviceId, facilityIds: ['facility-psk-pull'] });
    expect(provision).toHaveSucceeded();
    const { email, password, settingsPsk } = provision.body;

    const { secretStore, models } = makeFacility();
    await pullSettingsPsk({
      models,
      centralServer: makeCentralServer({ email, password, deviceId }),
    });

    // it fetched and stored central's PSK, byte-for-byte
    expect(secretStore.get(FACT_SETTINGS_PSK)).toBe(settingsPsk);
  });

  it('is a no-op when the facility already has a PSK (no login attempted)', async () => {
    const existing = 'ab'.repeat(32);
    const { secretStore, models } = makeFacility({ [FACT_SETTINGS_PSK]: existing });
    const centralServer = {
      fetch: async () => {
        throw new Error('should not be called');
      },
    };

    await pullSettingsPsk({ models, centralServer });

    expect(secretStore.get(FACT_SETTINGS_PSK)).toBe(existing);
  });
});
