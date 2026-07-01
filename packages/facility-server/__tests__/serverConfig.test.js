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

// In-memory stand-ins for the models the resolver reads: LocalSystemFact (host,
// email, facility ids) and LocalSystemSecret (the encrypted password, via
// get/set).
const makeModels = ({ facts = {}, secrets = {} } = {}) => {
  const factStore = new Map(Object.entries(facts));
  const secretStore = new Map(Object.entries(secrets));
  return {
    factStore,
    secretStore,
    models: {
      LocalSystemFact: {
        get: async key => (factStore.has(key) ? factStore.get(key) : null),
        set: async (key, value) => void factStore.set(key, value),
      },
      LocalSystemSecret: {
        get: async key => (secretStore.has(key) ? secretStore.get(key) : null),
        set: async (key, value) => void secretStore.set(key, value),
      },
    },
  };
};

const initWith = m => initServerConfig({ context: { models: m.models } });

describe('serverConfig', () => {
  afterEach(() => {
    delete process.env.SYNC_URL;
    delete process.env.SYNC_FACILITY_IDS;
  });

  it('resolves the sync connection and facility ids from facts + secret', async () => {
    await initWith(
      makeModels({
        facts: {
          [FACT_CENTRAL_HOST]: 'https://central.example.com',
          [FACT_SYNC_EMAIL]: 'e@x.io',
          [FACT_FACILITY_IDS]: JSON.stringify(['fac-a']),
        },
        secrets: { [FACT_SYNC_PASSWORD]: 'pw' },
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
    const m = makeModels({
      facts: {
        [FACT_CENTRAL_HOST]: 'https://fact.example.com',
        [FACT_SYNC_EMAIL]: 'fact@x.io',
        [FACT_FACILITY_IDS]: JSON.stringify(['fact-a']),
      },
      secrets: { [FACT_SYNC_PASSWORD]: 'fact-pw' },
    });

    await initWith(m);

    expect(getSyncConfig()).toEqual({
      host: 'https://env.example.com',
      email: 'env-user@x.io',
      password: 'env-pw',
    });
    expect(getServerFacilityIds()).toEqual(['env-a', 'env-b']);
    // pure resolver — env precedence must not mutate stored facts/secrets
    expect(m.factStore.get(FACT_CENTRAL_HOST)).toBe('https://fact.example.com');
    expect(m.secretStore.get(FACT_SYNC_PASSWORD)).toBe('fact-pw');
  });

  it('falls back to legacy config when there are no env vars or facts', async () => {
    await initWith(makeModels());

    // the facility test config supplies sync host/email/password + facilities
    const sync = getSyncConfig();
    expect(sync.host).toBeTruthy();
    expect(sync.email).toBeTruthy();
    expect(sync.password).toBeTruthy();
    expect(getServerFacilityIds()?.length).toBeGreaterThan(0);
    expect(isServerConfigured()).toBe(true);
  });
});
