import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';

vi.mock('../../app/serverConfig', async importOriginal => ({
  ...(await importOriginal()),
  isServerConfigured: () => false,
}));

const { createTestContext } = await import('../utilities');

// Config declares the facilities a server is meant to serve, and the boot integrity
// check throws on the next restart if the wizard was given something else. Handing
// them to the wizard is what stops that being discoverable only by restarting.
describe('public/ping on an unconfigured server', () => {
  let ctx;
  let baseApp;

  beforeAll(async () => {
    ctx = await createTestContext();
    baseApp = ctx.baseApp;
  });
  afterAll(async () => ctx.close());

  it('returns the facility ids declared in config, for the wizard to prefill', async () => {
    const result = await baseApp.get('/api/public/ping');

    expect(result.status).toBe(200);
    expect(result.body.setupRequired).toBe(true);
    expect(result.body.declaredFacilityIds).toEqual(['balwyn', 'kerang', 'lake-charm']);
  });

  it('withholds them from a source that could not run setup anyway', async () => {
    const result = await baseApp.get('/api/public/ping').set('X-Forwarded-For', '8.8.8.8');

    expect(result.status).toBe(200);
    expect(result.body.setupRequired).toBe(true);
    expect(result.body).not.toHaveProperty('declaredFacilityIds');
  });
});
