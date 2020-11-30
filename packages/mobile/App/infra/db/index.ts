import {
  Connection,
  createConnection,
  getConnectionManager,
  ConnectionOptions,
} from 'typeorm';
import { DevSettings } from 'react-native';
import { MODELS_ARRAY, MODELS_MAP } from '~/models/modelsMap';
import { BaseModel } from '~/models/BaseModel';
import { clear } from '~/services/config';
const LOG_LEVELS = __DEV__ ? [
  // 'error',
  // 'query', 
  'schema',
] : [];

const CONNECTION_CONFIG = {
  type: 'react-native',
  database: 'tamanu',
  location: 'default',
  logging: LOG_LEVELS,
  synchronize: false,
  entities: MODELS_ARRAY,
};

const TEST_CONNECTION_CONFIG = {
  type: 'sqlite',
  database: `/tmp/tamanu-mobile-test-${Math.random()}.db`,
  logging: LOG_LEVELS,
  synchronize: true,
  entities: MODELS_ARRAY,
};

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
      this.client = await createConnection(CONNECTION_CONFIG);
      await this.forceSync();
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
