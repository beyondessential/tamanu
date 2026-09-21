import { DevSettings } from 'react-native';
import { getFreeDiskStorage } from 'react-native-device-info';
import { NitroSQLite, typeORMDriver } from 'react-native-nitro-sqlite';
import {
  type Connection,
  type ConnectionOptions,
  createConnection,
  getConnectionManager,
} from 'typeorm';

import { migrationList } from '~/migrations';
import { MODELS_ARRAY, MODELS_MAP } from '~/models/modelsMap';
import { clear } from '~/services/config';
import getCacheSizeKiB from './cacheSize';
import { SNAPSHOT_DB_NAME, SNAPSHOT_SCHEMA } from './snapshotDatabase';

const LOG_LEVELS = __DEV__ ? (['error', /* 'query', */ 'schema'] as const) : ([] as const);

const DB_NAME = 'tamanu';
/** Subdirectory of the app’s files directory that `react-native-nitro-sqlite` puts the files in */
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
export const SPACE_RECLAIM_ATTEMPTED_AT_KEY = 'spaceReclaimLastAttemptedAt';

/** 1 day */
const PLANNER_STATS_REFRESH_INTERVAL_MS = 86_400_000;

/**
 * 24 hours. A full VACUUM that fails (typically `SQLITE_FULL`, or the OS killing the app before it
 * commits) is safe to retry, but not worth retrying on every backgrounding.
 */
const SPACE_RECLAIM_RETRY_INTERVAL_MS = 86_400_000;

/**
 * A full VACUUM rewrites the whole file, so only bother when there’s a meaningful amount to get
 * back: at least this many bytes free, *and* at least {@link VACUUM_MIN_FREE_FRACTION} of the file.
 */
const VACUUM_MIN_FREE_BYTES = 64 * 1024 * 1024;
const VACUUM_MIN_FREE_FRACTION = 0.1;

/**
 * VACUUM builds the compacted copy in a temp file, then copies it back under the rollback journal,
 * so it can transiently need about twice the file size on disk. Leave some headroom on top of that.
 */
const VACUUM_DISK_HEADROOM_BYTES = 256 * 1024 * 1024;

/** Pages to hand back to the filesystem per background event: bounded so it stays cheap. */
const INCREMENTAL_VACUUM_MAX_PAGES = 4096;

/** @see https://sqlite.org/pragma.html#pragma_auto_vacuum */
const AUTO_VACUUM_NONE = 0;
const AUTO_VACUUM_INCREMENTAL = 2;

const isJest = (): boolean => process.env.JEST_WORKER_ID !== undefined;

const getConnectionConfig = (): ConnectionOptions =>
  isJest() ? TEST_CONNECTION_CONFIG : CONNECTION_CONFIG;

function formatMiB(bytes: number): string {
  return `${(bytes / 1_048_576).toLocaleString('en-AU', { maximumFractionDigits: 1 })} MiB`;
}

class DatabaseHelper {
  private isAnalyzing = false;

  /**
   * Resolves when the currently running space reclamation (possibly a long VACUUM) finishes.
   * `null` when none is running. Never rejects.
   */
  maintenanceInProgress: Promise<void> | null = null;

  client: Connection = null;

  models = MODELS_MAP;

  syncError = null;

  constructor() {
    for (const m of MODELS_ARRAY) m.injectAllModels(this.models);
  }

  async forceSync(): Promise<void> {
    try {
      console.log('Updating database schema');
      if (this.syncError) {
        console.log('Last seen error from schema sync was:', this.syncError);
      }

      // Turn FK constraints off to allow schema changes during migration
      // (sqlite has to fully delete and recreate a table to alter a column;
      // it preserves data fine but if any other tables have a FK constraint
      // pointed to the table being altered, the query will fail)
      await this.client.query('PRAGMA foreign_keys = OFF;');

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
      await this.client.query('PRAGMA foreign_keys = ON;');
    }
  }

  async connect(): Promise<Connection> {
    if (!this.client) {
      await this.createClient();
    }
    return this.client;
  }

