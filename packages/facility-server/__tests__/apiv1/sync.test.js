import { createTestContext } from '../utilities';

describe('sync', () => {
  let baseApp;
  let app;
  let ctx;

  beforeAll(async () => {
    ctx = await createTestContext();
    baseApp = ctx.baseApp;
    app = await baseApp.asRole('practitioner');
  });
  afterAll(() => ctx.close());

  describe('run', () => {
    it.each([
      ["Sync was disabled and didn't run", { enabled: false }],
      ['Sync queued and will run later', { enabled: true, ran: false, queued: true }],
      ['Sync completed', { enabled: true, ran: true, queued: false }],
    ])('triggers a sync and returns %s', async (message, info) => {
      ctx.syncManager.triggerSync = jest.fn().mockResolvedValueOnce(info);
      const result = await app.post('/v1/sync/run');
      expect(result).toHaveProperty('body.message', message);
    });
  });
});
