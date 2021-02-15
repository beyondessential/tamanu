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
  // 'error',
  // 'query', 
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
  database: `/tmp/tamanu-mobile-test-${Math.random()}.db`,
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

  async forceSync(): Promise<any> {
    await this.client.synchronize();
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
