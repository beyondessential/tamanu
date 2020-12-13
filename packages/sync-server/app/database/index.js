import config from 'config';

import { MongoWrapper } from './mongoWrapper';
import { log } from '../logging';

let existingConnection = null;

export function initDatabase({ testMode = false }) {
  // connect to database
  const { name, path } = config.db;

  if (existingConnection) {
    return existingConnection;
  }

  log.info(`Connecting to mongo database ${name} at ${path}...`);
  const store = new MongoWrapper(path, name, testMode);
  existingConnection = {
    store,
  };
  return existingConnection;
}
