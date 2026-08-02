import { fake } from '@tamanu/fake-data/fake';
import {
  FACT_DEVICE_ID,
  FACT_FACILITY_IDS,
  FACT_SETTINGS_PSK,
  FACT_SYNC_EMAIL,
  FACT_SYNC_PASSWORD,
  USER_KINDS,
} from '@tamanu/constants';

import { createTestContext } from '../utilities';
// The real facility-side code that runs off the back of a sync session.
import { convergeSyncUser } from '../../../facility-server/app/sync/convergeSyncUser';
import { pullSettingsPsk } from '../../../facility-server/app/sync/pullSettingsPsk';

// End-to-end for the transition the settings-PSK gate depends on: a facility still
// authenticating as the human admin its config credentials named, swapping itself for a
// dedicated sync user, then reading the PSK as that new user. Each link is covered
// elsewhere; what this covers is the composition, against a LIVE central. Only the
// facility's local k/v store and its connection are shimmed, the latter doing what
// CentralServerConnection does: log in with whatever credentials are currently stored,
// and re-log-in once the token is dropped.
describe('facility sync-user convergence against a live central', () => {
  let ctx;
  let models;

  beforeAll(async () => {
    ctx = await createTestContext();
    ({ models } = ctx.store);
  });
  afterAll(async () => ctx.close());

  const LEGACY_PASSWORD = 'legacy-password';

  const makeFacility = ({ legacyEmail, deviceId }) => {
    const facts = new Map([
      [FACT_DEVICE_ID, deviceId],
      [FACT_FACILITY_IDS, JSON.stringify(['facility-converge'])],
      [FACT_SYNC_EMAIL, legacyEmail],
    ]);
    const secrets = new Map([[FACT_SYNC_PASSWORD, LEGACY_PASSWORD]]);
    return {
      facts,
      secrets,
      models: {
        LocalSystemFact: {
          get: async key => facts.get(key) ?? null,
          set: async (key, value) => void facts.set(key, value),
        },
        LocalSystemSecret: {
          get: async key => secrets.get(key) ?? null,
          set: async (key, value) => void secrets.set(key, value),
          setIfAbsent: async (key, value) => {
            if (!secrets.has(key)) secrets.set(key, value);
          },
        },
      },
    };
  };

  // Reads credentials out of the facility store on each login, the way getSyncConfig
  // does, so dropping the token picks up whatever the swap just wrote.
  const makeCentralServer = (facility, { deviceId, kind, email }) => {
    let tokenPromise = null;
    const connect = () => {
      tokenPromise ??= (async () => {
        const login = await ctx.baseApp.post('/api/login').send({
          email: await facility.models.LocalSystemFact.get(FACT_SYNC_EMAIL),
          password: await facility.models.LocalSystemSecret.get(FACT_SYNC_PASSWORD),
          deviceId,
        });
        expect(login).toHaveSucceeded();
        return login.body;
      })();
      return tokenPromise;
    };
    const server = {
      user: { kind, email },
      setToken: () => {
        tokenPromise = null;
      },
      fetch: async (endpoint, options = {}) => {
        const { token } = await connect();
        const auth = { Authorization: `Bearer ${token}` };
        const res =
          options.method === 'POST'
            ? await ctx.baseApp.post(`/api/${endpoint}`).set(auth).send(options.body)
            : await ctx.baseApp.get(`/api/${endpoint}`).set(auth);
        if (!res.status.toString().startsWith('2')) {
          throw new Error(`${endpoint} responded ${res.status}`);
        }
        return res.body;
      },
    };
    return server;
  };

  it('swaps a legacy admin for a dedicated sync user, then reads the PSK as that user', async () => {
    const deviceId = 'facility-converge-device';
    const legacy = await models.User.create(
      fake(models.User, { password: LEGACY_PASSWORD, role: 'admin' }),
    );
    expect(legacy.kind).toBe(USER_KINDS.USER);

    const facility = makeFacility({ legacyEmail: legacy.email, deviceId });
    const centralServer = makeCentralServer(facility, {
      deviceId,
      kind: USER_KINDS.USER,
      email: legacy.email,
    });

    await convergeSyncUser({
      sequelize: { transaction: async callback => callback() },
      models: facility.models,
      centralServer,
    });

    // facts now name a dedicated account, and central agrees it is one
    const swappedEmail = facility.facts.get(FACT_SYNC_EMAIL);
    expect(swappedEmail).not.toBe(legacy.email);
    expect(facility.secrets.get(FACT_SYNC_PASSWORD)).not.toBe(LEGACY_PASSWORD);
    const dedicated = await models.User.findOne({ where: { email: swappedEmail } });
    expect(dedicated.kind).toBe(USER_KINDS.SYNC);

    // and the PSK read, which central serves to kind:sync only, now succeeds. This is
    // the link that would break if the gate landed without the swap.
    centralServer.user = { kind: USER_KINDS.SYNC, email: swappedEmail };
    await pullSettingsPsk({ models: facility.models, centralServer });

    expect(facility.secrets.get(FACT_SETTINGS_PSK)).toMatch(/^[0-9a-f]{64}$/);
  });

  it('refuses the PSK to the legacy admin it started as', async () => {
    const deviceId = 'facility-converge-refused';
    const legacy = await models.User.create(
      fake(models.User, { password: LEGACY_PASSWORD, role: 'admin' }),
    );
    const facility = makeFacility({ legacyEmail: legacy.email, deviceId });
    const centralServer = makeCentralServer(facility, {
      deviceId,
      kind: USER_KINDS.USER,
      email: legacy.email,
    });

    await expect(pullSettingsPsk({ models: facility.models, centralServer })).rejects.toThrow(
      '403',
    );
    expect(facility.secrets.has(FACT_SETTINGS_PSK)).toBe(false);
  });
});
