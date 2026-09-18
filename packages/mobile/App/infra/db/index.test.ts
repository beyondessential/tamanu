import { Database, PLANNER_STATS_REFRESHED_AT_KEY, SPACE_RECLAIM_ATTEMPTED_AT_KEY } from './index';

const deviceInfo = jest.requireMock('react-native-device-info');

const ONE_DAY_MS = 86_400_000;
const MiB = 1024 * 1024;

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

  /**
   * `auto_vacuum` can only go from NONE to INCREMENTAL through a VACUUM, so the cases here run in
   * order: the ones needing a never-vacuumed database first, then the one that does the VACUUM.
   */
  describe('requestSpaceReclaim()', () => {
    const getAttemptFact = () =>
      Database.models.LocalSystemFact.findOne({ where: { key: SPACE_RECLAIM_ATTEMPTED_AT_KEY } });

    const readPragma = async (name: string): Promise<number> => {
      const [row] = await Database.client.query(`PRAGMA ${name};`);
      return Number(row[name]);
    };

    const didRunVacuum = (querySpy: jest.SpyInstance) =>
      querySpy.mock.calls.some(
        ([sql]) => typeof sql === 'string' && sql.trim().toUpperCase() === 'VACUUM;',
      );

    /**
     * Pretend the file is large and mostly free, so the gate opens without actually having to
     * churn hundreds of MiB through the test database. Everything else hits real SQLite.
     */
    const pretendLargeFreelist = (querySpy: jest.SpyInstance, originalQuery: Function) =>
      querySpy.mockImplementation((sql: string, parameters?: any[]) => {
        if (sql === 'PRAGMA page_count;') return Promise.resolve([{ page_count: 200_000 }]);
        if (sql === 'PRAGMA freelist_count;') return Promise.resolve([{ freelist_count: 100_000 }]);
        return originalQuery(sql, parameters);
      });

    beforeEach(async () => {
      const fact = await getAttemptFact();
      if (fact) await fact.remove();
      deviceInfo.getFreeDiskStorage.mockResolvedValue(100 * 1024 * MiB);
    });

    describe('on a database that has never been vacuumed', () => {
      beforeAll(async () => {
        expect(await readPragma('auto_vacuum')).toBe(0);
      });

      it('leaves a database with little to reclaim alone', async () => {
        const querySpy = jest.spyOn(Database.client, 'query');
        try {
          await Database.requestSpaceReclaim();
          expect(didRunVacuum(querySpy)).toBe(false);
        } finally {
          querySpy.mockRestore();
        }
        expect(await getAttemptFact()).toBeFalsy();
        expect(await readPragma('auto_vacuum')).toBe(0);
      });

      it('skips VACUUM when the disk does not have room for the rewrite', async () => {
        deviceInfo.getFreeDiskStorage.mockResolvedValue(100 * MiB);
        jest.spyOn(console, 'warn').mockImplementation(() => {});
        const originalQuery = Database.client.query.bind(Database.client);
        const querySpy = pretendLargeFreelist(jest.spyOn(Database.client, 'query'), originalQuery);
        try {
          await Database.requestSpaceReclaim();
          expect(didRunVacuum(querySpy)).toBe(false);
        } finally {
          querySpy.mockRestore();
        }
        expect(await getAttemptFact()).toBeFalsy();
      });

      it('backs off when a VACUUM was attempted recently', async () => {
        await Database.models.LocalSystemFact.createAndSaveOne({
          key: SPACE_RECLAIM_ATTEMPTED_AT_KEY,
          value: String(Date.now() - ONE_DAY_MS / 2),
        });
        const originalQuery = Database.client.query.bind(Database.client);
        const querySpy = pretendLargeFreelist(jest.spyOn(Database.client, 'query'), originalQuery);
        try {
          await Database.requestSpaceReclaim();
          expect(didRunVacuum(querySpy)).toBe(false);
        } finally {
          querySpy.mockRestore();
        }
      });

      it('runs a one-off VACUUM that switches the database to incremental auto_vacuum', async () => {
        const before = Date.now();
        const originalQuery = Database.client.query.bind(Database.client);
        const querySpy = pretendLargeFreelist(jest.spyOn(Database.client, 'query'), originalQuery);
        try {
          await Database.requestSpaceReclaim();
          expect(didRunVacuum(querySpy)).toBe(true);
        } finally {
          querySpy.mockRestore();
        }
        // INCREMENTAL
        expect(await readPragma('auto_vacuum')).toBe(2);
        const fact = await getAttemptFact();
        expect(parseInt(fact.value, 10)).toBeGreaterThanOrEqual(before);
        expect(Database.maintenanceInProgress).toBeNull();
      });
    });

    describe('on an incremental auto_vacuum database', () => {
      beforeAll(async () => {
        if ((await readPragma('auto_vacuum')) !== 2) {
          await Database.client.query('PRAGMA auto_vacuum = INCREMENTAL;');
          await Database.client.query('VACUUM;');
        }
      });

      it('hands freed pages back to the filesystem', async () => {
        await Database.client.query('CREATE TABLE scratch (padding TEXT)');
        await Database.client.query(
          'INSERT INTO scratch SELECT zeroblob(4000) FROM (WITH RECURSIVE n(i) AS (SELECT 1 UNION ALL SELECT i + 1 FROM n WHERE i < 500) SELECT i FROM n)',
        );
        await Database.client.query('DROP TABLE scratch');
        const freeBefore = await readPragma('freelist_count');
        expect(freeBefore).toBeGreaterThan(0);
        const pagesBefore = await readPragma('page_count');

        await Database.requestSpaceReclaim();

        expect(await readPragma('freelist_count')).toBe(0);
        expect(await readPragma('page_count')).toBe(pagesBefore - freeBefore);
      });

      it('does nothing when there are no free pages', async () => {
        expect(await readPragma('freelist_count')).toBe(0);
        const querySpy = jest.spyOn(Database.client, 'query');
        try {
          await Database.requestSpaceReclaim();
          const vacuumCalls = querySpy.mock.calls.filter(
            ([sql]) => typeof sql === 'string' && sql.includes('incremental_vacuum'),
          );
          expect(vacuumCalls).toHaveLength(0);
        } finally {
          querySpy.mockRestore();
        }
      });
    });

    it('exposes the in-flight run and coalesces overlapping calls', async () => {
      const querySpy = jest.spyOn(Database.client, 'query');
      try {
        const first = Database.requestSpaceReclaim();
        expect(Database.maintenanceInProgress).not.toBeNull();
        await Promise.all([first, Database.requestSpaceReclaim()]);
        const autoVacuumReads = querySpy.mock.calls.filter(
          ([sql]) => sql === 'PRAGMA auto_vacuum;',
        );
        expect(autoVacuumReads).toHaveLength(1);
      } finally {
        querySpy.mockRestore();
      }
      expect(Database.maintenanceInProgress).toBeNull();
    });
  });
});
