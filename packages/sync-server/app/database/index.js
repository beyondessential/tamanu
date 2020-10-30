import config from 'config';

import { NedbWrapper } from './nedbWrapper';
import { MongoWrapper } from './mongoWrapper';
import { log } from '../logging';

let existingConnection = null; 

export function initDatabase({ testMode = false }) {
  // connect to database
  const { 
    name,
    type,
    path,
  } = config.db;

  if(existingConnection) {
    return existingConnection;
  }

  if (type === "nedb") {
    log.info(`Connecting to nedb database at ${path}...`);
    existingConnection = {
      store: new NedbWrapper(path, testMode),
    };
    return existingConnection;
  } else {
    log.info(`Connecting to mongo database ${name} at ${path}...`);
    const store = new MongoWrapper(path, name, testMode);
    existingConnection = {
      store,
    };
    return existingConnection;
  }
}
