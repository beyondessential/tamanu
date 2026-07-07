import { SYNC_DIRECTIONS } from '@tamanu/constants';

import { createTestContext } from '../utilities';

// The test config provides a sync host + credentials + facilities, so the server
// is already configured. (The unconfigured paths — setupRequired, validation,
// the trusted-source gate — are covered by serverConfig + trustedSetupSource
// unit tests, and the happy path is verified manually.)
describe('Setup endpoints', () => {
  let ctx;
  let baseApp;

  beforeAll(async () => {
    ctx = await createTestContext();
    baseApp = ctx.baseApp;
  });
  afterAll(async () => {
    await ctx.close();
  });

  it('GET /public/ping reports the server is configured', async () => {
    const result = await baseApp.get('/api/public/ping');
    expect(result.status).toBe(200);
    expect(result.body.ok).toBe('ok');
    expect(result.body.setupRequired).toBe(false);
  });

  it('POST /public/setup/sync refuses a configured server (409)', async () => {
    const password = 'sup3r-secret-pw';
    const result = await baseApp.post('/api/public/setup/sync').send({
      host: 'https://central.example.com',
      email: 'admin@example.com',
      password,
      facilityIds: ['facility-a'],
    });
    expect(result.status).toBe(409);
    // the endpoint must never echo the submitted credentials back
    expect(JSON.stringify(result.body)).not.toContain(password);
  });

  it('never syncs the stores that hold sync credentials', () => {
    const { LocalSystemFact, LocalSystemSecret } = ctx.models;
    expect(LocalSystemFact.syncDirection).toBe(SYNC_DIRECTIONS.DO_NOT_SYNC);
    expect(LocalSystemSecret.syncDirection).toBe(SYNC_DIRECTIONS.DO_NOT_SYNC);
  });
});
