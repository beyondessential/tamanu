import { Connection, ConnectionOptions, createConnection, getConnectionManager } from 'typeorm';
import { typeORMDriver, enableSimpleNullHandling } from './opSqliteDriver';
import { DevSettings } from 'react-native';

import { MODELS_ARRAY, MODELS_MAP } from '~/models/modelsMap';
import { clear } from '~/services/config';
import { migrationList } from '~/migrations';

enableSimpleNullHandling();

const LOG_LEVELS = __DEV__
  ? [
      'error' as const,
      // 'query' as const,
      'schema' as const,
    ]
  : [];

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

const getConnectionConfig = (): ConnectionOptions => {
  const isJest = process.env.JEST_WORKER_ID !== undefined;
  if (isJest) {
    return TEST_CONNECTION_CONFIG;
  }
  return CONNECTION_CONFIG;
};

class DatabaseHelper {
  client: Connection = null;

  models = MODELS_MAP;

  syncError = null;

  constructor() {
    MODELS_ARRAY.forEach(m => m.injectAllModels(this.models));
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

      // TODO: this is a hack to fix an issue where models can't retrieve the correct connection in
      // our tests because we're using a mix of typeorm and typeorm/browser
      MODELS_ARRAY.forEach(m => m.useConnection(<any>this.client));
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

  async setDefaultPragma(): Promise<void> {
    try {
      await this.client.query(`PRAGMA journal_mode = TRUNCATE;`);
      await this.client.query(`PRAGMA synchronous = 2;`);
      await this.client.query(`PRAGMA cache_size = -2000;`); // 2MB cache
      await this.client.query(`PRAGMA locking_mode = NORMAL;`);
      await this.client.query(`PRAGMA temp_store = 0;`);
      console.log('Applied default pragma settings');
    } catch (e) {
      console.error('Error applying default pragma settings:', e);
    }
  }

  // WARNING: These settings prioritize performance over data safety
  // We only use for initial sync when data loss is acceptable
  async setUnsafePragma(): Promise<void> {
    try {
      // Disables rollback journal - no transaction rollback or crash recovery
      await this.client.query(`PRAGMA journal_mode = OFF;`); 
      // Disables fsync() - SQLite doesn't wait for OS to confirm disk writes
      await this.client.query(`PRAGMA synchronous = 0;`); 
      // Sets page cache to 1M pages (~1GB with default 1KB pages)
      await this.client.query(`PRAGMA cache_size = 1000000;`); 
      // Locks database exclusively - prevents other processes from accessing
      await this.client.query(`PRAGMA locking_mode = EXCLUSIVE;`); 
      // Stores temporary tables, indices, and views in RAM instead of disk
      await this.client.query(`PRAGMA temp_store = MEMORY;`); 
      console.log('Applied unsafe pragma settings');
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
