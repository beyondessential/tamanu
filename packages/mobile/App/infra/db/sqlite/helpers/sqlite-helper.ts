import { Connection, createConnection } from 'typeorm/browser'
import { Patient } from '../entities/patient'

export const SqliteHelper = {
    client: null as Connection,

    async connect(): Promise<void> {
        if (this.client === null) {
            this.client = await createConnection({
                type: 'react-native',
                database: 'tamanu',
                location: 'default',
                logging: __DEV__ ? ['error', 'query', 'schema'] : [],
                synchronize: true,
                entities: [
                Patient
      ]
    });
        }        
    }
}