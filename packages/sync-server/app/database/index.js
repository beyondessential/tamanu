import config from 'config';

import { MongoWrapper } from './mongoWrapper';
import { log } from '../logging';

let existingConnection = null;

export function initDatabase({ testMode = false }) {
  // connect to database
  const { name, type, path } = config.db;

  if (existingConnection) {
    return existingConnection;
  }

  if (type === 'mongodb') {
    log.info(`Connecting to mongo database ${name} at ${path}...`);
    const store = new MongoWrapper(path, name, testMode);
    existingConnection = {
      store,
    };
    return existingConnection;
  }
  throw new Error(`Unknown database type: ${type}`);
}
