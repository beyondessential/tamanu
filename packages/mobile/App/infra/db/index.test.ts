import {
  Database,
  PLANNER_STATS_FULLY_ANALYSED_AT_KEY,
  PLANNER_STATS_REFRESHED_AT_KEY,
} from './index';

const NINETY_MIN_MS = 5_400_000;

const getFact = async (key: string) => {
  return await Database.models.LocalSystemFact.findOne({ where: { key } });
};

const getRefreshedAtFact = async () => await getFact(PLANNER_STATS_REFRESHED_AT_KEY);

const getFullyAnalysedAtFact = async () => await getFact(PLANNER_STATS_FULLY_ANALYSED_AT_KEY);

const setFact = async (key: string, value: string) => {
  return await Database.models.LocalSystemFact.createAndSaveOne({ key, value });
};

const didRunAnalyze = (querySpy: jest.SpyInstance) =>
  querySpy.mock.calls.some(
    ([sql]) => typeof sql === 'string' && sql.toUpperCase().includes('ANALYZE'),
  );

const didRunFullAnalyze = (querySpy: jest.SpyInstance) =>
  querySpy.mock.calls.some(
    ([sql]) => typeof sql === 'string' && sql.includes('PRAGMA analysis_limit = 0;'),
  );

const didRunApproximateAnalyze = (querySpy: jest.SpyInstance) =>
  querySpy.mock.calls.some(
    ([sql]) => typeof sql === 'string' && sql.includes('PRAGMA analysis_limit = 400;'),
  );

// Runs against real SQLite (the Jest connection config), so ANALYZE is actually executed and
// the sqlite_stat1 side effects can be observed.
describe('DatabaseHelper', () => {
  beforeAll(async () => {
    await Database.connect();
  });

  describe('requestQueryPlannerStatsRefresh()', () => {
    beforeEach(async () => {
      for (const fact of [await getRefreshedAtFact(), await getFullyAnalysedAtFact()]) {
        if (fact) await fact.remove();
      }
    });

    it('runs a full ANALYZE and persists both timestamps when never run before', async () => {
      await Database.models.Facility.createAndSaveOne({ name: 'Planner Stats Facility' });
      const before = Date.now();
      const querySpy = jest.spyOn(Database.client, 'query');

      try {
        await Database.requestQueryPlannerStatsRefresh();
        expect(didRunFullAnalyze(querySpy)).toBe(true);
        expect(didRunApproximateAnalyze(querySpy)).toBe(false);
      } finally {
        querySpy.mockRestore();
      }

      const rows = await Database.client.query(
        "SELECT stat FROM sqlite_stat1 WHERE tbl = 'facilities'",
      );
      expect(rows.length).toBeGreaterThan(0);
      for (const fact of [await getRefreshedAtFact(), await getFullyAnalysedAtFact()]) {
        expect(fact).toBeTruthy();
        expect(parseInt(fact.value, 10)).toBeGreaterThanOrEqual(before);
      }
    });

    it('runs an approximate ANALYZE once a full one has been recorded', async () => {
      const fullTimestamp = String(Date.now() - NINETY_MIN_MS * 10);
      await setFact(PLANNER_STATS_FULLY_ANALYSED_AT_KEY, fullTimestamp);
      const querySpy = jest.spyOn(Database.client, 'query');

      try {
        await Database.requestQueryPlannerStatsRefresh();
        expect(didRunApproximateAnalyze(querySpy)).toBe(true);
        expect(didRunFullAnalyze(querySpy)).toBe(false);
      } finally {
        querySpy.mockRestore();
      }

      // The one-off marker records when the full run happened, so an approximate run leaves it be
      const fullFact = await getFullyAnalysedAtFact();
      expect(fullFact.value).toBe(fullTimestamp);
    });

    it('ignores the refresh interval while a full ANALYZE is still outstanding', async () => {
      await setFact(PLANNER_STATS_REFRESHED_AT_KEY, String(Date.now() - NINETY_MIN_MS / 2));
      const querySpy = jest.spyOn(Database.client, 'query');

      try {
        await Database.requestQueryPlannerStatsRefresh();
        expect(didRunFullAnalyze(querySpy)).toBe(true);
      } finally {
        querySpy.mockRestore();
      }

      expect(await getFullyAnalysedAtFact()).toBeTruthy();
    });

    it('skips ANALYZE when the last run is within the refresh interval', async () => {
      await setFact(PLANNER_STATS_FULLY_ANALYSED_AT_KEY, String(Date.now() - NINETY_MIN_MS * 10));
      await setFact(PLANNER_STATS_REFRESHED_AT_KEY, String(Date.now() - NINETY_MIN_MS / 2));
      const querySpy = jest.spyOn(Database.client, 'query');

      try {
        await Database.requestQueryPlannerStatsRefresh();
        expect(didRunAnalyze(querySpy)).toBe(false);
      } finally {
        querySpy.mockRestore();
      }
    });

    it('runs ANALYZE again when the last run is older than the refresh interval', async () => {
      const staleTimestamp = String(Date.now() - NINETY_MIN_MS - 60_000);
      await setFact(PLANNER_STATS_FULLY_ANALYSED_AT_KEY, staleTimestamp);
      await setFact(PLANNER_STATS_REFRESHED_AT_KEY, staleTimestamp);
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

    it('coalesces overlapping calls so ANALYZE only runs once', async () => {
      const querySpy = jest.spyOn(Database.client, 'query');

      try {
        await Promise.all([
          Database.requestQueryPlannerStatsRefresh(),
          Database.requestQueryPlannerStatsRefresh(),
        ]);
        const analyzeCalls = querySpy.mock.calls.filter(
          ([sql]) => typeof sql === 'string' && sql.toUpperCase().includes('ANALYZE;'),
        );
        expect(analyzeCalls).toHaveLength(1);
      } finally {
        querySpy.mockRestore();
      }
    });

    it('does not persist a timestamp when ANALYZE fails', async () => {
      const querySpy = mockFailingAnalyze();

      try {
        await expect(Database.requestQueryPlannerStatsRefresh()).resolves.toBeUndefined();
        expect(await getRefreshedAtFact()).toBeFalsy();
        expect(await getFullyAnalysedAtFact()).toBeFalsy();
      } finally {
        querySpy.mockRestore();
      }
    });

    it('retries the full ANALYZE after a failure', async () => {
      const failingSpy = mockFailingAnalyze();
      try {
        await Database.requestQueryPlannerStatsRefresh();
      } finally {
        failingSpy.mockRestore();
      }

      const querySpy = jest.spyOn(Database.client, 'query');
      try {
        await Database.requestQueryPlannerStatsRefresh();
        expect(didRunFullAnalyze(querySpy)).toBe(true);
      } finally {
        querySpy.mockRestore();
      }

      expect(await getFullyAnalysedAtFact()).toBeTruthy();
    });
  });
});

/** Fails the ANALYZE statement itself while leaving every other query working */
function mockFailingAnalyze(): jest.SpyInstance {
  const originalQuery = Database.client.query.bind(Database.client);
  return jest
    .spyOn(Database.client, 'query')
    .mockImplementation((sql: string, parameters?: any[]) => {
      if (typeof sql === 'string' && sql.toUpperCase().includes('ANALYZE;')) {
        return Promise.reject(new Error('database is locked'));
      }
      return originalQuery(sql, parameters);
    });
}
