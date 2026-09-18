import {
  type Connection,
  type ConnectionOptions,
  createConnection,
  getConnectionManager,
} from 'typeorm';
import { QuickSQLite, typeORMDriver } from 'react-native-quick-sqlite';
import { DevSettings } from 'react-native';

import { MODELS_ARRAY, MODELS_MAP } from '~/models/modelsMap';
import { clear } from '~/services/config';
import { migrationList } from '~/migrations';
import getCacheSizeKiB from './cacheSize';
import { SNAPSHOT_DB_NAME, SNAPSHOT_SCHEMA } from './snapshotDatabase';

const LOG_LEVELS = __DEV__ ? (['error', /* 'query', */ 'schema'] as const) : ([] as const);

const DB_NAME = 'tamanu';
/** Subdirectory of the app’s files directory that `react-native-quick-sqlite` puts the files in */
const DB_LOCATION = 'default';

const CONNECTION_CONFIG = {
  type: 'react-native',
  database: DB_NAME,
  location: DB_LOCATION,
  driver: typeORMDriver,
  logging: LOG_LEVELS,
  synchronize: false,
  entities: MODELS_ARRAY,
  migrations: migrationList,
} as const;

const TEST_CONNECTION_CONFIG = {
  type: 'sqlite',
  database: `/tmp/tamanu-mobile-test-${Date.now()}-${process.env.JEST_WORKER_ID}.db`,
  logging: false,
  // logging: LOG_LEVELS,
  synchronize: true,
  entities: MODELS_ARRAY,
} as const;

/** Fresh file per call: the test path never deletes files, so a reset has to move to a new one */
const getTestSnapshotDbPath = (): string =>
  `/tmp/tamanu-mobile-test-snapshot-${Date.now()}-${process.env.JEST_WORKER_ID}-${Math.random().toString(36).slice(2)}.db`;

export const PLANNER_STATS_REFRESHED_AT_KEY = 'plannerStatsLastRefreshedAt';

/** 1 day */
const PLANNER_STATS_REFRESH_INTERVAL_MS = 86_400_000;

const isJest = (): boolean => process.env.JEST_WORKER_ID !== undefined;

const getConnectionConfig = (): ConnectionOptions => {
  if (isJest()) {
    return TEST_CONNECTION_CONFIG;
  }
  return CONNECTION_CONFIG;
};

class DatabaseHelper {
  private isAnalyzing = false;

  client: Connection = null;

  models = MODELS_MAP;

  syncError = null;

  constructor() {
    for (const m of MODELS_ARRAY) m.injectAllModels(this.models);
  }

  async forceSync(): Promise<any> {
    try {
      console.log('Updating database schema');
      if (this.syncError) {
        console.log('Last seen error from schema sync was:', this.syncError);
      }

      // Turn FK constraints off to allow schema changes during migration
      // (sqlite has to fully delete and recreate a table to alter a column;
      // it preserves data fine but if any other tables have a FK constraint
      // pointed to the table being altered, the query will fail)
      await this.client.query(`PRAGMA foreign_keys = OFF;`);

      // TODO: Remove this once all supported deployments are >= v1.21.0
      // Get the list of tables named 'migrations' and tables named 'patient'
      const migrationsTable = await this.client.query(
        "SELECT * FROM sqlite_master WHERE type='table' AND name='migrations';",
      );
      const patientTable = await this.client.query(
        "SELECT * FROM sqlite_master WHERE type='table' AND name='patients';",
      );

      if (!migrationsTable.length && patientTable.length) {
        // If this device has already been running an earlier version of Tamanu
        // (i.e. the patients table exists)
        // but we've never run migrations on this device
        // (i.e. the migrations table does not exist
        // attempt a synchronize
        console.log('No migrations table found, running final sync from models');
        await this.client.synchronize();
      }
      await this.client.runMigrations();
      console.log('Migrations run: OK');
      this.syncError = null;
    } catch (e) {
      this.syncError = e;
      console.log('Error encountered during schema sync:', this.syncError);
      throw e;
    } finally {
      // Restore FK constraint checks once everything is done
      await this.client.query(`PRAGMA foreign_keys = ON;`);
    }
  }

