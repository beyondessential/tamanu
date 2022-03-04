import {
  Connection,
  createConnection,
  getConnectionManager,
  ConnectionOptions,
} from 'typeorm';
import { DevSettings } from 'react-native';
import { MODELS_ARRAY, MODELS_MAP } from '~/models/modelsMap';
import { clear } from '~/services/config';

const LOG_LEVELS = __DEV__ ? [
  'error' as const,
  // 'query' as const,
  'schema' as const,
] : [];

const CONNECTION_CONFIG = {
  type: 'react-native',
  database: 'tamanu',
  location: 'default',
  logging: LOG_LEVELS,
  synchronize: false,
  entities: MODELS_ARRAY,
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
}

class DatabaseHelper {
  client: Connection = null;

  models = MODELS_MAP;

  syncError = null;

  async forceSync(): Promise<any> {
    try {
      console.log("Synchronising database schema to model definitions");
      if (this.syncError) {
        console.log("Last seen error from schema sync was:", this.syncError);
      }

      // Turn FK constraints off to allow schema changes during migration
      // (sqlite has to fully delete and recreate a table to alter a column;
      // it preserves data fine but if any other tables have a FK constraint 
      // pointed to the table being altered, the query will fail)
      await this.client.query(`PRAGMA foreign_keys = OFF;`);

      await this.client.synchronize();
      console.log("Synchronising database schema: OK");
      this.syncError = null;
    } catch(e) {
      this.syncError = e;
      console.log("Error encountered during schema sync:", this.syncError);
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
    } catch(e) {
      console.error(e);
    }
  });
}