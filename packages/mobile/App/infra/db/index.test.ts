import { Database } from './index';

// Runs against real SQLite (the Jest connection config), so ANALYZE is actually executed and
// the sqlite_stat1 side effects can be observed.
describe('DatabaseHelper.refreshQueryPlannerStats()', () => {
  beforeAll(async () => {
    await Database.connect();
  });

  it('gathers query planner statistics for populated tables', async () => {
    await Database.models.Facility.createAndSaveOne({ name: 'Planner Stats Facility' });

    await Database.refreshQueryPlannerStats();

    const rows = await Database.client.query(
      `SELECT stat FROM sqlite_stat1 WHERE tbl = 'facilities'`,
    );
    expect(rows.length).toBeGreaterThan(0);
  });

  it('resolves even when ANALYZE fails', async () => {
    const originalQuery = Database.client.query;
    Database.client.query = jest.fn().mockRejectedValue(new Error('database is locked'));
    try {
      await expect(Database.refreshQueryPlannerStats()).resolves.toBeUndefined();
    } finally {
      Database.client.query = originalQuery;
    }
  });
});