  async connect(): Promise<Connection> {
    if (!this.client) {
      await this.createClient();
    }
    return this.client;
  }

  async createClient(): Promise<ConnectionOptions | void> {
    try {
      this.client = await createConnection(getConnectionConfig());
      await this.forceSync();
    } catch (error) {
      if (error.name === 'AlreadyHasActiveConnectionError') {
        const existentConn = getConnectionManager().get('default');
        this.client = existentConn;
      } else {
        console.error(error);
      }
    }
    await this.setDefaultPragma();
    try {
      await this.resetSnapshotDatabase();
    } catch (e) {
      // Incremental sync will try again (see `dropSnapshotTable`); don’t block startup on it
      console.error('Error attaching snapshot database:', e);
    }
  }

  /**
   * (Re)attaches the throwaway file that incremental sync stages its snapshot in, starting from an
   * empty file. Safe to call whenever no transaction is open on the connection: at connect, and to
   * recover from a corrupt snapshot file (it has no journal, so a kill mid-write can leave one).
   * @see {@link SNAPSHOT_SCHEMA}
   */
  async resetSnapshotDatabase(): Promise<void> {
    await this.detachSnapshotDatabase();
    this.deleteSnapshotDatabaseFile();
    if (isJest()) {
      await this.client.query(`ATTACH DATABASE ? AS ${SNAPSHOT_SCHEMA}`, [getTestSnapshotDbPath()]);
    } else {
      QuickSQLite.attach(DB_NAME, SNAPSHOT_DB_NAME, SNAPSHOT_SCHEMA, DB_LOCATION);
    }
    // page_size and auto_vacuum only apply while the file is still empty, hence the delete above.
    // Snapshot rows are large JSON blobs, so bigger pages mean far fewer overflow pages to chase.
    await this.client.query(`PRAGMA ${SNAPSHOT_SCHEMA}.page_size = 16384;`);
    // Staging only ever appends then drops, so FULL costs nothing during a sync and makes
    // `DROP TABLE` truncate the file at commit.
    await this.client.query(`PRAGMA ${SNAPSHOT_SCHEMA}.auto_vacuum = FULL;`);
    // The contents are rebuilt from scratch every sync, so crash safety buys nothing here; skip
    // the journal and the fsync per staged batch entirely.
    await this.client.query(`PRAGMA ${SNAPSHOT_SCHEMA}.journal_mode = OFF;`);
    await this.client.query(`PRAGMA ${SNAPSHOT_SCHEMA}.synchronous = OFF;`);
  }

  private async detachSnapshotDatabase(): Promise<void> {
    try {
      if (isJest()) {
        await this.client.query(`DETACH DATABASE ${SNAPSHOT_SCHEMA}`);
      } else {
        QuickSQLite.detach(DB_NAME, SNAPSHOT_SCHEMA);
      }
    } catch {
      // Not attached (yet), which is the normal case at connect
    }
  }

  private deleteSnapshotDatabaseFile(): void {
    // The Jest file is a per-run temp file like the test database itself; nothing to clean up
    if (isJest()) return;
    try {
      QuickSQLite.delete(SNAPSHOT_DB_NAME, DB_LOCATION);
    } catch (e) {
      console.warn('Error deleting snapshot database file:', e);
    }
  }

  async setDefaultPragma(): Promise<void> {
    try {
      // Qualified: an unqualified journal_mode applies to every attached database, including the
      // snapshot database, which deliberately runs without a journal
      await this.client.query(`PRAGMA main.journal_mode = TRUNCATE;`);
      await this.client.query(`PRAGMA synchronous = 2;`);
      const cacheSizeKiB = await getCacheSizeKiB();
      await this.client.query(`PRAGMA cache_size = -${cacheSizeKiB};`);
      await this.client.query(`PRAGMA locking_mode = NORMAL;`);
      await this.client.query(`PRAGMA temp_store = 0;`);
      console.log(`Applied default pragma settings (cache_size ${cacheSizeKiB} KiB)`);
    } catch (e) {
      console.error('Error applying default pragma settings:', e);
    }
  }

