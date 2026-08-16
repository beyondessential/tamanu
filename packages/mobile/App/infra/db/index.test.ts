import { Database, PLANNER_STATS_REFRESHED_AT_KEY } from './index';

const FOUR_HOURS_MS = 14_400_000;

const getRefreshedAtFact = () =>
  Database.models.LocalSystemFact.findOne({ where: { key: PLANNER_STATS_REFRESHED_AT_KEY } });

const didRunAnalyze = (querySpy: jest.SpyInstance) =>
  querySpy.mock.calls.some(
    ([sql]) => typeof sql === 'string' && sql.toUpperCase().includes('ANALYZE'),
  );

// Runs against real SQLite (the Jest connection config), so ANALYZE is actually executed and
// the sqlite_stat1 side effects can be observed.
describe('DatabaseHelper', () => {
  beforeAll(async () => {
    await Database.connect();
  });

  describe('requestQueryPlannerStatsRefresh()', () => {
    beforeEach(async () => {
      const fact = await getRefreshedAtFact();
      if (fact) await fact.remove();
    });

    it('runs ANALYZE and persists the timestamp when never run before', async () => {
      await Database.models.Facility.createAndSaveOne({ name: 'Planner Stats Facility' });
      const before = Date.now();
      const querySpy = jest.spyOn(Database.client, 'query');

      try {
        await Database.requestQueryPlannerStatsRefresh();
        expect(didRunAnalyze(querySpy)).toBe(true);
      } finally {
        querySpy.mockRestore();
      }

      const rows = await Database.client.query(
        "SELECT stat FROM sqlite_stat1 WHERE tbl = 'facilities'",
      );
      expect(rows.length).toBeGreaterThan(0);
      const fact = await getRefreshedAtFact();
      expect(fact).toBeTruthy();
      expect(parseInt(fact.value, 10)).toBeGreaterThanOrEqual(before);
    });

    it('skips ANALYZE when the last run is within the refresh interval', async () => {
      await Database.models.LocalSystemFact.createAndSaveOne({
        key: PLANNER_STATS_REFRESHED_AT_KEY,
        value: String(Date.now() - FOUR_HOURS_MS / 2),
      });
      const querySpy = jest.spyOn(Database.client, 'query');

      try {
        await Database.requestQueryPlannerStatsRefresh();
        expect(didRunAnalyze(querySpy)).toBe(false);
      } finally {
        querySpy.mockRestore();
      }
    });

    it('runs ANALYZE again when the last run is older than the refresh interval', async () => {
      const staleTimestamp = String(Date.now() - FOUR_HOURS_MS - 60_000);
      await Database.models.LocalSystemFact.createAndSaveOne({
        key: PLANNER_STATS_REFRESHED_AT_KEY,
        value: staleTimestamp,
      });
      const querySpy = jest.spyOn(Database.client, 'query');

      try {
        await Database.requestQueryPlannerStatsRefresh();
        expect(didRunAnalyze(querySpy)).toBe(true);
      } finally {
        querySpy.mockRestore();
      }

      const fact = await getRefreshedAtFact();
      expect(parseInt(fact.value, 10)).toBeGreaterThan(parseInt(staleTimestamp, 10));
    });

    it('does not persist a timestamp when ANALYZE fails', async () => {
      const originalQuery = Database.client.query.bind(Database.client);
      const querySpy = jest
        .spyOn(Database.client, 'query')
        .mockImplementation((sql: string, parameters?: any[]) => {
          if (typeof sql === 'string' && sql.toUpperCase().includes('ANALYZE')) {
            return Promise.reject(new Error('database is locked'));
          }
          return originalQuery(sql, parameters);
        });

      try {
        await expect(Database.requestQueryPlannerStatsRefresh()).resolves.toBeUndefined();
        expect(await getRefreshedAtFact()).toBeFalsy();
      } finally {
        querySpy.mockRestore();
      }
    });
  });
});
