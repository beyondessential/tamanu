import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';

vi.mock('../../app/serverConfig', async importOriginal => ({
  ...(await importOriginal()),
  isServerConfigured: () => false,
}));

const { createTestContext } = await import('../utilities');

const ENDPOINT = '/api/public/setup/sync';
const DECLARED_HOST = 'https://central.example.com';
// The test config declares balwyn, kerang and lake-charm.
const DECLARED = 'balwyn';

const body = ({ host = DECLARED_HOST, facilityIds = [DECLARED] } = {}) => ({
  host,
  email: 'admin@example.com',
  password: 'sup3r-secret-pw',
  facilityIds,
});

// The boot integrity check refuses to start when the recorded host or facilities
// don't match what config declares, so accepting them here would turn a typo into a
// server that runs now and won't restart.
describe('setup against declared config', () => {
  let ctx;
  let baseApp;

  beforeAll(async () => {
    ctx = await createTestContext();
    baseApp = ctx.baseApp;
    process.env.SYNC_URL = DECLARED_HOST;
  });
  afterAll(async () => {
    delete process.env.SYNC_URL;
    await ctx.close();
  });

  it('refuses a host other than the one this server is configured for', async () => {
    const result = await baseApp.post(ENDPOINT).send(body({ host: 'https://other.example.com' }));

    expect(result.status).toBe(422);
    expect(result.body.error.name).toBe('Central server not configured on this server');
    // says a different host is configured, without naming it
    expect(result.body.error.message).not.toContain('central.example.com');
  });

  it('refuses a facility this server is not configured to serve', async () => {
    const result = await baseApp
      .post(ENDPOINT)
      .send(body({ facilityIds: [DECLARED, 'not-declared'] }));

    expect(result.status).toBe(422);
    // names what was rejected, without listing what config declares
    expect(result.body.error.message).toContain('not-declared');
    expect(result.body.error.message).not.toContain('kerang');
  });

  it('lets the declared host and a declared subset through to the central probe', async () => {
    const result = await baseApp.post(ENDPOINT).send(body());

    // central.example.com is unreachable, so it gets as far as the probe and no further
    expect(result.status).toBe(422);
    expect(result.body.error.name).toBe('Could not connect to the central server');
  });
});
