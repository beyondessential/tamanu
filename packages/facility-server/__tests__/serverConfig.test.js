import {
  FACT_CENTRAL_HOST,
  FACT_SYNC_EMAIL,
  FACT_SYNC_PASSWORD,
  FACT_FACILITY_IDS,
} from '@tamanu/constants';

import {
  initServerConfig,
  getSyncConfig,
  getServerFacilityIds,
  isServerConfigured,
} from '../app/serverConfig';

// In-memory stand-in for the LocalSystemFact model — the resolver only reads via get.
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

const initWith = facts => initServerConfig({ context: { models: facts.LocalSystemFact } });

describe('serverConfig', () => {
  afterEach(() => {
    delete process.env.SYNC_URL;
    delete process.env.SYNC_FACILITY_IDS;
  });

  it('resolves the sync connection and facility ids from facts', async () => {
    await initWith(
      makeFacts({
        [FACT_CENTRAL_HOST]: 'https://central.example.com',
        [FACT_SYNC_EMAIL]: 'e@x.io',
        [FACT_SYNC_PASSWORD]: 'pw',
        [FACT_FACILITY_IDS]: JSON.stringify(['fac-a']),
      }),
    );

    expect(getSyncConfig()).toEqual({
      host: 'https://central.example.com',
      email: 'e@x.io',
      password: 'pw',
    });
    expect(getServerFacilityIds()).toEqual(['fac-a']);
    expect(isServerConfigured()).toBe(true);
  });

  it('lets SYNC_URL / SYNC_FACILITY_IDS env take precedence over facts (no fact writes)', async () => {
    process.env.SYNC_URL = 'https://env-user%40x.io:env-pw@env.example.com';
    process.env.SYNC_FACILITY_IDS = 'env-a, env-b';
    const facts = makeFacts({
      [FACT_CENTRAL_HOST]: 'https://fact.example.com',
      [FACT_SYNC_EMAIL]: 'fact@x.io',
      [FACT_SYNC_PASSWORD]: 'fact-pw',
      [FACT_FACILITY_IDS]: JSON.stringify(['fact-a']),
    });

    await initWith(facts);

    expect(getSyncConfig()).toEqual({
      host: 'https://env.example.com',
      email: 'env-user@x.io',
      password: 'env-pw',
    });
    expect(getServerFacilityIds()).toEqual(['env-a', 'env-b']);
    // pure resolver — env precedence must not mutate the facts
    expect(facts.store.get(FACT_CENTRAL_HOST)).toBe('https://fact.example.com');
    expect(facts.store.get(FACT_FACILITY_IDS)).toBe(JSON.stringify(['fact-a']));
  });

  it('is not configured when a required value is missing (half-set state)', async () => {
    await initWith(
      makeFacts({
        [FACT_CENTRAL_HOST]: 'https://central.example.com',
        [FACT_FACILITY_IDS]: JSON.stringify(['fac-a']),
        // no creds (and config defaults are empty)
      }),
    );

    expect(isServerConfigured()).toBe(false);
  });
});
