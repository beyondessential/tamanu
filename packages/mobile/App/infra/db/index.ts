import { Connection, createConnection, getConnectionManager } from 'typeorm';
import * as modelsMap from '~/entities';
import { BaseModel } from '~/entities/BaseModel';

interface ModelMap {
  [key: string]: BaseModel,
}

const MODELS : ModelMap = Object.entries(modelsMap)
  .reduce((allModelsObject, [modelName, model]) => ({
    [modelName]: model,
    ...allModelsObject,
  }), {});

const MODEL_LIST : BaseModel[] = Object.values(MODELS);

const CONNECTION_CONFIG = {
  type: 'react-native',
  database: 'tamanu',
  location: 'default',
  logging: __DEV__ ? ['error', 'query', 'schema']: [],
  synchronize: false,
  entities: MODEL_LIST,
};

const TEST_CONNECTION_CONFIG = {
  type: 'sqlite',
  database: `/tmp/tamanu-mobile-test-${Math.random()}.db`,
  logging: __DEV__ ? ['error', 'query', 'schema'] : [],
  synchronize: true,
  entities: MODEL_LIST,
};

class DatabaseHelper {

  client: Connection = null;
  models: ModelMap = MODELS;

  async forceSync(): Promise<any> {
    if (true || __DEV__) {
      console.log("drop DB");
      await this.client.dropDatabase();
    }
    await this.client.synchronize();
  }

  async connect(): Promise<Connection> {
    if(!this.client) {
      await this.createClient();
    }
    return this.client;
  }

  async createClient() {
    try {
      this.client = await createConnection(CONNECTION_CONFIG);
      await this.forceSync();
    } catch (error) {
      if (error.name === "AlreadyHasActiveConnectionError") {
        const existentConn = getConnectionManager().get("default");
        this.client = existentConn;
      } else {
        console.error(error);
      }
    }

    if(await this.needsInitialDataPopulation()) {
      await this.populateInitialData();
    }
  }

  async needsInitialDataPopulation() {
    // TODO: this should check against something more reasonable
    const allPrograms = await this.models.Program.find({});
    if(allPrograms.length === 0) {
      return true;
    }

    return false;
  }

  async populateInitialData() {
    const { Program } = this.models;

    console.log("Populating initial database");

    // TODO: should load from a fixture or trigger an initial sync
    const programs = [
      { name: "Dummy program 1" },
      { name: "Second dummy program" },
      { name: "DP3" },
    ];

    await Promise.all(programs.map(data => {
      const p = new Program();
      p.name = data.name;
      return p.save();
    }));
  }

}


export const Database = new DatabaseHelper();
