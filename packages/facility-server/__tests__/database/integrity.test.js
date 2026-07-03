import { FACT_CENTRAL_HOST, FACT_FACILITY_IDS } from '@tamanu/constants';

import { createTestContext } from '../utilities';
import { performDatabaseIntegrityChecks } from '../../app/database/integrity';

const DECLARED_HOST = 'https://integrity.example.com';

describe('performDatabaseIntegrityChecks', () => {
  let ctx;
  let LocalSystemFact;
  let originalHost;
  let originalFacilityIds;

  beforeAll(async () => {
    ctx = await createTestContext();
    ({ LocalSystemFact } = ctx.models);
    originalHost = await LocalSystemFact.get(FACT_CENTRAL_HOST);
    originalFacilityIds = await LocalSystemFact.get(FACT_FACILITY_IDS);
    process.env.SYNC_URL = DECLARED_HOST;
    process.env.SYNC_FACILITY_IDS = 'facility-a,facility-b';
  });

  afterAll(async () => {
    delete process.env.SYNC_URL;
    delete process.env.SYNC_FACILITY_IDS;
    await LocalSystemFact.set(FACT_CENTRAL_HOST, originalHost);
    await LocalSystemFact.set(FACT_FACILITY_IDS, originalFacilityIds);
    await ctx.close();
  });

  beforeEach(async () => {
    await LocalSystemFact.set(FACT_CENTRAL_HOST, DECLARED_HOST);
    await LocalSystemFact.set(FACT_FACILITY_IDS, JSON.stringify(['facility-a']));
  });

  it('stamps the declared host when no fact is recorded yet', async () => {
    await LocalSystemFact.destroy({ where: { key: FACT_CENTRAL_HOST }, force: true });
    await performDatabaseIntegrityChecks(ctx);
    expect(await LocalSystemFact.get(FACT_CENTRAL_HOST)).toBe(DECLARED_HOST);
  });

  it('passes when the recorded facts match the declaration', async () => {
    await expect(performDatabaseIntegrityChecks(ctx)).resolves.not.toThrow();
  });

  it('fails on a host mismatch instead of overwriting the fact', async () => {
    await LocalSystemFact.set(FACT_CENTRAL_HOST, 'https://other.example.com');
    await expect(performDatabaseIntegrityChecks(ctx)).rejects.toThrow(/sync\.host mismatch/);
    expect(await LocalSystemFact.get(FACT_CENTRAL_HOST)).toBe('https://other.example.com');
  });

  it('fails when a recorded facility is not covered by the declaration', async () => {
    await LocalSystemFact.set(FACT_FACILITY_IDS, JSON.stringify(['facility-other']));
    await expect(performDatabaseIntegrityChecks(ctx)).rejects.toThrow(
      /serverFacilityId mismatch/,
    );
  });
});
