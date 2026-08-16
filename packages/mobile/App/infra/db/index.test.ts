import { Database, PLANNER_STATS_REFRESHED_AT_KEY } from './index';

const FOUR_HOURS_MS = 14_400_000;

const getRefreshedAtFact = () =>
  Database.models.LocalSystemFact.findOne({ where: { key: PLANNER_STATS_REFRESHED_AT_KEY } });

// Runs against real SQLite (the Jest connection config), so ANALYZE is actually executed and
// the sqlite_stat1 side effects can be observed.
describe('DatabaseHelper', () => {
  beforeAll(async () => {
    await Database.connect();
  });

  describe('refreshQueryPlannerStats()', () => {
    it('gathers query planner statistics for populated tables', async () => {
      await Database.models.Facility.createAndSaveOne({ name: 'Planner Stats Facility' });

      await expect(Database.refreshQueryPlannerStats()).resolves.toBe(true);

      const rows = await Database.client.query(
        "SELECT stat FROM sqlite_stat1 WHERE tbl = 'facilities'",
      );
      expect(rows.length).toBeGreaterThan(0);
    });

    it('resolves with failure rather than throwing when ANALYZE fails', async () => {
      const querySpy = jest
        .spyOn(Database.client, 'query')
        .mockRejectedValue(new Error('database is locked'));
      try {
        await expect(Database.refreshQueryPlannerStats()).resolves.toBe(false);
      } finally {
        querySpy.mockRestore();
      }
    });
  });

  describe('requestQueryPlannerStatsRefresh()', () => {
    let refreshSpy: jest.SpyInstance;

    beforeEach(async () => {
      refreshSpy = jest.spyOn(Database, 'refreshQueryPlannerStats');
      const fact = await getRefreshedAtFact();
      if (fact) await fact.remove();
    });

    afterEach(() => {
      refreshSpy.mockRestore();
    });

    it('refreshes and persists the timestamp when never run before', async () => {
      const before = Date.now();

      await Database.requestQueryPlannerStatsRefresh();

      expect(refreshSpy).toHaveBeenCalledTimes(1);
      const fact = await getRefreshedAtFact();
      expect(fact).toBeTruthy();
      expect(parseInt(fact.value, 10)).toBeGreaterThanOrEqual(before);
    });

    it('skips the refresh when the last run is under 24h old', async () => {
      await Database.models.LocalSystemFact.createAndSaveOne({
        key: PLANNER_STATS_REFRESHED_AT_KEY,
        value: String(Date.now() - FOUR_HOURS_MS / 2),
      });

      await Database.requestQueryPlannerStatsRefresh();

      expect(refreshSpy).not.toHaveBeenCalled();
    });

    it('refreshes again when the last run is over 24h old', async () => {
      const staleTimestamp = String(Date.now() - FOUR_HOURS_MS - 60_000);
      await Database.models.LocalSystemFact.createAndSaveOne({
        key: PLANNER_STATS_REFRESHED_AT_KEY,
        value: staleTimestamp,
      });

      await Database.requestQueryPlannerStatsRefresh();

      expect(refreshSpy).toHaveBeenCalledTimes(1);
      const fact = await getRefreshedAtFact();
      expect(parseInt(fact.value, 10)).toBeGreaterThan(parseInt(staleTimestamp, 10));
    });

    it('does not persist a timestamp when the refresh fails', async () => {
      refreshSpy.mockResolvedValueOnce(false);

      await Database.requestQueryPlannerStatsRefresh();

      expect(refreshSpy).toHaveBeenCalledTimes(1);
      expect(await getRefreshedAtFact()).toBeFalsy();
    });
  });
});
