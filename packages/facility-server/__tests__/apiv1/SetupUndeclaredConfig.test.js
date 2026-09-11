import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';

// A server whose config declares neither a host nor its facilities: the k8s images
// that carry no sync block, and any hand-written config. Both guards have nothing to
// check against and must stand aside rather than refuse everything.
vi.mock('../../app/serverConfig', async importOriginal => ({
  ...(await importOriginal()),
  isServerConfigured: () => false,
  getDeclaredHost: () => null,
  getDeclaredFacilityIds: () => null,
}));

const { createTestContext } = await import('../utilities');

const ENDPOINT = '/api/public/setup/sync';

const body = () => ({
  host: 'https://central.undeclared.example.com',
  email: 'admin@example.com',
  password: 'sup3r-secret-pw',
  facilityIds: ['a-facility-config-never-mentions'],
});

describe('setup without a declared config', () => {
  let ctx;
  let baseApp;

  beforeAll(async () => {
    ctx = await createTestContext();
    baseApp = ctx.baseApp;
  });
  afterAll(async () => ctx.close());

  it('accepts any host and facility when config declares neither', async () => {
    const result = await baseApp.post(ENDPOINT).send(body());

    // past both guards: the only thing left to stop it is the unreachable probe
    expect(result.status).toBe(422);
    expect(result.body.error.name).toBe('Could not connect to the central server');
  });
});
