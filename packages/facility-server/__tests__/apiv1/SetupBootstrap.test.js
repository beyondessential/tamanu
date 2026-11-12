import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  DEVICE_SCOPES,
  FACT_CENTRAL_HOST,
  FACT_FACILITY_IDS,
  FACT_SYNC_EMAIL,
  FACT_SYNC_PASSWORD,
} from '@tamanu/constants';
import { omit } from 'es-toolkit';
import { COLUMNS_EXCLUDED_FROM_SYNC } from '@tamanu/database/sync';
import { fake } from '@tamanu/fake-data/fake';

// A central that accepts the administrator, mints a sync user, and serves whatever bootstrap the
// test sets. Subclassed rather than replaced, so the test context's own connection still builds.
const central = vi.hoisted(() => ({ logins: [], serveBootstrap: null }));
vi.mock('@tamanu/api-client', async importOriginal => {
  const original = await importOriginal();
  class TamanuApi extends original.TamanuApi {
    async login(email, _password, { scopes } = {}) {
      central.logins.push({ email, scopes });
      return { ability: { can: () => true } };
    }

    async post(endpoint, body) {
      if (endpoint === 'admin/syncCredentials') {
        return { email: 'sync.minted@sync.tamanu', password: 'minted-password' };
      }
      if (endpoint === 'sync/bootstrap') return central.serveBootstrap(body);
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
const FACILITY_ID = 'setup-bootstrap-facility';

// spec: FSETUP#setup-wizard
describe('setup wizard bootstrap', () => {
  let ctx;
  let baseApp;
  let models;

  const submit = () =>
    baseApp.post(ENDPOINT).send({
      host: 'https://central.bootstrap.example.com',
      email: 'admin@example.com',
      password: 'sup3r-secret-pw',
      facilityIds: [FACILITY_ID],
    });

  const facilityRecord = () => ({
    recordType: 'facilities',
    recordId: FACILITY_ID,
    isDeleted: false,
    data: omit(
      fake(models.Facility, { id: FACILITY_ID, name: FACILITY_ID }),
      COLUMNS_EXCLUDED_FROM_SYNC,
    ),
  });

  const resetConfiguration = async () => {
    for (const fact of [FACT_CENTRAL_HOST, FACT_SYNC_EMAIL, FACT_FACILITY_IDS]) {
      await models.LocalSystemFact.set(fact, null);
    }
    await models.LocalSystemSecret.destroy({ where: { key: FACT_SYNC_PASSWORD }, force: true });
    await models.Facility.destroy({ where: { id: FACILITY_ID }, force: true });
  };

  beforeAll(async () => {
    ctx = await createTestContext();
    baseApp = ctx.baseApp;
    models = ctx.models;
  });
  beforeEach(async () => {
    central.logins.length = 0;
    await resetConfiguration();
  });
  afterAll(async () => {
    await resetConfiguration();
    await ctx.close();
  });

  it('logs in as the minted sync user and saves its bootstrap with the configuration', async () => {
    central.serveBootstrap = vi.fn(async () => ({ records: [facilityRecord()] }));

    const result = await submit();

    expect(result).toHaveSucceeded();
    expect(central.logins).toContainEqual({
      email: 'sync.minted@sync.tamanu',
      scopes: [DEVICE_SCOPES.SYNC_CLIENT],
    });
    expect(central.serveBootstrap).toHaveBeenCalledWith({ facilityIds: [FACILITY_ID] });
    expect(await models.LocalSystemFact.get(FACT_SYNC_EMAIL)).toBe('sync.minted@sync.tamanu');
    expect(await models.Facility.findByPk(FACILITY_ID)).not.toBeNull();
  });

  it('stays unconfigured when the bootstrap cannot be fetched', async () => {
    central.serveBootstrap = vi.fn(async () => {
      throw new Error('central unreachable');
    });

    const result = await submit();

    expect(result.status).toBe(502);
    expect(result.body.error.message).toBe(
      "Could not load this facility's data from the central server",
    );
    expect(await models.LocalSystemFact.get(FACT_SYNC_EMAIL)).toBeNull();
  });

  it('stays unconfigured when the bootstrap cannot be saved', async () => {
    const orphan = {
      recordType: 'user_facilities',
      recordId: 'orphaned-user-facility',
      isDeleted: false,
      data: {
        id: 'orphaned-user-facility',
        userId: 'a-user-not-in-the-bootstrap',
        facilityId: 'a-facility-not-in-the-bootstrap',
      },
    };
    central.serveBootstrap = vi.fn(async () => ({ records: [facilityRecord(), orphan] }));

    const result = await submit();

    expect(result).not.toHaveSucceeded();
    expect(await models.LocalSystemFact.get(FACT_SYNC_EMAIL)).toBeNull();
    expect(await models.Facility.findByPk(FACILITY_ID)).toBeNull();
  });
});
