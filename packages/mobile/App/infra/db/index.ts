import {
  Connection,
  createConnection,
  getConnectionManager,
  ConnectionOptions,
} from 'typeorm';
import { DevSettings } from 'react-native';
import * as modelsMap from '~/models';
import { BaseModel } from '~/models/BaseModel';

export interface ModelMap {
  [key: string]: BaseModel;
}

const MODELS: ModelMap = Object.entries(modelsMap).reduce(
  (allModelsObject, [modelName, model]) => ({
    [modelName]: model,
    ...allModelsObject,
  }),
  {},
);

const MODEL_LIST: BaseModel[] = Object.values(MODELS);

const CONNECTION_CONFIG = {
  type: 'react-native',
  database: 'tamanu',
  location: 'default',
  logging: __DEV__ ? ['error', 'query', 'schema'] : [],
  synchronize: false,
  entities: MODEL_LIST,
};

// const TEST_CONNECTION_CONFIG = {
//   type: 'sqlite',
//   database: `/tmp/tamanu-mobile-test-${Math.random()}.db`,
//   logging: __DEV__ ? ['error', 'query', 'schema'] : [],
//   synchronize: true,
//   entities: MODEL_LIST,
// };

class DatabaseHelper {
  client: Connection = null;

  models: ModelMap = MODELS;

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
    Database.client.dropDatabase();
    DevSettings.reload();
  });
}
