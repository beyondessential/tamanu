import { createTestContext } from '../utilities';

// Covers the deterministic, security-relevant contract of the first-run setup
// endpoints. The happy path (POST /public/setup/sync writing facts) drives an
// outbound central login probe + credential provisioning and writes an encrypted
// secret (needs crypto.keyFile), so it's exercised end-to-end manually rather
// than stubbed here; this suite covers the status flag and input rejection.
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

  describe('GET /public/ping', () => {
    it('reports setupRequired for an unconfigured server', async () => {
      const result = await baseApp.get('/api/public/ping');
      expect(result.status).toBe(200);
      expect(result.body.ok).toBe('ok');
      expect(result.body.setupRequired).toBe(true);
    });
  });

  describe('POST /public/setup/sync', () => {
    // supertest connects over loopback, so the trusted-source gate passes and the
    // request reaches validation.
    it('rejects a missing host', async () => {
      const result = await baseApp
        .post('/api/public/setup/sync')
        .send({ email: 'admin@example.com', password: 'pw', facilityIds: ['facility-a'] });
      expect(result).toHaveRequestError();
    });

    it('rejects an empty facility id list', async () => {
      const result = await baseApp.post('/api/public/setup/sync').send({
        host: 'https://central.example.com',
        email: 'admin@example.com',
        password: 'pw',
        facilityIds: [],
      });
      expect(result).toHaveRequestError();
    });

    it('rejects a non-https host in production-like validation', async () => {
      const result = await baseApp.post('/api/public/setup/sync').send({
        host: 'ftp://central.example.com',
        email: 'admin@example.com',
        password: 'pw',
        facilityIds: ['facility-a'],
      });
      expect(result).toHaveRequestError();
    });
  });
});
