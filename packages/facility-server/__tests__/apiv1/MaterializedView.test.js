import { createTestContext } from '../utilities';
import { RefreshUpcomingVaccinations } from '../../app/tasks/RefreshMaterializedView';

jest.mock('@tamanu/shared/utils/dateTime', () => ({
  getCurrentDateTimeString: jest.fn(() => '2021-01-01 00:00:00'),
}));

describe('Materialized view', () => {
  let ctx;
  let baseApp;
  let app;
  let task;

  beforeAll(async () => {
    ctx = await createTestContext();
    baseApp = ctx.baseApp;
    app = await baseApp.asRole('practitioner');
    task = new RefreshUpcomingVaccinations(ctx);
    await task.run();
  });
  afterAll(async () => {
    jest.clearAllMocks();
    await ctx.close();
  });

  describe('Materialized view refresh stats', () => {
    it('returns error when view name is not found', async () => {
      const res = await app.get('/api/materializedView/refreshStats/unknownView').query({
        language: 'en',
      });
      expect(res).toHaveStatus(404);
    });
  });
  it('returns the last refreshed time and cron schedule for a materialized view', async () => {
    const res = await app.get('/api/materializedView/refreshStats/upcomingVaccinations').query({
      language: 'en',
    });
    expect(res).toHaveStatus(200);
    expect(res.body).toEqual({
      lastRefreshed: '2021-01-01 00:00:00',
      schedule: 'Every 50 minutes',
    });
  });
});
