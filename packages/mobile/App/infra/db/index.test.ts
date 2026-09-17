import { Database, PLANNER_STATS_REFRESHED_AT_KEY } from './index';

const ONE_DAY_MS = 86_400_000;

const getRefreshedAtFact = () =>
  Database.models.LocalSystemFact.findOne({ where: { key: PLANNER_STATS_REFRESHED_AT_KEY } });

const setRefreshedAtFact = (value: string) =>
  Database.models.LocalSystemFact.createAndSaveOne({ key: PLANNER_STATS_REFRESHED_AT_KEY, value });

const sqlCalls = (querySpy: jest.SpyInstance): string[] =>
  querySpy.mock.calls.map(([sql]) => sql).filter((sql): sql is string => typeof sql === 'string');

const optimizeCalls = (querySpy: jest.SpyInstance) =>
  sqlCalls(querySpy).filter(sql => sql.trim() === 'PRAGMA optimize;');

const didRunOptimize = (querySpy: jest.SpyInstance) => optimizeCalls(querySpy).length > 0;

/** Index of the first statement matching `predicate`, or -1 */
const indexOfCall = (querySpy: jest.SpyInstance, predicate: (statement: string) => boolean) =>
  sqlCalls(querySpy).findIndex(sql => predicate(sql.trim().toUpperCase()));

const didRunBareAnalyze = (querySpy: jest.SpyInstance) =>
  indexOfCall(querySpy, statement => statement.startsWith('ANALYZE')) !== -1;

/** Fails `PRAGMA optimize` while leaving every other query working */
const mockFailingOptimize = (): jest.SpyInstance => {
  const originalQuery = Database.client.query.bind(Database.client);
  return jest
    .spyOn(Database.client, 'query')
    .mockImplementation((sql: string, parameters?: any[]) => {
      if (typeof sql === 'string' && sql.includes('PRAGMA optimize')) {
        return Promise.reject(new Error('database is locked'));
      }
      return originalQuery(sql, parameters);
    });
};

// Runs against real SQLite (the Jest connection config). Jest’s SQLite is newer than the device’s
// 3.39 and decides differently what `PRAGMA optimize` should analyse, so these tests assert on the
// statements issued rather than on `sqlite_stat1`.
describe('DatabaseHelper', () => {
  beforeAll(async () => {
    await Database.connect();
  });

  describe('requestPragmaOptimize()', () => {
    beforeEach(async () => {
      const fact = await getRefreshedAtFact();
      if (fact) await fact.remove();
    });

    it('runs PRAGMA optimize and persists the timestamp when never run before', async () => {
      const before = Date.now();
      const querySpy = jest.spyOn(Database.client, 'query');

      try {
        await Database.requestPragmaOptimize();
        expect(didRunOptimize(querySpy)).toBe(true);
      } finally {
        querySpy.mockRestore();
      }

      const fact = await getRefreshedAtFact();
      expect(fact).toBeTruthy();
      expect(parseInt(fact.value, 10)).toBeGreaterThanOrEqual(before);
    });

    it('bounds the ANALYZEs with analysis_limit = 400 before running PRAGMA optimize', async () => {
      const querySpy = jest.spyOn(Database.client, 'query');

      try {
        await Database.requestPragmaOptimize();
        const limitIndex = indexOfCall(querySpy, s => s === 'PRAGMA ANALYSIS_LIMIT = 400;');
        const optimizeIndex = indexOfCall(querySpy, s => s === 'PRAGMA OPTIMIZE;');
        expect(limitIndex).not.toBe(-1);
        expect(optimizeIndex).toBeGreaterThan(limitIndex);
      } finally {
        querySpy.mockRestore();
      }
    });

    it('never runs a bare ANALYZE itself', async () => {
      const querySpy = jest.spyOn(Database.client, 'query');

      try {
        await Database.requestPragmaOptimize();
        expect(didRunBareAnalyze(querySpy)).toBe(false);
      } finally {
        querySpy.mockRestore();
      }
    });

    it('skips PRAGMA optimize when the last run is within the refresh interval', async () => {
      await setRefreshedAtFact(String(Date.now() - ONE_DAY_MS / 2));
      const querySpy = jest.spyOn(Database.client, 'query');

      try {
        await Database.requestPragmaOptimize();
        expect(didRunOptimize(querySpy)).toBe(false);
      } finally {
        querySpy.mockRestore();
      }
    });

    it('runs PRAGMA optimize again when the last run is older than the refresh interval', async () => {
      const staleTimestamp = String(Date.now() - ONE_DAY_MS - 60_000);
      await setRefreshedAtFact(staleTimestamp);
      const querySpy = jest.spyOn(Database.client, 'query');

      try {
        await Database.requestPragmaOptimize();
        expect(didRunOptimize(querySpy)).toBe(true);
      } finally {
        querySpy.mockRestore();
      }

      const fact = await getRefreshedAtFact();
      expect(parseInt(fact.value, 10)).toBeGreaterThan(parseInt(staleTimestamp, 10));
    });

    it('coalesces overlapping calls so PRAGMA optimize only runs once', async () => {
      const querySpy = jest.spyOn(Database.client, 'query');

      try {
        await Promise.all([Database.requestPragmaOptimize(), Database.requestPragmaOptimize()]);
        expect(optimizeCalls(querySpy)).toHaveLength(1);
      } finally {
        querySpy.mockRestore();
      }
    });

    it('does not persist a timestamp when PRAGMA optimize fails', async () => {
      const querySpy = mockFailingOptimize();

      try {
        await expect(Database.requestPragmaOptimize()).resolves.toBeUndefined();
        expect(await getRefreshedAtFact()).toBeFalsy();
      } finally {
        querySpy.mockRestore();
      }
    });
  });
});