  async createClient(): Promise<void> {
    try {
      this.client = await createConnection(getConnectionConfig());
      await this.setAutoVacuumForFreshDatabase();
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
   * empty file. Only call it when no transaction is open on the connection, since SQLite refuses to
   * `ATTACH` or `DETACH` inside one: at connect, when sync finds it missing, and to recover from a
   * corrupt snapshot file (it has no journal, so a kill mid-write can leave one).
   * @see {@link SNAPSHOT_SCHEMA}
   */
  async resetSnapshotDatabase(): Promise<void> {
    await this.detachSnapshotDatabase();
    this.deleteSnapshotDatabaseFile();
    const snapshotDbPath = await this.getSnapshotDbPath();
    await this.client.query(`ATTACH DATABASE ? AS ${SNAPSHOT_SCHEMA}`, [snapshotDbPath]);
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

  async isSnapshotDatabaseAttached(): Promise<boolean> {
    const schemas = await this.client.query<{ name: string }[]>('PRAGMA database_list;');
    return schemas.some(schema => schema.name === SNAPSHOT_SCHEMA);
  }

  /** On device, a sibling of the main database file, which is where `NitroSQLite.native.drop` looks */
  private async getSnapshotDbPath(): Promise<string> {
    if (isJest()) return getTestSnapshotDbPath();
    const schemas =
      await this.client.query<{ name: string; file: string }[]>('PRAGMA database_list;');
    const mainDbPath = schemas.find(schema => schema.name === 'main').file;
    const mainDbDirectory = mainDbPath.slice(0, mainDbPath.lastIndexOf('/') + 1);
    return `${mainDbDirectory}${SNAPSHOT_DB_NAME}`;
  }

  private async detachSnapshotDatabase(): Promise<void> {
    // Not attached at connect, nor if a previous attach failed
    if (!(await this.isSnapshotDatabaseAttached())) return;
    await this.client.query(`DETACH DATABASE ${SNAPSHOT_SCHEMA}`);
  }

  private deleteSnapshotDatabaseFile(): void {
    try {
      // Through `native`: the methods of the spread `NitroSQLite` object are missing at runtime,
      // because the hybrid object they’re spread from keeps them on its prototype
      NitroSQLite.native.drop(SNAPSHOT_DB_NAME, DB_LOCATION);
    } catch (e) {
      // No file yet on a fresh install. Swallow expected error.
      if (e?.message?.includes('Database file not found')) return;
      console.warn('Error deleting snapshot database file:', e);
    }
  }

  /**
   * Only takes effect while the file has no tables yet, i.e. on a fresh install before the
   * first-time-setup migration runs. On an existing database it’s a no-op until a VACUUM, which
   * {@link requestSpaceReclaim} takes care of.
   */
  private async setAutoVacuumForFreshDatabase(): Promise<void> {
    try {
      await this.client.query('PRAGMA auto_vacuum = INCREMENTAL;');
    } catch (e) {
      console.error('Error setting auto_vacuum:', e);
    }
  }

  async setDefaultPragma(): Promise<void> {
    try {
      // Qualified: an unqualified journal_mode applies to every attached database, including the
      // snapshot database, which deliberately runs without a journal
      await this.client.query('PRAGMA main.journal_mode = TRUNCATE;');
      await this.client.query('PRAGMA synchronous = 2;');
      const cacheSizeKiB = await getCacheSizeKiB();
      await this.client.query(`PRAGMA cache_size = -${cacheSizeKiB};`);
      await this.client.query('PRAGMA locking_mode = NORMAL;');
      await this.client.query('PRAGMA temp_store = 0;');
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
      // Qualified: an unqualified optimize covers every attached database, including the snapshot
      // database
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

  private async readPragmaNumber(name: string): Promise<number> {
    const [row] = await this.client.query(`PRAGMA ${name};`);
    return Number(row[name]);
  }

  /**
   * Hands free pages in the main database back to the filesystem. Best-effort, never throws, and
   * meant for when the app is backgrounded: a full VACUUM can take minutes on a large database
   * and holds the write lock for the duration.
   *
   * - Databases created before `auto_vacuum` was set (the overwhelming majority of installs) can
   *   only shrink via a full VACUUM. That one-off VACUUM also switches them to INCREMENTAL, so it
   *   only ever runs once per device, and only when there’s enough free space to be worth it and
   *   enough disk to do it safely.
   * - INCREMENTAL databases release a bounded number of pages per call via `incremental_vacuum`.
   *
   * Exposed as {@link maintenanceInProgress} so a sync starting mid-VACUUM can wait for it.
   */
  async requestSpaceReclaim(): Promise<void> {
    // Prevent background → foreground → background cycle from causing overlapping calls
    if (this.maintenanceInProgress) return;
    this.maintenanceInProgress = this.reclaimSpace();
    try {
      await this.maintenanceInProgress;
    } finally {
      this.maintenanceInProgress = null;
    }
  }

  private async reclaimSpace(): Promise<void> {
    try {
      const autoVacuum = await this.readPragmaNumber('auto_vacuum');
      if (autoVacuum === AUTO_VACUUM_INCREMENTAL) {
        await this.incrementalVacuum();
      } else if (autoVacuum === AUTO_VACUUM_NONE) {
        await this.fullVacuumIfWorthwhile();
      }
      // FULL: SQLite already truncates on every commit, nothing to do
    } catch (e) {
      // Best-effort maintenance: not worth falling over some free pages
      console.error('Error reclaiming database space:', e);
    }
  }

  private async incrementalVacuum(): Promise<void> {
    const freelistCount = await this.readPragmaNumber('freelist_count');
    if (freelistCount === 0) return;
    const pageSize = await this.readPragmaNumber('page_size');
    const pagesToFree = Math.min(freelistCount, INCREMENTAL_VACUUM_MAX_PAGES);
    const start = performance.now();
    await this.client.query(`PRAGMA incremental_vacuum(${pagesToFree});`);
    console.log(
      `Incremental vacuum released ${formatMiB(pagesToFree * pageSize)} in ${performance.now() - start}ms (${freelistCount - pagesToFree} free pages remain)`,
    );
  }

  private async fullVacuumIfWorthwhile(): Promise<void> {
    const pageSize = await this.readPragmaNumber('page_size');
    const pageCount = await this.readPragmaNumber('page_count');
    const freelistCount = await this.readPragmaNumber('freelist_count');
    const fileBytes = pageCount * pageSize;
    const freeBytes = freelistCount * pageSize;
    if (freeBytes < Math.max(VACUUM_MIN_FREE_BYTES, fileBytes * VACUUM_MIN_FREE_FRACTION)) {
      return;
    }

    const fact = await this.models.LocalSystemFact.findOne({
      select: ['value'],
      where: { key: SPACE_RECLAIM_ATTEMPTED_AT_KEY },
    });
    const lastAttempt = Number.parseInt(fact?.value, 10);
    if (
      Number.isFinite(lastAttempt) &&
      Date.now() - lastAttempt < SPACE_RECLAIM_RETRY_INTERVAL_MS
    ) {
      return;
    }

    const freeDiskBytes = await getFreeDiskStorage();
    const requiredDiskBytes = 2 * fileBytes + VACUUM_DISK_HEADROOM_BYTES;
    if (!Number.isFinite(freeDiskBytes) || freeDiskBytes < requiredDiskBytes) {
      console.warn(
        `Skipping VACUUM: ${formatMiB(freeBytes)} reclaimable but only ${formatMiB(freeDiskBytes)} free on disk (need ${formatMiB(requiredDiskBytes)})`,
      );
      return;
    }

    // Recorded up front so an attempt that doesn’t finish (SQLITE_FULL, or the OS killing the
    // backgrounded app) still counts towards the back-off.
    await this.models.LocalSystemFact.upsert(
      { key: SPACE_RECLAIM_ATTEMPTED_AT_KEY, value: Date.now().toString() },
      ['key'],
    );

    const start = performance.now();
    console.log(`Starting VACUUM to reclaim ${formatMiB(freeBytes)} of ${formatMiB(fileBytes)}`);
    // Setting auto_vacuum before VACUUM is the only way to change it on a populated database; from
    // here on, space is handed back incrementally instead.
    await this.client.query('PRAGMA auto_vacuum = INCREMENTAL;');
    await this.client.query('VACUUM;');
    const pageCountAfter = await this.readPragmaNumber('page_count');
    console.log(
      `VACUUM done in ${performance.now() - start}ms, reclaimed ${formatMiB((pageCount - pageCountAfter) * pageSize)}`,
    );
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
  DevSettings.addMenuItem('DB schema sync', async () => {
    try {
      await Database.forceSync();
    } catch (e) {
      console.error(e);
    }
  });
  // Add a dev menu item to drop database and rerun migrations
  DevSettings.addMenuItem('Drop database', async () => {
    await Database.client.dropDatabase();
    await Database.forceSync();
    await clear();
    DevSettings.reload();
  });
}
