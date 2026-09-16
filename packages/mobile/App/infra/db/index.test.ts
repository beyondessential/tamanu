import { Database, PLANNER_STATS_REFRESHED_AT_KEY, SPACE_RECLAIM_ATTEMPTED_AT_KEY } from './index';
import { SNAPSHOT_SCHEMA, SNAPSHOT_TABLE } from './snapshotDatabase';

const deviceInfo = jest.requireMock('react-native-device-info');

const NINETY_MIN_MS = 5_400_000;
const ONE_DAY_MS = 86_400_000;
const MiB = 1024 * 1024;

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
        value: String(Date.now() - NINETY_MIN_MS / 2),
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
      const staleTimestamp = String(Date.now() - NINETY_MIN_MS - 60_000);
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

    it('coalesces overlapping calls so ANALYZE only runs once', async () => {
      const querySpy = jest.spyOn(Database.client, 'query');

      try {
        await Promise.all([
          Database.requestQueryPlannerStatsRefresh(),
          Database.requestQueryPlannerStatsRefresh(),
        ]);
        const analyzeCalls = querySpy.mock.calls.filter(
          ([sql]) => typeof sql === 'string' && sql.toUpperCase().includes('ANALYZE MAIN;'),
        );
        expect(analyzeCalls).toHaveLength(1);
      } finally {
        querySpy.mockRestore();
      }
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
  describe('resetSnapshotDatabase()', () => {
    const readSnapshotPragma = async (name: string) => {
      const [row] = await Database.client.query(`PRAGMA ${SNAPSHOT_SCHEMA}.${name};`);
      return row[name];
    };

    it('attaches an empty snapshot database with staging-friendly pragmas at connect', async () => {
      const schemas: { name: string }[] = await Database.client.query('PRAGMA database_list;');
      expect(schemas.map(({ name }) => name)).toContain(SNAPSHOT_SCHEMA);

      const tables = await Database.client.query(
        `SELECT name FROM ${SNAPSHOT_SCHEMA}.sqlite_master WHERE type = 'table'`,
      );
      expect(tables).toHaveLength(0);
      expect(await readSnapshotPragma('journal_mode')).toBe('off');
      expect(await readSnapshotPragma('synchronous')).toBe(0);
      // FULL
      expect(await readSnapshotPragma('auto_vacuum')).toBe(1);
      expect(await readSnapshotPragma('page_size')).toBe(16384);
    });

    it('lets the snapshot table be written and read through the main connection', async () => {
      await Database.client.query(
        `CREATE TABLE ${SNAPSHOT_TABLE} (id INTEGER PRIMARY KEY AUTOINCREMENT, data TEXT NOT NULL)`,
      );
      await Database.client.query(`INSERT INTO ${SNAPSHOT_TABLE} (data) VALUES (?)`, ['["a"]']);

      const rows = await Database.client.query(`SELECT id, data FROM ${SNAPSHOT_TABLE}`);
      expect(rows).toEqual([{ id: 1, data: '["a"]' }]);
    });

    it('starts over from an empty file when reset again', async () => {
      await Database.resetSnapshotDatabase();

      const tables = await Database.client.query(
        `SELECT name FROM ${SNAPSHOT_SCHEMA}.sqlite_master WHERE type = 'table'`,
      );
      expect(tables).toHaveLength(0);
      expect(await readSnapshotPragma('journal_mode')).toBe('off');
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
