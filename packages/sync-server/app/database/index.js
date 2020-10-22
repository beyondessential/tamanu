import config from 'config';

import { NedbWrapper } from './nedbWrapper';
import { MongoWrapper } from './mongoWrapper';
import { log } from '../logging';

let existingConnection = null; 

export function initDatabase({ testMode = false }) {
  // connect to database
  const { 
    username, 
    password, 
    name,
    type,
    path,
  } = config.db;

  if(existingConnection) {
    return existingConnection;
  }

  if (type === "nedb") {
    const path = nedbPath;
    log.info(`Connecting to nedb database at ${path}...`);
    existingConnection = {
      store: new NedbWrapper(path, testMode),
    };
    return existingConnection;
  } else {
    log.info(`Connecting to mongo database ${username}@${name}...`);
    const store = new MongoWrapper(path, testMode);
    existingConnection = {
      store,
    };
    return existingConnection;
  }
}
