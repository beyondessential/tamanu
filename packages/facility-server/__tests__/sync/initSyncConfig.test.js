import {
  FACT_CENTRAL_HOST,
  FACT_SYNC_EMAIL,
  FACT_SYNC_PASSWORD,
  FACT_FACILITY_IDS,
} from '@tamanu/constants';

import { initSyncConfig } from '../../app/sync/initSyncConfig';

// In-memory stand-in for the LocalSystemFact model — initSyncConfig only uses get/set.
const makeFacts = (initial = {}) => {
  const store = new Map(Object.entries(initial));
  return {
    store,
    LocalSystemFact: {
      get: async key => (store.has(key) ? store.get(key) : null),
      set: async (key, value) => void store.set(key, value),
    },
  };
};

describe('initSyncConfig', () => {
  afterEach(() => {
    delete process.env.SYNC_URL;
    delete process.env.SYNC_FACILITY_IDS;
  });

  it('writes facts from SYNC_URL / SYNC_FACILITY_IDS env (declarative, facts win)', async () => {
    process.env.SYNC_URL = 'https://user%40x.io:pw@central.example.com';
    process.env.SYNC_FACILITY_IDS = 'fac-a, fac-b';
    const { store, LocalSystemFact } = makeFacts();

    await initSyncConfig({ context: { models: { LocalSystemFact } } });

    expect(store.get(FACT_CENTRAL_HOST)).toBe('https://central.example.com');
    expect(store.get(FACT_SYNC_EMAIL)).toBe('user@x.io');
    expect(store.get(FACT_SYNC_PASSWORD)).toBe('pw');
    expect(JSON.parse(store.get(FACT_FACILITY_IDS))).toEqual(['fac-a', 'fac-b']);
  });

  it('resolves context from existing facts and marks configured', async () => {
    const { LocalSystemFact } = makeFacts({
      [FACT_CENTRAL_HOST]: 'https://central.example.com',
      [FACT_SYNC_EMAIL]: 'e@x.io',
      [FACT_SYNC_PASSWORD]: 'pw',
      [FACT_FACILITY_IDS]: JSON.stringify(['fac-a']),
    });
    const context = { models: { LocalSystemFact } };

    await initSyncConfig({ context });

    expect(context.isConfigured).toBe(true);
    expect(context.syncHost).toBe('https://central.example.com');
    expect(context.syncCredentials).toEqual({ email: 'e@x.io', password: 'pw' });
    expect(context.facilityIds).toEqual(['fac-a']);
  });

  it('is not configured when a required value is missing (half-set state)', async () => {
    const { LocalSystemFact } = makeFacts({
      [FACT_CENTRAL_HOST]: 'https://central.example.com',
      [FACT_FACILITY_IDS]: JSON.stringify(['fac-a']),
      // no creds
    });
    const context = { models: { LocalSystemFact } };

    await initSyncConfig({ context });

    expect(context.isConfigured).toBe(false);
  });
});
