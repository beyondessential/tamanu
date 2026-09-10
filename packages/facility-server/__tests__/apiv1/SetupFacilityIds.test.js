import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';

vi.mock('../../app/serverConfig', async importOriginal => ({
  ...(await importOriginal()),
  isServerConfigured: () => false,
}));

const { createTestContext } = await import('../utilities');

const ENDPOINT = '/api/public/setup/sync';
// The test config declares balwyn, kerang and lake-charm.
const DECLARED = 'balwyn';

const body = facilityIds => ({
  host: 'https://central.example.com',
  email: 'admin@example.com',
  password: 'sup3r-secret-pw',
  facilityIds,
});

// The boot integrity check refuses to start when the recorded facilities aren't a
// subset of what config declares, so accepting them here would turn a typo into a
// server that runs now and won't restart later.
describe('setup facility ids', () => {
  let ctx;
  let baseApp;

  beforeAll(async () => {
    ctx = await createTestContext();
    baseApp = ctx.baseApp;
  });
  afterAll(async () => ctx.close());

  it('refuses a facility this server is not configured to serve', async () => {
    const result = await baseApp.post(ENDPOINT).send(body([DECLARED, 'not-declared']));

    expect(result.status).toBe(422);
    // names what was rejected, without listing what config declares
    expect(result.body.error.message).toContain('not-declared');
    expect(result.body.error.message).not.toContain('kerang');
  });

  it('lets a declared subset through to the central probe', async () => {
    const result = await baseApp.post(ENDPOINT).send(body([DECLARED]));

    // central.example.com is unreachable, so it gets as far as the probe and no further
    expect(result.status).toBe(422);
    expect(result.body.error.name).toBe('Could not connect to the central server');
  });
});
