import config from 'config';

// import { MongoWrapper } from './mongoWrapper';
import { PostgresWrapper } from './postgresWrapper';
import { log } from '../logging';
import { getUUIDGenerator } from './uuid';

let existingConnection = null;

export function initDatabase() {
  // connect to database
  if (existingConnection) {
    return existingConnection;
  }

  const { username, name } = config.db;
  log.info(`Connecting to postgres database ${username}@${name}`);
  const store = new PostgresWrapper({
    ...config.db,
    log,
  });
  existingConnection = { store };
  return existingConnection;
}

export async function closeDatabase() {
  if (existingConnection) {
    await existingConnection.store.close();
    existingConnection = null;
  }
}
