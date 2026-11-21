import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  DEVICE_SCOPES,
  FACT_CENTRAL_HOST,
  FACT_FACILITY_IDS,
  FACT_SYNC_EMAIL,
  FACT_SYNC_PASSWORD,
} from '@tamanu/constants';

// A central that accepts the administrator and mints a sync user, and accepts that sync user's
// login unless the test says otherwise. Subclassed rather than replaced, so the test context's
// own connection still builds.
const MINTED_EMAIL = 'sync.minted@sync.tamanu';
const central = vi.hoisted(() => ({ logins: [], rejectsSyncUser: false }));
vi.mock('@tamanu/api-client', async importOriginal => {
  const original = await importOriginal();
  class TamanuApi extends original.TamanuApi {
    async login(email, _password, { scopes } = {}) {
      central.logins.push({ email, scopes });
      if (email === MINTED_EMAIL && central.rejectsSyncUser) {
        throw new Error('invalid credentials');
      }
      return { ability: { can: () => true } };
    }

    async post(endpoint) {
      if (endpoint === 'admin/syncCredentials') {
        return { email: MINTED_EMAIL, password: 'minted-password' };
      }
      throw new Error(`Unexpected request to ${endpoint}`);
    }
  }
  return { ...original, TamanuApi };
});

vi.mock('../../app/serverConfig', async importOriginal => ({
  ...(await importOriginal()),
  isServerConfigured: () => false,
  getDeclaredHost: () => null,
  getDeclaredFacilityIds: () => null,
}));

const { createTestContext } = await import('../utilities');

const ENDPOINT = '/api/public/setup/sync';
const FACILITY_ID = 'setup-sync-credentials-facility';

// spec: FSETUP#setup-wizard
describe('setup wizard sync credentials', () => {
  let ctx;
  let baseApp;
  let models;

  const submit = () =>
    baseApp.post(ENDPOINT).send({
      host: 'https://central.setup.example.com',
      email: 'admin@example.com',
      password: 'sup3r-secret-pw',
      facilityIds: [FACILITY_ID],
    });

  const resetConfiguration = async () => {
    for (const fact of [FACT_CENTRAL_HOST, FACT_SYNC_EMAIL, FACT_FACILITY_IDS]) {
      await models.LocalSystemFact.set(fact, null);
    }
    await models.LocalSystemSecret.destroy({ where: { key: FACT_SYNC_PASSWORD }, force: true });
  };

  beforeAll(async () => {
    ctx = await createTestContext();
    baseApp = ctx.baseApp;
    models = ctx.models;
  });
  beforeEach(async () => {
    central.logins.length = 0;
    central.rejectsSyncUser = false;
    await resetConfiguration();
  });
  afterAll(async () => {
    await resetConfiguration();
    await ctx.close();
  });

  it('logs in as the minted sync user before saving the configuration', async () => {
    const result = await submit();

    expect(result).toHaveSucceeded();
    expect(central.logins).toContainEqual({
      email: MINTED_EMAIL,
      scopes: [DEVICE_SCOPES.SYNC_CLIENT],
    });
    expect(await models.LocalSystemFact.get(FACT_SYNC_EMAIL)).toBe(MINTED_EMAIL);
  });

  it('stays unconfigured when central refuses the minted sync user', async () => {
    central.rejectsSyncUser = true;

    const result = await submit();

    expect(result.status).toBe(502);
    expect(result.body.error.message).toBe(
      'Could not log in to the central server with the new sync credentials',
    );
    expect(await models.LocalSystemFact.get(FACT_SYNC_EMAIL)).toBeNull();
  });
});
