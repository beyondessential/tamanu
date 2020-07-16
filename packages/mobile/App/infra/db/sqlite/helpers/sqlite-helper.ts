
import {Connection, createConnection, getConnectionManager } from 'typeorm';
import {Patient} from '../entities/patient';



export const SqliteHelper = {
  client: null as Connection,

  async forceSync(): Promise<any> {
     if (__DEV__) {        
      await SqliteHelper.client.dropDatabase();
      await SqliteHelper.client.synchronize();
     }
  },

  async connect(): Promise<void> {        
    try {                  
      this.client = await createConnection({
        type: 'react-native',
        database: 'tamanu',
        location: 'default',
        logging: __DEV__ ? ['error', 'query', 'schema']: [],
        synchronize: false,
        entities: [Patient],
      });             
      await this.forceSync()            
    } catch (error) {
        if (error.name === "AlreadyHasActiveConnectionError") {
        const existentConn = getConnectionManager().get("default");
        this.client = existentConn        
     } 
    }             
  }
};


export const createFakeConnection = () => {
    return createConnection({
      type: 'sqlite',
      database: './App/infra/db/sqlite/helpers/test.db',
      logging: __DEV__ ? ['error', 'query', 'schema'] : [],
      synchronize: true,
      entities: [Patient],
    });   
}
