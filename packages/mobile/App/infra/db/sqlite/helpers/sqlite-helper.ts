import { Connection, createConnection, getConnectionManager } from 'typeorm';
import * as entityMap from '~/entities';

const allEntities = Object.values(entityMap);

// this all should just be a createDatabase function
// with the connection object on the Backend object
export class SqliteHelper {

  static client: Connection = null;

  static async forceSync(): Promise<any> {
    if (__DEV__) {
      await SqliteHelper.client.dropDatabase();
    }
    await SqliteHelper.client.synchronize();
  }

  static async connect(): Promise<Connection> {
    if(!this.client) {
      await this.createClient();
    }
    return this.client;
  }

  static async createClient() {
    try {
      this.client = await createConnection({
        type: 'react-native',
        database: 'tamanu',
        location: 'default',
        // logging: __DEV__ ? ['error', 'query', 'schema']: [],
        synchronize: false,
        entities: allEntities,
      });
      await this.forceSync();
    } catch (error) {
      if (error.name === "AlreadyHasActiveConnectionError") {
        const existentConn = getConnectionManager().get("default");
        this.client = existentConn;
      }
    }

    // set up models on the connection object
    // TODO: this should be on backend object
    this.client.models = {};
    Object.entries(entityMap).forEach(([key, value]) => {
      this.client.models[key.replace('Entity', '')] = value;
    });

    if(await this.needsInitialDataPopulation()) {
      await this.populateInitialData();
    }
  }

  // TODO: should be part of app init, not here
  static async needsInitialDataPopulation() {
    const allPrograms = await entityMap.ProgramEntity.find({});
    if(allPrograms.length === 0) {
      return true;
    }

    return false;
  }

  // TODO: should be part of app init, not here
  static async populateInitialData() {
    const { ProgramEntity } = entityMap;

    const programs = [
      { name: "Dummy program 1" },
      { name: "Second dummy program" },
    ];

    await Promise.all(programs.map(data => {
      const p = new ProgramEntity();
      p.name = data.name;
      return p.save();
    }));
  }

}



export const createFakeConnection = () => {
  const path = `/tmp/tamanu-mobile-test-${Math.random()}.db`;

  return createConnection({
    type: 'sqlite',
    database: path,
    logging: __DEV__ ? ['error', 'query', 'schema'] : [],
    synchronize: true,
    entities: allEntities,
  });
}