  /**
   * @see https://sqlite.org/pragma.html#pragma_optimize
   * @returns Whether the optimisation succeeded
   */
  private async runPragmaOptimize(): Promise<boolean> {
    const start = performance.now();
    try {
      // Our SQLite (3.39) would otherwise run a full ANALYZE on each table `PRAGMA optimize` picks,
      // which can take an unreasonably long time. Pinning to SQLite 3.46+’s default of 400.
      await this.client.query('PRAGMA analysis_limit = 400;');
      // Qualified: an unqualified optimize covers every attached database, including the snapshot
      const planned = await this.client.query<{ [column: string]: string }[]>(
        // 0x00001 (debugging mode) + 0x00002 (run ANALYZE on tables that might benefit).
        'PRAGMA main.optimize(0x00003);',
      );
      const statements = planned.map(row => Object.values(row)[0]);
      console.log(`PRAGMA optimize will run: ${statements.join('; ') || 'nothing'}`);
      await this.client.query('PRAGMA main.optimize;');
      console.log(`PRAGMA optimize done in ${performance.now() - start}ms`);
      return true;
    } catch (e) {
      console.error(`PRAGMA optimize failed after ${performance.now() - start}ms:`, e);
      return false;
    }
  }

  /**
   * Throttled to every {@link PLANNER_STATS_REFRESH_INTERVAL_MS}, so can be called
   * opportunistically. A failed run is not recorded, so it is retried at the next call.
   */
  async requestPragmaOptimize(): Promise<void> {
    // Prevent background → foreground → background cycle from causing overlapping calls
    if (this.isAnalyzing) return;
    this.isAnalyzing = true;
    try {
      const fact = await this.models.LocalSystemFact.findOne({
        select: ['value'],
        where: { key: PLANNER_STATS_REFRESHED_AT_KEY },
      });
      const lastRefresh = Number.parseInt(fact?.value, 10);
      if (
        Number.isFinite(lastRefresh) &&
        Date.now() - lastRefresh < PLANNER_STATS_REFRESH_INTERVAL_MS
      ) {
        return;
      }

      const succeeded = await this.runPragmaOptimize();
      if (!succeeded) return;

      await this.models.LocalSystemFact.upsert(
        { key: PLANNER_STATS_REFRESHED_AT_KEY, value: Date.now().toString() },
        ['key'],
      );
    } catch (e) {
      // Best-effort maintenance: not worth falling over stale `sqlite_stat1`
      console.error('Error checking/recording query planner stats refresh:', e);
    } finally {
      this.isAnalyzing = false;
    }
  }

  // WARNING: These settings prioritize performance over data safety
  // We only use for initial sync when data loss is acceptable
  async setUnsafePragma(): Promise<void> {
    try {
      // Disables rollback journal - no transaction rollback or crash recovery
      await this.client.query('PRAGMA main.journal_mode = OFF;');
      // Disables fsync() - SQLite doesn't wait for OS to confirm disk writes
      await this.client.query('PRAGMA synchronous = 0;');
      const cacheSizeKiB = await getCacheSizeKiB(true);
      await this.client.query(`PRAGMA cache_size = -${cacheSizeKiB};`);
      // Locks database exclusively - prevents other processes from accessing
      await this.client.query('PRAGMA locking_mode = EXCLUSIVE;');
      // Stores temporary tables, indices, and views in RAM instead of disk
      await this.client.query('PRAGMA temp_store = MEMORY;');
      console.log(`Applied unsafe pragma settings (cache_size ${cacheSizeKiB} KiB)`);
    } catch (e) {
      console.error('Error applying unsafe pragma settings:', e);
    }
  }
}

export const Database = new DatabaseHelper();

if (__DEV__) {
  DevSettings.addMenuItem('Clear database', async () => {
    await clear();
    DevSettings.reload();
  });
}

if (__DEV__) {
  DevSettings.addMenuItem('DB schema sync', async () => {
    try {
      await Database.forceSync();
    } catch (e) {
      console.error(e);
    }
  });
}

// Add a dev menu item to drop database and rerun migrations
if (__DEV__) {
  DevSettings.addMenuItem('Drop database', async () => {
    await Database.client.dropDatabase();
    await Database.forceSync();
    await clear();
    DevSettings.reload();
  });
}
