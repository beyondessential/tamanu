import config from 'config';

import { NedbWrapper } from './nedbWrapper';
import { log } from '../logging';

let existingConnection = null; 

export function initDatabase({ testMode = false }) {
  // connect to database
  const { username, password, name, nedbPath } = config.db;

  if (testMode || nedbPath) {
    if(existingConnection) {
      return existingConnection;
    }
    const path = nedbPath;
    log.info(`Connecting to nedb database at ${path}...`);
    existingConnection = {
      store: new NedbWrapper(path, testMode),
    };
    return existingConnection;
  } else {
    log.info(`Connecting to mongo database ${username}@${name}...`);
    throw new Error("Mongo DB support is not yet implemented");
  }
}
