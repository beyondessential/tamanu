import { DevSettings } from 'react-native';
import { getFreeDiskStorage } from 'react-native-device-info';
import { typeORMDriver } from 'react-native-quick-sqlite';
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

const LOG_LEVELS = __DEV__ ? (['error', /* 'query', */ 'schema'] as const) : ([] as const);

const CONNECTION_CONFIG = {
  type: 'react-native',
  database: 'tamanu',
  location: 'default',
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

export const PLANNER_STATS_REFRESHED_AT_KEY = 'plannerStatsLastRefreshedAt';
export const SPACE_RECLAIM_ATTEMPTED_AT_KEY = 'spaceReclaimLastAttemptedAt';

const MEBIBYTE = 1_048_576;

/** 1 day */
const PLANNER_STATS_REFRESH_INTERVAL_MS = 86_400_000;

/**
 * 24 hours. Safe to retry if VACUUM fails (e.g. `SQLITE_FULL` killed by OS) but not worth retrying
 * on every backgrounding.
 */
const SPACE_RECLAIM_RETRY_INTERVAL_MS = 86_400_000;

/**
 * A full VACUUM rewrites the whole file, so only bother when there’s going to be meaningful
 * benefit: at least 64 MiB free, *and* at least {@link VACUUM_MIN_FREE_FRACTION} of the file.
 */
const VACUUM_MIN_FREE_BYTES = 64 * MEBIBYTE;
const VACUUM_MIN_FREE_FRACTION = 0.1;

/**
 * VACUUM builds the compacted copy in a temp file, then copies it back under the rollback journal,
 * so it can transiently need about twice the file size on disk. Leave some headroom on top of that.
 */
const VACUUM_DISK_HEADROOM_BYTES = 256 * MEBIBYTE;

/** Pages to hand back to the filesystem per background event: bounded so it stays cheap. */
const INCREMENTAL_VACUUM_MAX_PAGES = 4096;

/** @see https://sqlite.org/pragma.html#pragma_auto_vacuum */
const AUTO_VACUUM_NONE = 0;
const AUTO_VACUUM_INCREMENTAL = 2;

const getConnectionConfig = (): ConnectionOptions => {
  const isJest = process.env.JEST_WORKER_ID !== undefined;
  return isJest ? TEST_CONNECTION_CONFIG : CONNECTION_CONFIG;
};

function formatMiB(bytes: number): string {
  return `${(bytes / 1_048_576).toLocaleString('en-AU', { maximumFractionDigits: 1 })} MiB`;
}

class DatabaseHelper {
  private isOptimizing = false;

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
      await this.client.query(`PRAGMA journal_mode = TRUNCATE;`);
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
      const planned = await this.client.query<{ [column: string]: string }[]>(
        // 0x00001 (debugging mode) + 0x00002 (run ANALYZE on tables that might benefit).
        'PRAGMA optimize(0x00003);',
      );
      const statements = planned.map(row => Object.values(row)[0]);
      console.log(`PRAGMA optimize will run: ${statements.join('; ') || 'nothing'}`);
      await this.client.query('PRAGMA optimize;');
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
    if (this.isOptimizing) return;
    this.isOptimizing = true;
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
      this.isOptimizing = false;
    }
  }

  private async readPragmaNumber(
    name: 'auto_vacuum' | 'freelist_count' | 'page_count' | 'page_size',
  ): Promise<number> {
    const [row] = await this.client.query(`PRAGMA ${name};`);
    return Number.parseInt(row[name], 10);
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
      switch (autoVacuum) {
        case AUTO_VACUUM_NONE:
          await this.fullVacuumIfWorthwhile();
          break;
        case AUTO_VACUUM_INCREMENTAL:
          await this.incrementalVacuum();
          break;
        default:
          // FULL: SQLite already truncates on every commit, nothing to do
          break;
      }
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
      await this.client.query('PRAGMA journal_mode = OFF;');
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
