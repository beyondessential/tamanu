import { afterEach, describe, expect, it } from 'vitest';
import {
  FACT_CENTRAL_ENDPOINTS,
  FACT_CENTRAL_HOST,
  FACT_SYNC_EMAIL,
  FACT_SYNC_PASSWORD,
  FACT_FACILITY_IDS,
} from '@tamanu/constants';

import {
  canUseCentralEndpoints,
  getCentralHosts,
  initServerConfig,
  getSyncConfig,
  getServerFacilityIds,
  isServerConfigured,
} from '../app/serverConfig';

// In-memory stand-ins for the models the resolver reads: LocalSystemFact (host,
// email, facility ids) and LocalSystemSecret (the encrypted password, via
// get/set).
const makeModels = ({ facts = {}, secrets = {}, secretError = null } = {}) => {
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
        get: async key => {
          if (secretError) throw secretError;
          return secretStore.has(key) ? secretStore.get(key) : null;
        },
        set: async (key, value) => void secretStore.set(key, value),
      },
    },
  };
};

const initWith = m => initServerConfig({ context: { models: m.models } });

// what the facility test config declares
const configFacilityIds = ['balwyn', 'kerang', 'lake-charm'];

describe('serverConfig', () => {
  afterEach(() => {
    delete process.env.SYNC_URL;
    delete process.env.TAMANU_FACILITY_IDS;
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

  it('lets SYNC_URL / TAMANU_FACILITY_IDS env take precedence over facts (no fact writes)', async () => {
    process.env.SYNC_URL = 'https://env-user%40x.io:env-pw@env.example.com';
    process.env.TAMANU_FACILITY_IDS = 'env-a, env-b';
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

  it('trims and dedupes TAMANU_FACILITY_IDS', async () => {
    process.env.TAMANU_FACILITY_IDS = ' env-a , env-a,env-b ,, ';
    await initWith(makeModels());
    expect(getServerFacilityIds()).toEqual(['env-a', 'env-b']);
  });

  it('ignores the superseded SYNC_FACILITY_IDS name', async () => {
    process.env.SYNC_FACILITY_IDS = 'old-a,old-b';
    await initWith(makeModels());

    // resolution falls through to config, as though the variable were unset
    expect(getServerFacilityIds()).not.toContain('old-a');
    expect(getServerFacilityIds()).toEqual(configFacilityIds);
  });

  it('rejects a malformed SYNC_URL with a clear error', async () => {
    process.env.SYNC_URL = 'not a url';
    await expect(initWith(makeModels())).rejects.toThrow('SYNC_URL is not a valid URL');
  });

  it('leaves the server unconfigured when the stored password will not decrypt', async () => {
    await initWith(
      makeModels({
        facts: {
          [FACT_CENTRAL_HOST]: 'https://central.example.com',
          [FACT_SYNC_EMAIL]: 'e@x.io',
          [FACT_FACILITY_IDS]: JSON.stringify(['fac-a']),
        },
        secretError: new Error('Decryption failed'),
      }),
    );

    expect(getSyncConfig().password).toBe(null);
    expect(isServerConfigured()).toBe(false);
  });

  it('still uses the config password before the secret tables exist', async () => {
    const undefinedTable = Object.assign(new Error('relation does not exist'), {
      original: { code: '42P01' },
    });
    await initWith(makeModels({ secretError: undefinedTable }));

    expect(getSyncConfig().password).toBeTruthy();
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

  // spec: CEND
  describe('central hosts', () => {
    const baseFacts = {
      [FACT_CENTRAL_HOST]: 'https://seed.example.com',
      [FACT_SYNC_EMAIL]: 'e@x.io',
      [FACT_FACILITY_IDS]: JSON.stringify(['fac-a']),
    };

    it('is the single seeded host when central has supplied no list', async () => {
      await initWith(makeModels({ facts: baseFacts, secrets: { [FACT_SYNC_PASSWORD]: 'pw' } }));

      expect(getCentralHosts()).toEqual(['https://seed.example.com']);
      expect(getSyncConfig().host).toBe('https://seed.example.com');
      expect(canUseCentralEndpoints()).toBe(true);
    });

    it('is the recorded list once central has supplied one, with the first as the sync host', async () => {
      await initWith(
        makeModels({
          facts: {
            ...baseFacts,
            [FACT_CENTRAL_ENDPOINTS]: JSON.stringify([
              'https://new.example.com',
              'http://central.local',
            ]),
          },
          secrets: { [FACT_SYNC_PASSWORD]: 'pw' },
        }),
      );

      expect(getCentralHosts()).toEqual(['https://new.example.com', 'http://central.local']);
      expect(getSyncConfig().host).toBe('https://new.example.com');
      expect(canUseCentralEndpoints()).toBe(true);
    });

    it('is only the SYNC_URL host when SYNC_URL is set, ignoring the recorded list', async () => {
      process.env.SYNC_URL = 'https://env-user%40x.io:env-pw@env.example.com';
      await initWith(
        makeModels({
          facts: {
            ...baseFacts,
            [FACT_CENTRAL_ENDPOINTS]: JSON.stringify(['https://new.example.com']),
          },
        }),
      );

      expect(getCentralHosts()).toEqual(['https://env.example.com']);
      expect(canUseCentralEndpoints()).toBe(false);
    });

    it('ignores a malformed recorded list', async () => {
      await initWith(
        makeModels({
          facts: { ...baseFacts, [FACT_CENTRAL_ENDPOINTS]: '{not json' },
          secrets: { [FACT_SYNC_PASSWORD]: 'pw' },
        }),
      );

      expect(getCentralHosts()).toEqual(['https://seed.example.com']);
    });

    it('falls back to the legacy config host when nothing else is set', async () => {
      await initWith(makeModels());
      expect(getCentralHosts()).toEqual([getSyncConfig().host]);
    });
  });
});
